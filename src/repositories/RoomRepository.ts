import { PrismaClient, RoomType } from '@prisma/client';
import { RoomDto, RoomQuery } from '../types';
import { Prisma } from '@prisma/client';

type PrismaTransaction = Parameters<Parameters<PrismaClient['$transaction']>[0]>[0];
type PrismaInstance = PrismaClient | PrismaTransaction;

export const findMany = async (prisma: PrismaInstance, query: RoomQuery) => {
  const page = query.page || 1;
  const limit = Math.min(query.limit || 20, 100);
  const skip = (page - 1) * limit;

  const where: any = {
    isPublic: true
  };

  if (query.search) {
    where.OR = [
      { name: { contains: query.search, mode: 'insensitive' } },
      { description: { contains: query.search, mode: 'insensitive' } }
    ];
  }

  if (query.type) {
    where.type = query.type;
  }

  if (query.country) {
    where.country = { contains: query.country, mode: 'insensitive' };
  }

  const [rooms, total] = await Promise.all([
    prisma.room.findMany({
      where,
      include: {
        createdBy: {
          select: {
            id: true,
            username: true,
            role: true
          }
        },
        _count: {
          select: {
            members: true,
            messages: true
          }
        }
      },
      orderBy: [
        { memberCount: 'desc' },
        { createdAt: 'desc' }
      ],
      skip,
      take: limit
    }),
    prisma.room.count({ where })
  ]);

  return {
    rooms,
    total,
    pagination: {
      page,
      limit,
      total,
      pages: Math.ceil(total / limit)
    }
  };
};

export const findById = async (prisma: PrismaClient, id: string) => {
  if (!id || typeof id !== 'string' || id.trim() === '') {
    throw new Error('Invalid room ID');
  }

  try {
    return await prisma.room.findUnique({
      where: { id },
      include: {
        createdBy: {
          select: {
            id: true,
            username: true,
            avatar: true,
            role: true
          }
        },
        _count: {
          select: {
            members: true,
            messages: true
          }
        }
      }
    });
  } catch (error) {
    console.error('Error fetching room by ID:', error);
    throw new Error('Failed to fetch room');
  }
};

export const create = async (prisma: PrismaInstance, userId: string, roomData: RoomDto) => {
  if (!userId || typeof userId !== 'string' || userId.trim() === '') {
    throw new Error('Invalid user ID');
  }

  try {
    const data: Prisma.RoomCreateInput = {
      name: roomData.name,
      description: roomData.description ?? null,
      type: roomData.type as RoomType,
      country: roomData.country ?? null,
      isPublic: roomData.isPublic ?? true,
      maxMembers: roomData.maxMembers ?? 100,
      createdBy: {
        connect: { id: userId }
      }
    };

    return await prisma.room.create({
      data,
      include: {
        createdBy: {
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
    console.error('Error creating room:', error);
    throw new Error('Failed to create room');
  }
};

export const update = async (prisma: PrismaClient, id: string, roomData: Partial<RoomDto>) => {
  if (!id || typeof id !== 'string' || id.trim() === '') {
    throw new Error('Invalid room ID');
  }

  try {
    return await prisma.room.update({
      where: { id },
      data: {
        ...(roomData.name && { name: roomData.name }),
        ...(roomData.description !== undefined && { description: roomData.description }),
        ...(roomData.type && { type: roomData.type as any }),
        ...(roomData.country !== undefined && { country: roomData.country }),
        ...(roomData.isPublic !== undefined && { isPublic: roomData.isPublic }),
        ...(roomData.maxMembers && { maxMembers: roomData.maxMembers }),
        ...(roomData as any).createdById && { createdById: (roomData as any).createdById }
      },
      include: {
        createdBy: {
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
    console.error('Error updating room:', error);
    throw new Error('Failed to update room');
  }
};

export const delete_ = async (prisma: PrismaClient, id: string) => {
  if (!id || typeof id !== 'string' || id.trim() === '') {
    throw new Error('Invalid room ID');
  }

  try {
    return await prisma.room.delete({
      where: { id }
    });
  } catch (error) {
    console.error('Error deleting room:', error);
    throw new Error('Failed to delete room');
  }
};

export const incrementMemberCount = async (prisma: PrismaInstance, id: string) => {
  if (!id || typeof id !== 'string' || id.trim() === '') {
    throw new Error('Invalid room ID');
  }

  return await prisma.room.update({
    where: { id },
    data: {
      memberCount: {
        increment: 1
      }
    }
  });
};

export const decrementMemberCount = async (prisma: PrismaInstance, id: string) => {
  if (!id || typeof id !== 'string' || id.trim() === '') {
    throw new Error('Invalid room ID');
  }

  return await prisma.room.update({
    where: { id },
    data: {
      memberCount: {
        decrement: 1
      }
    }
  });
};

export const findManyWithMembersAndMessages = async (prisma: PrismaInstance, query: RoomQuery) => {
  const page = query.page || 1;
  const limit = Math.min(query.limit || 20, 100);
  const skip = (page - 1) * limit;

  const where: any = {
    isPublic: true
  };

  if (query.search) {
    where.OR = [
      { name: { contains: query.search, mode: 'insensitive' } },
      { description: { contains: query.search, mode: 'insensitive' } }
    ];
  }

  if (query.type) {
    where.type = query.type;
  }

  if (query.country) {
    where.country = { contains: query.country, mode: 'insensitive' };
  }

  const [rooms, total] = await Promise.all([
    prisma.room.findMany({
      where,
      include: {
        createdBy: {
          select: {
            id: true,
            username: true,
            role: true,
            avatar: true
          }
        },
        members: {
          take: 5,
          orderBy: [
            { isAdmin: 'desc' },
            { joinedAt: 'asc' }
          ],
          include: {
            user: {
              select: {
                id: true,
                username: true,
                avatar: true,
                role: true,
                isOnline: true
              }
            }
          }
        },
        messages: {
          take: 3,
          orderBy: { createdAt: 'desc' },
          include: {
            user: {
              select: {
                id: true,
                username: true,
                avatar: true
              }
            }
          }
        },
        _count: {
          select: {
            members: true,
            messages: true
          }
        }
      },
      orderBy: [
        { memberCount: 'desc' },
        { createdAt: 'desc' }
      ],
      skip,
      take: limit
    }),
    prisma.room.count({ where })
  ]);

  const transformedRooms = rooms.map(room => ({
    ...room,
    hasMoreMembers: room._count.members > room.members.length,
    hasMoreMessages: room._count.messages > room.messages.length,
    lastMessage: room.messages[0] || null
  }));

  return {
    rooms: transformedRooms,
    total,
    pagination: {
      page,
      limit,
      total,
      pages: Math.ceil(total / limit)
    }
  };
};

export const getCountriesStats = async (prisma: PrismaClient) => {
  const rooms = await prisma.room.findMany({
    where: { country: { not: null } },
    select: { country: true }
  });

  const map = new Map<string, number>();
  rooms.forEach(r => {
    const country = r.country as string | null;
    if (country) {
      map.set(country, (map.get(country) || 0) + 1);
    }
  });

  return Array.from(map.entries()).map(([country, count]) => ({ country, count }));
}; 