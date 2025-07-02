import { Server as SocketIOServer, Socket } from 'socket.io';
import jwt from 'jsonwebtoken';
import { PrismaClient, User } from '@prisma/client';
import * as roomService from './RoomService';
import * as userRepository from '../repositories/UserRepository';
import { jwtSecret } from '../config/secrets';
import * as messageRepository from '../repositories/MessageRepository';
import { parse as parseCookie } from 'cookie';

interface AuthenticatedSocket extends Socket {
  user?: {
    id: string;
    email: string;
    name?: string;
  };
}

const connectedUsers = new Map<string, AuthenticatedSocket>();

// Rate limiting for socket authentication per IP
const socketAuthLimiter = new Map<string, { attempts: number; lastAttempt: number }>();

const authenticateSocketUser = async (token: string, ip: string, prisma: PrismaClient): Promise<{ id: string; email: string } | null> => {
  // Rate limiting per IP
  const now = Date.now();
  const clientLimit = socketAuthLimiter.get(ip) || { attempts: 0, lastAttempt: 0 };
  
  // Check if IP is rate limited (5 attempts per 15 minutes)
  if (clientLimit.attempts >= 5 && now - clientLimit.lastAttempt < 15 * 60 * 1000) {
    console.warn(`Socket authentication rate limit exceeded for IP: ${ip}`);
    throw new Error('Too many authentication attempts');
  }

  try {
    // Verify and decode token
    const decoded = jwt.verify(token, jwtSecret) as { userId: string; email: string; type: string };
    
    // Verify token type is access token
    if (decoded.type !== 'access') {
      throw new Error('Invalid token type for socket connection');
    }
    
    // Verify user still exists and is active in database
    const user = await prisma.user.findUnique({
      where: { id: decoded.userId },
      select: { 
        id: true, 
        email: true, 
        isOnline: true,
        createdAt: true  // Basic user verification
      }
    });
    
    if (!user) {
      throw new Error('User not found or inactive');
    }
    
    // Reset rate limit on successful authentication
    socketAuthLimiter.delete(ip);
    
    return { id: decoded.userId, email: decoded.email };
  } catch (error) {
    // Update rate limit on failure
    socketAuthLimiter.set(ip, {
      attempts: clientLimit.attempts + 1,
      lastAttempt: now
    });
    
    console.error(`Socket authentication failed for IP ${ip}:`, error instanceof Error ? error.message : 'Unknown error');
    throw error;
  }
};

// Map to store user socket connections
const userSockets = new Map<string, string>(); // userId -> socketId
const socketUsers = new Map<string, string>(); // socketId -> userId

// Room management maps
const roomMembers = new Map<string, Set<string>>(); // roomId -> Set of socketIds

const updateUserOnlineStatus = async (prisma: PrismaClient, userId: string, isOnline: boolean) => {
  await prisma.user.update({
    where: { id: userId },
    data: { isOnline, lastSeen: new Date() }
  });
};

const broadcastOnlineMembersUpdate = async (prisma: PrismaClient, io: SocketIOServer, roomId: string) => {
  const onlineMembers = await getOnlineMembersForRoom(prisma, roomId);
  console.log('[Socket] Emitting online_members_update for room', roomId, 'with members:', onlineMembers.map(u => u.username));
  io.to(`room_${roomId}`).emit('online_members_update', { roomId, onlineMembers });
};

const handleJoinRoom = async (
  socket: AuthenticatedSocket, 
  prisma: PrismaClient, 
  data: { 
    roomId: string 
  }
) => {
  try {
    if (!socket.user) return;

    const { roomId } = data;
    
    // Verify user is a member of the room
    const membership = await prisma.roomMember.findUnique({
      where: {
        userId_roomId: {
          userId: socket.user.id,
          roomId: roomId
        }
      }
    });

    if (!membership) {
      socket.emit('error', { message: 'Not authorized to join this room' });
      return;
    }

    // Join the socket room
    await socket.join(`room_${roomId}`);
    
    // Track room membership in memory
    if (!roomMembers.has(roomId)) {
      roomMembers.set(roomId, new Set());
    }
    roomMembers.get(roomId)?.add(socket.id);

    socket.emit('joined_room', { roomId });

    // Fetch updated online members and emit to all in room
    const onlineMembers = await getOnlineMembersForRoom(prisma, roomId);
    socket.nsp.to(`room_${roomId}`).emit('online_members_update', { roomId, onlineMembers });
    console.log(`[Socket] User ${socket.user.id} joined room ${roomId}. Online members:`, onlineMembers.map(u => u.username));
  } catch (error) {
    socket.emit('error', { message: 'Failed to join room' });
  }
};

const handleLeaveRoom = (socket: AuthenticatedSocket, roomId: string, prisma?: PrismaClient) => {
  socket.leave(`room_${roomId}`);
  
  // Remove from room members tracking
  const members = roomMembers.get(roomId);
  if (members) {
    members.delete(socket.id);
    if (members.size === 0) {
      roomMembers.delete(roomId);
    }
  }

  socket.emit('left_room', { roomId });

  // Emit updated online members
  if (prisma) {
    getOnlineMembersForRoom(prisma, roomId).then(onlineMembers => {
      socket.nsp.to(`room_${roomId}`).emit('online_members_update', { roomId, onlineMembers });
      console.log(`[Socket] User left room ${roomId}. Online members:`, onlineMembers.map(u => u.username));
    });
  }
};

