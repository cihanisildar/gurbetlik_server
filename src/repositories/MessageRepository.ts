import { PrismaClient } from '@prisma/client';
import { MessageDto } from '../types';

export const findByRoomId = async (prisma: PrismaClient, roomId: string, query: any) => {
  if (!roomId || typeof roomId !== 'string' || roomId.trim() === '') {
    throw new Error('Invalid room ID');
  }

  const page = Math.max(1, query.page || 1);
  const limit = Math.min(Math.max(1, query.limit || 50), 100);
  const skip = (page - 1) * limit;

  try {
    const [messages, total] = await Promise.all([
      prisma.message.findMany({
        where: { roomId },
        include: {
          user: {
            select: {
              id: true,
              username: true,
              avatar: true,
              role: true
            }
          }
        },
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit
      }),
      prisma.message.count({ where: { roomId } })
    ]);

    return {
      messages: messages.reverse(), // Reverse to show oldest first
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit),
        hasNext: page < Math.ceil(total / limit),
        hasPrev: page > 1
      }
    };
  } catch (error) {
    console.error('Error fetching messages by room ID:', error);
    throw new Error('Failed to fetch messages');
  }
};

export const findById = async (prisma: PrismaClient, id: string) => {
  if (!id || typeof id !== 'string' || id.trim() === '') {
    throw new Error('Invalid message ID');
  }

  try {
    return await prisma.message.findUnique({
      where: { id },
      include: {
        user: {
          select: {
            id: true,
            username: true,
            avatar: true,
            role: true
          }
        },
        room: {
          select: {
            id: true,
            name: true,
            type: true
          }
        }
      }
    });
  } catch (error) {
    console.error('Error fetching message by ID:', error);
    throw new Error('Failed to fetch message');
  }
};

export const create = async (prisma: PrismaClient, userId: string, roomId: string, messageData: MessageDto) => {
  if (!userId || typeof userId !== 'string' || userId.trim() === '') {
    throw new Error('Invalid user ID');
  }
  if (!roomId || typeof roomId !== 'string' || roomId.trim() === '') {
    throw new Error('Invalid room ID');
  }

  try {
    return await prisma.message.create({
      data: {
        content: messageData.content,
        user: {
          connect: { id: userId }
        },
        room: {
          connect: { id: roomId }
        }
      },
      include: {
        user: {
          select: {
            id: true,
            username: true,
            avatar: true,
            role: true
          }
        }
      }
    });
  } catch (error) {
    console.error('Error creating message:', error);
    throw new Error('Failed to create message');
  }
};

export const update = async (prisma: PrismaClient, id: string, messageData: Partial<MessageDto>) => {
  if (!id || typeof id !== 'string' || id.trim() === '') {
    throw new Error('Invalid message ID');
  }

  try {
    return await prisma.message.update({
      where: { id },
      data: messageData,
      include: {
        user: {
          select: {
            id: true,
            username: true,
            avatar: true,
            role: true
          }
        }
      }
    });
  } catch (error) {
    console.error('Error updating message:', error);
    throw new Error('Failed to update message');
  }
};

export const delete_ = async (prisma: PrismaClient, id: string) => {
  if (!id || typeof id !== 'string' || id.trim() === '') {
    throw new Error('Invalid message ID');
  }

  try {
    return await prisma.message.delete({
      where: { id }
    });
  } catch (error) {
    console.error('Error deleting message:', error);
    throw new Error('Failed to delete message');
  }
};

export const countByRoom = async (prisma: PrismaClient, roomId: string) => {
  if (!roomId || typeof roomId !== 'string' || roomId.trim() === '') {
    throw new Error('Invalid room ID');
  }
  return await prisma.message.count({ where: { roomId } });
};

export const findRecentByRoom = async (prisma: PrismaClient, roomId: string, limit: number = 50) => {
  if (!roomId || typeof roomId !== 'string' || roomId.trim() === '') {
    throw new Error('Invalid room ID');
  }

  return await prisma.message.findMany({
    where: { roomId },
    include: {
      user: {
        select: {
          id: true,
          username: true,
          avatar: true,
          role: true
        }
      }
    },
    orderBy: { createdAt: 'desc' },
    take: limit
  });
};

export const sendMessage = async (prisma: PrismaClient, userId: string, roomId: string, messageData: { content: string }) => {
  return await create(prisma, userId, roomId, messageData);
}; 