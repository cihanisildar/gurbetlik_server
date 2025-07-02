import { PrismaClient } from '@prisma/client';

// Type alias for clarity
type PrismaInstance = PrismaClient;

export const findByUserAndReview = async (prisma: PrismaInstance, userId: string, cityReviewId: string) => {
  if (!userId || typeof userId !== 'string' || userId.trim() === '') {
    throw new Error('Invalid user ID');
  }
  if (!cityReviewId || typeof cityReviewId !== 'string' || cityReviewId.trim() === '') {
    throw new Error('Invalid city review ID');
  }

  return await (prisma as any).cityReviewSave.findUnique({
    where: {
      userId_cityReviewId: { userId, cityReviewId }
    }
  });
};

export const create = async (prisma: PrismaInstance, userId: string, cityReviewId: string) => {
  if (!userId || typeof userId !== 'string' || userId.trim() === '') {
    throw new Error('Invalid user ID');
  }
  if (!cityReviewId || typeof cityReviewId !== 'string' || cityReviewId.trim() === '') {
    throw new Error('Invalid city review ID');
  }

  try {
    return await (prisma as any).cityReviewSave.create({
      data: {
        userId,
        cityReviewId
      }
    });
  } catch (error) {
    console.error('Error saving city review:', error);
    throw new Error('Failed to save city review');
  }
};

export const deleteByUserAndReview = async (prisma: PrismaInstance, userId: string, cityReviewId: string) => {
  if (!userId || typeof userId !== 'string' || userId.trim() === '') {
    throw new Error('Invalid user ID');
  }
  if (!cityReviewId || typeof cityReviewId !== 'string' || cityReviewId.trim() === '') {
    throw new Error('Invalid city review ID');
  }

  try {
    return await (prisma as any).cityReviewSave.delete({
      where: {
        userId_cityReviewId: { userId, cityReviewId }
      }
    });
  } catch (error) {
    console.error('Error unsaving city review:', error);
    throw new Error('Failed to unsave city review');
  }
};

export const findSavedReviewsByUser = async (
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
    (prisma as any).cityReviewSave.findMany({
      where: { userId },
      include: {
        cityReview: {
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
                country: true,
                slug: true
              }
            }
          }
        }
      },
      orderBy: { createdAt: 'desc' },
      skip,
      take: limit
    }),
    (prisma as any).cityReviewSave.count({ where: { userId } })
  ]);

  return {
    reviews: saves.map((save: any) => save.cityReview),
    total,
    pagination: {
      page,
      limit,
      total,
      pages: Math.ceil(total / limit)
    }
  };
}; 