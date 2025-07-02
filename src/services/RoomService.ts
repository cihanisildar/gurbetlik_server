import { PrismaClient } from '@prisma/client';
import { RoomQuery, RoomDto } from '../types';
import * as roomRepository from '../repositories/RoomRepository';
import * as roomMemberRepository from '../repositories/RoomMemberRepository';
import * as messageRepository from '../repositories/MessageRepository';
import { getOnlineMembersForRoom } from './SocketService';

// Input validation helpers
const validateAuthentication = (userId?: string): void => {
  if (!userId) {
    throw new Error('Authentication required');
  }
};

const validateRoomId = (id: string | undefined): string => {
  if (!id || typeof id !== 'string' || id.trim() === '') {
    throw new Error('Invalid room ID');
  }
  return id;
};

export const createRoom = async (prisma: PrismaClient, userId: string, roomData: RoomDto) => {
  validateAuthentication(userId);
  
  // Create room
  const room = await roomRepository.create(prisma, userId, roomData);
  
  // Add creator as admin member
  await roomMemberRepository.create(prisma, userId, room.id, true);
  
  // Increment member count
  await roomRepository.incrementMemberCount(prisma, room.id);
  
  return room;
};

export const getRooms = async (prisma: PrismaClient, query: RoomQuery, userId?: string) => {
  const result = await roomRepository.findMany(prisma, query);
  
  // If userId provided, check membership for all rooms at once (optimized)
  if (userId) {
    const roomIds = result.rooms.map(room => room.id);
    const memberships = await prisma.roomMember.findMany({
      where: {
        userId,
        roomId: { in: roomIds }
      },
      select: { roomId: true }
    });
    
    const memberRoomIds = new Set(memberships.map(m => m.roomId));
    
    const roomsWithMembership = result.rooms.map(room => ({
      ...room,
      isMember: memberRoomIds.has(room.id)
    }));
    
    return {
      ...result,
      rooms: roomsWithMembership
    };
  }
  
  // If no userId, add isMember: false for all rooms
  return {
    ...result,
    rooms: result.rooms.map(room => ({
      ...room,
      isMember: false
    }))
  };
};

export const getRoomById = async (prisma: PrismaClient, roomId: string, userId?: string) => {
  const validatedRoomId = validateRoomId(roomId);
  
  const room = await roomRepository.findById(prisma, validatedRoomId);
  
  if (!room) {
    throw new Error('Room not found');
  }

  // If userId provided, check if user is a member
  let isMember = false;
  if (userId) {
    const membership = await roomMemberRepository.findByUserAndRoom(prisma, userId, validatedRoomId);
    isMember = !!membership;
  }

  // Fetch online members for the room
  const onlineMembers = await getOnlineMembersForRoom(prisma, validatedRoomId);

  return {
    ...room,
    isMember,
    onlineMembers
  };
};

export const joinRoom = async (prisma: PrismaClient, userId: string, roomId: string) => {
  validateAuthentication(userId);
  const validatedRoomId = validateRoomId(roomId);

  // Check if already a member
  const existingMember = await roomMemberRepository.findByUserAndRoom(prisma, userId, validatedRoomId);
  if (existingMember) {
    throw new Error('Already a member of this room');
  }

  // Add member
  await roomMemberRepository.create(prisma, userId, validatedRoomId);

  // Increment member count
  await roomRepository.incrementMemberCount(prisma, validatedRoomId);

  return { message: 'Joined room successfully' };
};

export const leaveRoom = async (prisma: PrismaClient, userId: string, roomId: string) => {
  validateAuthentication(userId);
  const validatedRoomId = validateRoomId(roomId);

  // Check if member
  const membership = await roomMemberRepository.findByUserAndRoom(prisma, userId, validatedRoomId);
  if (!membership) {
    throw new Error('Not a member of this room');
  }

  // Remove member
  await roomMemberRepository.deleteByUserAndRoom(prisma, userId, validatedRoomId);

  // Decrement member count
  await roomRepository.decrementMemberCount(prisma, validatedRoomId);

  // Check if the leaving user is the owner
  const room = await roomRepository.findById(prisma, validatedRoomId);
  if (room && room.createdBy.id === userId) {
    // Find the next eligible member (prefer admin, then oldest member)
    const remainingMembers = await prisma.roomMember.findMany({
      where: { roomId: validatedRoomId },
      orderBy: [
        { isAdmin: 'desc' },
        { joinedAt: 'asc' }
      ],
      include: { user: true }
    });
    if (remainingMembers.length > 0 && remainingMembers[0]?.user) {
      // Transfer ownership to the next eligible member
      const newOwner = remainingMembers[0].user!;
      await roomRepository.update(prisma, validatedRoomId, { createdById: newOwner.id } as any);
    }
    // If no members remain, do nothing (room will have no owner)
  }

  return { message: 'Left room successfully' };
};

export const getMessages = async (prisma: PrismaClient, roomId: string, userId: string, query: any) => {
  validateAuthentication(userId);
  const validatedRoomId = validateRoomId(roomId);

  // Check if user is a member
  const membership = await roomMemberRepository.findByUserAndRoom(prisma, userId, validatedRoomId);
  if (!membership) {
    throw new Error('You are not a member of this room');
  }

  return await messageRepository.findByRoomId(prisma, validatedRoomId, query);
};

export const createMessage = async (prisma: PrismaClient, userId: string, roomId: string, messageData: { content: string }) => {
  validateAuthentication(userId);
  const validatedRoomId = validateRoomId(roomId);

  // Check if user is a member
  const membership = await roomMemberRepository.findByUserAndRoom(prisma, userId, validatedRoomId);
  if (!membership) {
    throw new Error('You are not a member of this room');
  }

  return await messageRepository.create(prisma, userId, validatedRoomId, messageData);
};

export const getRoomsWithMembersAndMessages = async (prisma: PrismaClient, query: RoomQuery, userId?: string) => {
  const result = await roomRepository.findManyWithMembersAndMessages(prisma, query);
  
  // If userId provided, check membership for all rooms at once (optimized)
  if (userId) {
    const roomIds = result.rooms.map(room => room.id);
    const memberships = await prisma.roomMember.findMany({
      where: {
        userId,
        roomId: { in: roomIds }
      },
      select: { roomId: true }
    });
    
    const memberRoomIds = new Set(memberships.map(m => m.roomId));
    
    const roomsWithMembership = result.rooms.map(room => ({
      ...room,
      isMember: memberRoomIds.has(room.id)
    }));
    
    return {
      ...result,
      rooms: roomsWithMembership
    };
  }
  
  // If no userId, add isMember: false for all rooms
  return {
    ...result,
    rooms: result.rooms.map(room => ({
      ...room,
      isMember: false
    }))
  };
};

export const sendMessage = async (prisma: PrismaClient, userId: string, roomId: string, messageData: { content: string }) => {
  validateAuthentication(userId);
  const validatedRoomId = validateRoomId(roomId);

  // Check if user is a member
  const membership = await roomMemberRepository.findByUserAndRoom(prisma, userId, validatedRoomId);
  if (!membership) {
    throw new Error('You are not a member of this room');
  }

  return await messageRepository.sendMessage(prisma, userId, validatedRoomId, messageData);
};

export const getCountriesStats = async (prisma: PrismaClient) => {
  return await roomRepository.getCountriesStats(prisma);
}; 