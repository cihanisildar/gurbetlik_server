import { PrismaClient } from '@prisma/client';
import { CityReviewDto } from '../types';

export const findByUserAndCity = async (prisma: PrismaClient, userId: string, cityId: string) => {
  if (!userId || typeof userId !== 'string' || userId.trim() === '') {
    throw new Error('Invalid user ID');
  }
  if (!cityId || typeof cityId !== 'string' || cityId.trim() === '') {
    throw new Error('Invalid city ID');
  }

  try {
    return await prisma.cityReview.findUnique({
      where: {
        userId_cityId: { userId, cityId }
      },
      include: {
        user: {
          select: {
            id: true,
            username: true,
            avatar: true,
            role: true
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
    });
  } catch (error) {
    console.error('Error fetching city review:', error);
    throw new Error('Failed to fetch city review');
  }
};

export const findByCityId = async (prisma: PrismaClient, cityId: string, query: any, userId?: string) => {
  if (!cityId || typeof cityId !== 'string' || cityId.trim() === '') {
    throw new Error('Invalid city ID');
  }

  const page = Math.max(1, query.page || 1);
  const limit = Math.min(Math.max(1, query.limit || 20), 100);
  const skip = (page - 1) * limit;

  try {
    const [reviews, total] = await Promise.all([
      prisma.cityReview.findMany({
        where: { cityId },
        include: {
          user: {
            select: {
              id: true,
              username: true,
              avatar: true,
              role: true
            }
          },
          saves: userId
            ? {
                where: { userId },
                select: { id: true }
              }
            : false
        },
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit
      }),
      prisma.cityReview.count({ where: { cityId } })
    ]);

    let transformed = reviews;
    if (userId) {
      const votes = await prisma.cityReviewVote.findMany({
        where: {
          userId,
          cityReviewId: { in: reviews.map(r => r.id) }
        }
      });
      const voteMap = new Map(votes.map(v => [v.cityReviewId, v.type]));

      transformed = reviews.map(r => {
        const isSaved = r.saves ? r.saves.length > 0 : false;
        return {
          ...r,
          userVote: voteMap.get(r.id) || null,
          isSaved,
          saves: undefined
        } as any;
      });
    } else {
      transformed = reviews.map(r => ({ ...r, isSaved: false, saves: undefined } as any));
    }

    return {
      reviews: transformed,
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
    console.error('Error fetching city reviews:', error);
    throw new Error('Failed to fetch city reviews');
  }
};

export const create = async (prisma: PrismaClient, userId: string, cityId: string, reviewData: Omit<CityReviewDto, 'cityName' | 'country'>) => {
  if (!userId || typeof userId !== 'string' || userId.trim() === '') {
    throw new Error('Invalid user ID');
  }
  if (!cityId || typeof cityId !== 'string' || cityId.trim() === '') {
    throw new Error('Invalid city ID');
  }

  try {
    return await prisma.cityReview.create({
      data: {
        title: reviewData.title ?? null,
        jobOpportunities: reviewData.jobOpportunities,
        costOfLiving: reviewData.costOfLiving,
        safety: reviewData.safety,
        transport: reviewData.transport,
        community: reviewData.community,
        healthcare: reviewData.healthcare ?? 3,
        education: reviewData.education ?? 3,
        nightlife: reviewData.nightlife ?? 3,
        weather: reviewData.weather ?? 3,
        internet: reviewData.internet ?? 3,
        pros: reviewData.pros ?? [],
        cons: reviewData.cons ?? [],
        note: reviewData.note ?? null,
        images: reviewData.images ?? [],
        language: reviewData.language ?? null,
        user: {
          connect: { id: userId }
        },
        city: {
          connect: { id: cityId }
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
    });
  } catch (error) {
    console.error('Error creating city review:', error);
    throw new Error('Failed to create city review');
  }
};

export const update = async (prisma: PrismaClient, userId: string, reviewId: string, reviewData: Partial<CityReviewDto>) => {
  if (!userId || typeof userId !== 'string' || userId.trim() === '') {
    throw new Error('Invalid user ID');
  }
  if (!reviewId || typeof reviewId !== 'string' || reviewId.trim() === '') {
    throw new Error('Invalid review ID');
  }

  const updateData: any = {};
  if (reviewData.title !== undefined) updateData.title = reviewData.title;
  if (reviewData.jobOpportunities !== undefined) updateData.jobOpportunities = reviewData.jobOpportunities;
  if (reviewData.costOfLiving !== undefined) updateData.costOfLiving = reviewData.costOfLiving;
  if (reviewData.safety !== undefined) updateData.safety = reviewData.safety;
  if (reviewData.transport !== undefined) updateData.transport = reviewData.transport;
  if (reviewData.community !== undefined) updateData.community = reviewData.community;
  if (reviewData.healthcare !== undefined) updateData.healthcare = reviewData.healthcare;
  if (reviewData.education !== undefined) updateData.education = reviewData.education;
  if (reviewData.nightlife !== undefined) updateData.nightlife = reviewData.nightlife;
  if (reviewData.weather !== undefined) updateData.weather = reviewData.weather;
  if (reviewData.internet !== undefined) updateData.internet = reviewData.internet;
  if (reviewData.pros !== undefined) updateData.pros = reviewData.pros;
  if (reviewData.cons !== undefined) updateData.cons = reviewData.cons;
  if (reviewData.note !== undefined) updateData.note = reviewData.note;
  if (reviewData.images !== undefined) updateData.images = reviewData.images;
  if (reviewData.language !== undefined) updateData.language = reviewData.language;

  try {
    // First check if the review exists and belongs to the user
    const review = await prisma.cityReview.findFirst({
      where: {
        id: reviewId,
        userId: userId
      }
    });

    if (!review) {
      throw new Error('Review not found or unauthorized');
    }

    return await prisma.cityReview.update({
      where: {
        id: reviewId
      },
      data: updateData,
      include: {
        user: {
          select: {
            id: true,
            username: true,
            avatar: true,
            role: true
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
    });
  } catch (error) {
    console.error('Error updating city review:', error);
    throw new Error('Failed to update city review');
  }
};

export const getAverageRatings = async (prisma: PrismaClient, cityId: string) => {
  if (!cityId || typeof cityId !== 'string' || cityId.trim() === '') {
    throw new Error('Invalid city ID');
  }

  try {
    const result = await prisma.cityReview.aggregate({
      where: { cityId },
      _avg: {
        jobOpportunities: true,
        costOfLiving: true,
        safety: true,
        transport: true,
        community: true
      },
      _count: {
        id: true
      }
    });

    return {
      averages: {
        jobOpportunities: result._avg.jobOpportunities || 0,
        costOfLiving: result._avg.costOfLiving || 0,
        safety: result._avg.safety || 0,
        transport: result._avg.transport || 0,
        community: result._avg.community || 0
      },
      totalReviews: result._count.id
    };
  } catch (error) {
    console.error('Error calculating average ratings:', error);
    throw new Error('Failed to calculate average ratings');
  }
};

export const findById = async (prisma: PrismaClient, reviewId: string, userId?: string) => {
  if (!reviewId || typeof reviewId !== 'string' || reviewId.trim() === '') {
    throw new Error('Invalid review ID');
  }

  try {
    const review = await prisma.cityReview.findUnique({
      where: { id: reviewId },
      include: {
        user: {
          select: {
            id: true,
            username: true,
            avatar: true,
            role: true
          }
        },
        city: {
          select: {
            id: true,
            name: true,
            country: true,
            slug: true
          }
        },
        saves: userId
          ? {
              where: { userId },
              select: { id: true }
            }
          : false
      }
    });

    if (!review) return null;

    // Attach user-specific fields if requested
    if (userId) {
      const vote = await prisma.cityReviewVote.findUnique({
        where: {
          userId_cityReviewId: { userId, cityReviewId: reviewId }
        }
      });

      const isSaved = review.saves ? review.saves.length > 0 : false;

      return {
        ...review,
        userVote: vote ? vote.type : null,
        isSaved,
        saves: undefined
      } as any;
    }

    return { ...review, isSaved: false } as any;
  } catch (error) {
    console.error('Error finding city review:', error);
    throw new Error('Failed to find city review');
  }
};

export const deleteReview = async (prisma: PrismaClient, userId: string, reviewId: string) => {
  if (!userId || typeof userId !== 'string' || userId.trim() === '') {
    throw new Error('Invalid user ID');
  }
  if (!reviewId || typeof reviewId !== 'string' || reviewId.trim() === '') {
    throw new Error('Invalid review ID');
  }
  try {
    // First check if the review exists and belongs to the user
    const review = await prisma.cityReview.findFirst({
      where: {
        id: reviewId,
        userId: userId
      }
    });

    if (!review) {
      throw new Error('Review not found or unauthorized');
    }

    return await prisma.cityReview.delete({
      where: {
        id: reviewId
      }
    });
  } catch (error) {
    console.error('Error deleting city review:', error);
    throw new Error('Failed to delete city review');
  }
};

export const findAll = async (prisma: PrismaClient, query: any, userId?: string) => {
  const page = Math.max(1, query.page || 1);
  const limit = Math.min(Math.max(1, query.limit || 20), 100);
  const skip = (page - 1) * limit;
  try {
    const [reviews, total] = await Promise.all([
      prisma.cityReview.findMany({
        include: {
          user: {
            select: {
              id: true,
              username: true,
              avatar: true,
              role: true
            }
          },
          city: {
            select: {
              id: true,
              name: true,
              country: true,
              slug: true
            }
          },
          saves: userId
            ? {
                where: { userId },
                select: { id: true }
              }
            : false
        },
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit
      }),
      prisma.cityReview.count()
    ]);

    let transformed = reviews;
    if (userId) {
      const votes = await prisma.cityReviewVote.findMany({
        where: {
          userId,
          cityReviewId: { in: reviews.map(r => r.id) }
        }
      });
      const voteMap = new Map(votes.map(v => [v.cityReviewId, v.type]));

      transformed = reviews.map(r => {
        const isSaved = r.saves ? r.saves.length > 0 : false;
        return {
          ...r,
          userVote: voteMap.get(r.id) || null,
          isSaved,
          saves: undefined
        } as any;
      });
    } else {
      transformed = reviews.map(r => ({ ...r, isSaved: false, saves: undefined } as any));
    }

    return {
      reviews: transformed,
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
    console.error('Error fetching all city reviews:', error);
    throw new Error('Failed to fetch all city reviews');
  }
};

export const upvoteCityReview = async (prisma: PrismaClient, userId: string, cityReviewId: string) => {
  if (!userId || typeof userId !== 'string' || userId.trim() === '') {
    throw new Error('Invalid user ID');
  }
  if (!cityReviewId || typeof cityReviewId !== 'string' || cityReviewId.trim() === '') {
    throw new Error('Invalid city review ID');
  }

  try {
    return await prisma.$transaction(async (tx) => {
      const existingVote = await tx.cityReviewVote.findUnique({
        where: { userId_cityReviewId: { userId, cityReviewId } }
      });

      if (existingVote) {
        if (existingVote.type === 'UPVOTE') {
          // Remove upvote
          await tx.cityReviewVote.delete({
            where: { userId_cityReviewId: { userId, cityReviewId } }
          });
          await tx.cityReview.update({
            where: { id: cityReviewId },
            data: { upvotes: { decrement: 1 } }
          });
        } else {
          // Change downvote to upvote
          await tx.cityReviewVote.update({
            where: { userId_cityReviewId: { userId, cityReviewId } },
            data: { type: 'UPVOTE' }
          });
          await tx.cityReview.update({
            where: { id: cityReviewId },
            data: { upvotes: { increment: 1 }, downvotes: { decrement: 1 } }
          });
        }
      } else {
        // Create new upvote
        await tx.cityReviewVote.create({
          data: { userId, cityReviewId, type: 'UPVOTE' }
        });
        await tx.cityReview.update({
          where: { id: cityReviewId },
          data: { upvotes: { increment: 1 } }
        });
      }
    });
  } catch (error) {
    console.error('Error upvoting city review:', error);
    throw new Error('Failed to upvote city review');
  }
};

export const downvoteCityReview = async (prisma: PrismaClient, userId: string, cityReviewId: string) => {
  if (!userId || typeof userId !== 'string' || userId.trim() === '') {
    throw new Error('Invalid user ID');
  }
  if (!cityReviewId || typeof cityReviewId !== 'string' || cityReviewId.trim() === '') {
    throw new Error('Invalid city review ID');
  }

  try {
    return await prisma.$transaction(async (tx) => {
      const existingVote = await tx.cityReviewVote.findUnique({
        where: { userId_cityReviewId: { userId, cityReviewId } }
      });

      if (existingVote) {
        if (existingVote.type === 'DOWNVOTE') {
          // Remove downvote
          await tx.cityReviewVote.delete({
            where: { userId_cityReviewId: { userId, cityReviewId } }
          });
          await tx.cityReview.update({
            where: { id: cityReviewId },
            data: { downvotes: { decrement: 1 } }
          });
        } else {
          // Change upvote to downvote
          await tx.cityReviewVote.update({
            where: { userId_cityReviewId: { userId, cityReviewId } },
            data: { type: 'DOWNVOTE' }
          });
          await tx.cityReview.update({
            where: { id: cityReviewId },
            data: { upvotes: { decrement: 1 }, downvotes: { increment: 1 } }
          });
        }
      } else {
        // Create new downvote
        await tx.cityReviewVote.create({
          data: { userId, cityReviewId, type: 'DOWNVOTE' }
        });
        await tx.cityReview.update({
          where: { id: cityReviewId },
          data: { downvotes: { increment: 1 } }
        });
      }
    });
  } catch (error) {
    console.error('Error downvoting city review:', error);
    throw new Error('Failed to downvote city review');
  }
};

export const removeVoteFromCityReview = async (prisma: PrismaClient, userId: string, cityReviewId: string) => {
  if (!userId || typeof userId !== 'string' || userId.trim() === '') {
    throw new Error('Invalid user ID');
  }
  if (!cityReviewId || typeof cityReviewId !== 'string' || cityReviewId.trim() === '') {
    throw new Error('Invalid city review ID');
  }

  try {
    return await prisma.$transaction(async (tx) => {
      const existingVote = await tx.cityReviewVote.findUnique({
        where: { userId_cityReviewId: { userId, cityReviewId } }
      });

      if (existingVote) {
        await tx.cityReviewVote.delete({
          where: { userId_cityReviewId: { userId, cityReviewId } }
        });

        const updateData = existingVote.type === 'UPVOTE'
          ? { upvotes: { decrement: 1 } }
          : { downvotes: { decrement: 1 } };

        await tx.cityReview.update({
          where: { id: cityReviewId },
          data: updateData
        });
      }
    });
  } catch (error) {
    console.error('Error removing vote from city review:', error);
    throw new Error('Failed to remove vote from city review');
  }
};

export const getVoteByUser = async (prisma: PrismaClient, userId: string, cityReviewId: string) => {
  if (!userId || typeof userId !== 'string' || userId.trim() === '') {
    throw new Error('Invalid user ID');
  }
  if (!cityReviewId || typeof cityReviewId !== 'string' || cityReviewId.trim() === '') {
    throw new Error('Invalid city review ID');
  }

  try {
    return await prisma.cityReviewVote.findUnique({
      where: { userId_cityReviewId: { userId, cityReviewId } }
    });
  } catch (error) {
    console.error('Error fetching city review vote:', error);
    throw new Error('Failed to fetch city review vote');
  }
};

export const findByUserId = async (
  prisma: PrismaClient,
  userId: string,
  query: any,
  currentUserId?: string
) => {
  if (!userId || typeof userId !== 'string' || userId.trim() === '') {
    throw new Error('Invalid user ID');
  }

  const page = Math.max(1, query.page || 1);
  const limit = Math.min(Math.max(1, query.limit || 20), 100);
  const skip = (page - 1) * limit;

  try {
    const [reviews, total] = await Promise.all([
      prisma.cityReview.findMany({
        where: { userId },
        include: {
          user: {
            select: {
              id: true,
              username: true,
              avatar: true,
              role: true
            }
          },
          city: {
            select: {
              id: true,
              name: true,
              country: true,
              slug: true
            }
          },
          saves: currentUserId
            ? {
                where: { userId: currentUserId },
                select: { id: true }
              }
            : false
        },
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit
      }),
      prisma.cityReview.count({ where: { userId } })
    ]);

    let transformed = reviews;
    if (currentUserId) {
      // attach vote info
      const votes = await prisma.cityReviewVote.findMany({
        where: {
          userId: currentUserId,
          cityReviewId: { in: reviews.map(r => r.id) }
        }
      });
      const voteMap = new Map(votes.map(v => [v.cityReviewId, v.type]));

      transformed = reviews.map(r => {
        const isSaved = r.saves ? r.saves.length > 0 : false;
        return {
          ...r,
          userVote: voteMap.get(r.id) || null,
          isSaved,
          saves: undefined
        } as any;
      });
    } else {
      transformed = reviews.map(r => ({ ...r, isSaved: false, saves: undefined } as any));
    }

    return {
      reviews: transformed,
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
    console.error('Error fetching user city reviews:', error);
    throw new Error('Failed to fetch city reviews');
  }
};

export const incrementCommentsCount = async (prisma: PrismaClient, cityReviewId: string) => {
  if (!cityReviewId || typeof cityReviewId !== 'string' || cityReviewId.trim() === '') {
    throw new Error('Invalid city review ID');
  }

  try {
    return await prisma.cityReview.update({
      where: { id: cityReviewId },
      data: {
        commentsCount: {
          increment: 1
        }
      }
    });
  } catch (error) {
    console.error('Error incrementing comments count:', error);
    throw new Error('Failed to increment comments count');
  }
};

export const decrementCommentsCount = async (prisma: PrismaClient, cityReviewId: string) => {
  if (!cityReviewId || typeof cityReviewId !== 'string' || cityReviewId.trim() === '') {
    throw new Error('Invalid city review ID');
  }

  try {
    return await prisma.cityReview.update({
      where: { id: cityReviewId },
      data: {
        commentsCount: {
          decrement: 1
        }
      }
    });
  } catch (error) {
    console.error('Error decrementing comments count:', error);
    throw new Error('Failed to decrement comments count');
  }
};

export const getCountriesStats = async (prisma: PrismaClient) => {
  const reviews = await prisma.cityReview.findMany({
    include: {
      city: {
        select: {
          country: true
        }
      }
    }
  });

  const map = new Map<string, number>();
  reviews.forEach(r => {
    const country = r.city?.country;
    if (country) {
      map.set(country, (map.get(country) || 0) + 1);
    }
  });

  return Array.from(map.entries()).map(([country, count]) => ({ country, count }));
}; 