const handleSendMessage = async (
  socket: AuthenticatedSocket,
  prisma: PrismaClient,
  data: { roomId: string; content: string }
) => {
  try {
    if (!socket.user) return;

    const { roomId, content } = data;

    // Verify user is a member of the room before sending message
    const membership = await prisma.roomMember.findUnique({
      where: {
        userId_roomId: {
          userId: socket.user.id,
          roomId: roomId
        }
      }
    });

    if (!membership) {
      socket.emit('error', { message: 'Not authorized to send messages in this room' });
      return;
    }

    // Create message in database
    const message = await messageRepository.create(prisma, socket.user.id, roomId, { content });

    // Broadcast to room members (including full user info) - emit to all including sender
    if (ioInstance) {
      ioInstance.to(`room_${roomId}`).emit('new_message', {
        id: message.id,
        content: message.content,
        userId: socket.user.id,
        roomId: roomId,
        createdAt: message.createdAt,
        user: message.user // Use the full user info from message creation
      });
    }

    // Confirm to sender
    socket.emit('message_sent', { messageId: message.id, message });
  } catch (error) {
    console.error('Error sending message:', error);
    socket.emit('error', { message: 'Failed to send message' });
  }
};

const handleTyping = (socket: AuthenticatedSocket, data: { roomId: string; isTyping: boolean }) => {
  if (!socket.user) return;
  
  const { roomId, isTyping } = data;
  
  socket.to(`room_${roomId}`).emit('user_typing', {
    userId: socket.user.id,
    roomId,
    isTyping
  });
};

const handleDisconnect = async (prisma: PrismaClient, socket: AuthenticatedSocket) => {
  if (socket.user) {
    console.log(`User ${socket.user.id} disconnected`);
    
    // Remove from connected users
    connectedUsers.delete(socket.user.id);
    
    // Update online status in database
    await updateUserOnlineStatus(prisma, socket.user.id, false);
    
    // Notify all rooms that the user was in
    socket.broadcast.emit('user_offline', {
      userId: socket.user.id
    });
  }
};

// Input validation for socket events
const validateSocketInput = (data: any, requiredFields: string[]): boolean => {
  if (!data || typeof data !== 'object') return false;
  if (Array.isArray(data)) return false; // Reject arrays
  
  // Check for prototype pollution attempts
  if (data.__proto__ || data.constructor || data.prototype) return false;
  
  return requiredFields.every(field => {
    const value = data[field];
    if (value === undefined || value === null) return false;
    
    if (typeof value === 'string') {
      // Check string length and content
      if (value.trim() === '' || value.length > 1000) return false;
      // Basic XSS prevention - reject strings with HTML/script tags
      if (/<[^>]*>/i.test(value)) return false;
    }
    
    if (typeof value === 'number') {
      // Check for valid numbers and reasonable ranges
      if (!isFinite(value) || value < -1000000 || value > 1000000) return false;
    }
    
    if (typeof value === 'boolean') {
      // Booleans are always valid
      return true;
    }
    
    // Reject other types for safety
    if (typeof value === 'object' || typeof value === 'function') return false;
    
    return true;
  });
};

// Room health check - clean up orphaned socket connections
export const performRoomHealthCheck = async (prisma: PrismaClient) => {
  console.log('[Socket] Performing room health check...');
  
  for (const [roomId, socketIds] of roomMembers.entries()) {
    const validSocketIds = Array.from(socketIds).filter(socketId => 
      socketUsers.has(socketId) && ioInstance?.sockets.sockets.has(socketId)
    );
    
    if (validSocketIds.length !== socketIds.size) {
      console.log(`[Socket] Cleaning up room ${roomId}: ${socketIds.size - validSocketIds.length} orphaned connections`);
      roomMembers.set(roomId, new Set(validSocketIds));
      
      if (validSocketIds.length === 0) {
        roomMembers.delete(roomId);
      }
    }
  }
};

