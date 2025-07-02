import { PrismaClient } from '@prisma/client';

type PrismaInstance = PrismaClient;

export const findByUserAndRoom = async (prisma: PrismaInstance, userId: string, roomId: string) => {
  if (!userId || typeof userId !== 'string' || userId.trim() === '') {
    throw new Error('Invalid user ID');
  }
  if (!roomId || typeof roomId !== 'string' || roomId.trim() === '') {
    throw new Error('Invalid room ID');
  }

  try {
    return await prisma.roomMember.findUnique({
      where: {
        userId_roomId: { userId, roomId }
      },
      include: {
        user: {
          select: {
            id: true,
            username: true,
            avatar: true,
            role: true,
            isOnline: true,
            lastSeen: true
          }
        },
        room: {
          select: {
            id: true,
            name: true,
            type: true,
            isPublic: true
          }
        }
      }
    });
  } catch (error) {
    console.error('Error finding room member:', error);
    throw new Error('Failed to find room member');
  }
};

export const findByRoomId = async (prisma: PrismaClient, roomId: string, query: any) => {
  if (!roomId || typeof roomId !== 'string' || roomId.trim() === '') {
    throw new Error('Invalid room ID');
  }

  const page = Math.max(1, query.page || 1);
  const limit = Math.min(Math.max(1, query.limit || 50), 100);
  const skip = (page - 1) * limit;

  try {
    const [members, total] = await Promise.all([
      prisma.roomMember.findMany({
        where: { roomId },
        include: {
          user: {
            select: {
              id: true,
              username: true,
              avatar: true,
              role: true,
              isOnline: true,
              lastSeen: true
            }
          }
        },
        orderBy: [
          { isAdmin: 'desc' },
          { joinedAt: 'asc' }
        ],
        skip,
        take: limit
      }),
      prisma.roomMember.count({ where: { roomId } })
    ]);

    return {
      members,
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
    console.error('Error fetching room members:', error);
    throw new Error('Failed to fetch room members');
  }
};

export const findByUserId = async (prisma: PrismaClient, userId: string) => {
  if (!userId || typeof userId !== 'string' || userId.trim() === '') {
    throw new Error('Invalid user ID');
  }

  try {
    return await prisma.roomMember.findMany({
      where: { userId },
      include: {
        room: {
          select: {
            id: true,
            name: true,
            description: true,
            type: true,
            country: true,
            isPublic: true,
            memberCount: true,
            createdAt: true
          }
        }
      },
      orderBy: { joinedAt: 'desc' }
    });
  } catch (error) {
    console.error('Error fetching user room memberships:', error);
    throw new Error('Failed to fetch user room memberships');
  }
};

export const create = async (prisma: PrismaInstance, userId: string, roomId: string, isAdmin: boolean = false) => {
  if (!userId || typeof userId !== 'string' || userId.trim() === '') {
    throw new Error('Invalid user ID');
  }
  if (!roomId || typeof roomId !== 'string' || roomId.trim() === '') {
    throw new Error('Invalid room ID');
  }

  try {
    return await prisma.roomMember.create({
      data: {
        user: {
          connect: { id: userId }
        },
        room: {
          connect: { id: roomId }
        },
        isAdmin
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
    console.error('Error creating room member:', error);
    throw new Error('Failed to create room member');
  }
};

export const delete_ = async (prisma: PrismaInstance, id: string) => {
  if (!id || typeof id !== 'string' || id.trim() === '') {
    throw new Error('Invalid member ID');
  }
  return await prisma.roomMember.delete({ where: { id } });
};

export const deleteByUserAndRoom = async (prisma: PrismaClient, userId: string, roomId: string) => {
  if (!userId || typeof userId !== 'string' || userId.trim() === '') {
    throw new Error('Invalid user ID');
  }
  if (!roomId || typeof roomId !== 'string' || roomId.trim() === '') {
    throw new Error('Invalid room ID');
  }

  return await prisma.roomMember.delete({
    where: {
      userId_roomId: { userId, roomId }
    }
  });
};

export const updateAdminStatus = async (prisma: PrismaClient, id: string, isAdmin: boolean) => {
  if (!id || typeof id !== 'string' || id.trim() === '') {
    throw new Error('Invalid member ID');
  }

  try {
    return await prisma.roomMember.update({
      where: { id },
      data: { isAdmin },
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
    console.error('Error updating admin status:', error);
    throw new Error('Failed to update admin status');
  }
};

export const countByRoom = async (prisma: PrismaClient, roomId: string) => {
  if (!roomId || typeof roomId !== 'string' || roomId.trim() === '') {
    throw new Error('Invalid room ID');
  }
  return await prisma.roomMember.count({ where: { roomId } });
}; 