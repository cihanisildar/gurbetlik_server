import { PrismaClient } from '@prisma/client';

type PrismaInstance = PrismaClient;

export const findByUserAndPost = async (prisma: PrismaInstance, userId: string, postId: string) => {
  if (!userId || typeof userId !== 'string' || userId.trim() === '') {
    throw new Error('Invalid user ID');
  }
  if (!postId || typeof postId !== 'string' || postId.trim() === '') {
    throw new Error('Invalid post ID');
  }

  return await prisma.postSave.findUnique({
    where: {
      userId_postId: { userId, postId }
    }
  });
};

export const create = async (prisma: PrismaInstance, userId: string, postId: string) => {
  if (!userId || typeof userId !== 'string' || userId.trim() === '') {
    throw new Error('Invalid user ID');
  }
  if (!postId || typeof postId !== 'string' || postId.trim() === '') {
    throw new Error('Invalid post ID');
  }

  try {
    return await prisma.postSave.create({
      data: {
        userId,
        postId
      }
    });
  } catch (error) {
    console.error('Error saving post:', error);
    throw new Error('Failed to save post');
  }
};

export const deleteByUserAndPost = async (prisma: PrismaInstance, userId: string, postId: string) => {
  if (!userId || typeof userId !== 'string' || userId.trim() === '') {
    throw new Error('Invalid user ID');
  }
  if (!postId || typeof postId !== 'string' || postId.trim() === '') {
    throw new Error('Invalid post ID');
  }

  try {
    return await prisma.postSave.delete({
      where: {
        userId_postId: { userId, postId }
      }
    });
  } catch (error) {
    console.error('Error unsaving post:', error);
    throw new Error('Failed to unsave post');
  }
};

export const findSavedPostsByUser = async (
  prisma: PrismaInstance, 
  userId: string, 
  page: number = 1, 
  limit: number = 20
) => {
  if (!userId || typeof userId !== 'string' || userId.trim() === '') {
    throw new Error('Invalid user ID');
  }

  const skip = (page - 1) * limit;

  const [saves, total] = await Promise.all([
    prisma.postSave.findMany({
      where: { userId },
      include: {
        post: {
          include: {
            user: {
              select: {
                id: true,
                username: true,
                role: true,
                avatar: true
              }
            },
            city: {
              select: {
                id: true,
                name: true,
                country: true
              }
            }
          }
        }
      },
      orderBy: { createdAt: 'desc' },
      skip,
      take: limit
    }),
    prisma.postSave.count({ where: { userId } })
  ]);

  return {
    posts: saves.map(save => save.post),
    total,
    pagination: {
      page,
      limit,
      total,
      pages: Math.ceil(total / limit)
    }
  };
}; 