export const initializeSocket = (io: SocketIOServer, prisma: PrismaClient) => {
  // Store the io instance for utility functions
  ioInstance = io;
  
  io.use(async (socket: any, next) => {
    try {
      // Get token from handshake auth or query
      let token: string | undefined =
        socket.handshake.auth?.token ||
        (socket.handshake.query?.token as string | undefined);

      // Fallback: attempt to read the HttpOnly access token from cookies
      if (!token) {
        const cookies = parseCookie(socket.handshake.headers?.cookie || '');
        token = cookies.gb_accessToken;
      }

      if (!token) {
        console.log('[Socket] Authentication token required');
        return next(new Error('Authentication token required'));
      }

      // Get client IP address
      const clientIP = socket.handshake.address || socket.conn.remoteAddress || 'unknown';

      const user = await authenticateSocketUser(token, clientIP, prisma);
      if (!user) {
        console.log('[Socket] Invalid authentication token');
        return next(new Error('Invalid authentication token'));
      }

      socket.user = user;
      next();
    } catch (error) {
      console.log('[Socket] Authentication failed:', error instanceof Error ? error.message : 'Unknown error');
      next(new Error('Authentication failed'));
    }
  });

  io.on('connection', async (socket: any) => {
    const authenticatedSocket = socket as AuthenticatedSocket;
    console.log('[Socket] New connection:', authenticatedSocket.id);
    
    if (!authenticatedSocket.user) return;

    const userId = authenticatedSocket.user.id;
    
    // Store socket mapping and connected users
    userSockets.set(userId, authenticatedSocket.id);
    socketUsers.set(authenticatedSocket.id, userId);
    connectedUsers.set(userId, authenticatedSocket);
    
    // Update user online status
    await updateUserOnlineStatus(prisma, userId, true);

    console.log(`User ${userId} connected`);

    // Socket event handlers
    authenticatedSocket.on('join_room', (data: { roomId: string }) => {
      if (!validateSocketInput(data, ['roomId'])) {
        authenticatedSocket.emit('error', { message: 'Invalid room ID' });
        return;
      }
      handleJoinRoom(authenticatedSocket, prisma, data);
    });

    authenticatedSocket.on('leave_room', (data: { roomId: string }) => {
      if (!validateSocketInput(data, ['roomId'])) {
        authenticatedSocket.emit('error', { message: 'Invalid room ID' });
        return;
      }
      handleLeaveRoom(authenticatedSocket, data.roomId, prisma);
    });

    authenticatedSocket.on('send_message', (data: { roomId: string; content: string }) => {
      if (!validateSocketInput(data, ['roomId', 'content'])) {
        authenticatedSocket.emit('error', { message: 'Invalid message data' });
        return;
      }
      if (data.content.length > 1000) {
        authenticatedSocket.emit('error', { message: 'Message too long (max 1000 characters)' });
        return;
      }
      handleSendMessage(authenticatedSocket, prisma, data);
    });

    authenticatedSocket.on('typing', (data: { roomId: string; isTyping: boolean }) => {
      if (!validateSocketInput(data, ['roomId']) || typeof data.isTyping !== 'boolean') {
        authenticatedSocket.emit('error', { message: 'Invalid typing data' });
        return;
      }
      handleTyping(authenticatedSocket, data);
    });

    authenticatedSocket.on('disconnect', async () => {
      console.log('[Socket] Disconnected:', authenticatedSocket.id);
      
      // Update user offline status
      await updateUserOnlineStatus(prisma, userId, false);
      
      // Clean up mappings
      userSockets.delete(userId);
      socketUsers.delete(authenticatedSocket.id);
      connectedUsers.delete(userId);
      
      // Clean up room memberships and notify rooms
      const roomsToUpdate: string[] = [];
      for (const [roomId, members] of roomMembers.entries()) {
        if (members.has(authenticatedSocket.id)) {
          members.delete(authenticatedSocket.id);
          roomsToUpdate.push(roomId);
          if (members.size === 0) {
            roomMembers.delete(roomId);
          }
        }
      }
      
      // Update online members for affected rooms
      for (const roomId of roomsToUpdate) {
        const onlineMembers = await getOnlineMembersForRoom(prisma, roomId);
        io.to(`room_${roomId}`).emit('online_members_update', { roomId, onlineMembers });
      }

      console.log(`User ${userId} disconnected`);
    });
  });

  // Set up periodic health checks
  const healthCheckInterval = setInterval(() => {
    performRoomHealthCheck(prisma);
  }, 5 * 60 * 1000); // Every 5 minutes

  // Clean up interval on server shutdown
  process.on('SIGTERM', () => {
    clearInterval(healthCheckInterval);
  });

  console.log('Socket.IO service initialized');
};

export const getConnectedUsers = () => {
  return Array.from(connectedUsers.keys());
};

export const isUserOnline = (userId: string) => {
  return userSockets.has(userId);
};

// Store the io instance globally for utility functions
let ioInstance: SocketIOServer | null = null;

export const sendToUser = (userId: string, event: string, data: any) => {
  const socketId = userSockets.get(userId);
  if (socketId && ioInstance) {
    ioInstance.to(socketId).emit(event, data);
  }
};

export const getOnlineMembersForRoom = async (prisma: PrismaClient, roomId: string): Promise<Partial<User>[]> => {
  const socketIds = roomMembers.get(roomId) ? Array.from(roomMembers.get(roomId)!) : [];
  const userIds = socketIds.map(socketId => socketUsers.get(socketId)).filter(Boolean);
  if (userIds.length === 0) return [];
  // Fetch user details from DB
  return await prisma.user.findMany({
    where: { id: { in: userIds as string[] } },
    select: {
      id: true,
      username: true,
      avatar: true,
      role: true,
      isOnline: true,
      email: true,
      // add more fields if needed to match your User type
    }
  });
};