import { PostTag, PostCategory, PrismaClient } from '@prisma/client';
import { PostDto, UpdatePostDto, PostQuery } from '../types';
import { Prisma } from '@prisma/client';

type PrismaTransaction = Parameters<Parameters<PrismaClient['$transaction']>[0]>[0];
type PrismaInstance = PrismaClient | PrismaTransaction;

export const findMany = async (prisma: PrismaInstance, query: PostQuery, userId?: string) => {
  const page = query.page || 1;
  const limit = Math.min(query.limit || 20, 100);
  const skip = (page - 1) * limit;

  const where: any = {};

  if (query.search) {
    where.OR = [
      { title: { contains: query.search, mode: 'insensitive' } },
      { content: { contains: query.search, mode: 'insensitive' } }
    ];
  }

  if (query.category) {
    where.category = query.category;
  }

  if (query.tags && query.tags.length > 0) {
    where.tags = { hasSome: query.tags };
  }

  if (query.cityId) {
    where.cityId = query.cityId;
  }

  if (query.userId) {
    where.userId = query.userId;
  }

  const [posts, total] = await Promise.all([
    prisma.post.findMany({
      where,
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
        },
        votes: {
          select: {
            type: true,
            userId: true
          }
        },
        saves: userId ? {
          where: { userId },
          select: { id: true }
        } : false,
      },
      orderBy: { createdAt: 'desc' },
      skip,
      take: limit
    }),
    prisma.post.count({ where })
  ]);

  // Transform posts to include vote counts and user's vote
  const transformedPosts = posts.map(post => {
    const upvotes = post.votes.filter(vote => vote.type === 'UPVOTE').length;
    const downvotes = post.votes.filter(vote => vote.type === 'DOWNVOTE').length;
    const userVote = userId ? post.votes.find(vote => vote.userId === userId)?.type || null : null;

    return {
      ...post,
      upvotes,
      downvotes,
      score: upvotes - downvotes,
      userVote,
      isSaved: userId ? post.saves?.length > 0 : false,
      votes: undefined,
      saves: undefined
    };
  });

  return {
    posts: transformedPosts,
    total,
    pagination: {
      page,
      limit,
      total,
      pages: Math.ceil(total / limit)
    }
  };
};

export const findById = async (prisma: PrismaClient, id: string, userId?: string) => {
  if (!id || typeof id !== 'string' || id.trim() === '') {
    throw new Error('Invalid post ID');
  }

  try {
    const post = await prisma.post.findUnique({
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
        city: {
          select: {
            id: true,
            name: true,
            country: true,
            slug: true
          }
        },
        votes: {
          select: {
            type: true,
            userId: true
          }
        },
        saves: userId ? {
          where: { userId },
          select: { id: true }
        } : false
      }
    });

    if (!post) {
      return null;
    }

    // Calculate vote counts
    const upvotes = post.votes.filter(vote => vote.type === 'UPVOTE').length;
    const downvotes = post.votes.filter(vote => vote.type === 'DOWNVOTE').length;
    const userVote = userId ? post.votes.find(vote => vote.userId === userId)?.type || null : null;

    return {
      ...post,
      upvotes,
      downvotes,
      score: upvotes - downvotes,
      userVote,
      isSaved: userId ? post.saves?.length > 0 : false,
      votes: undefined, // Remove the votes array
      saves: undefined // Remove the saves array
    };
  } catch (error) {
    console.error('Error fetching post by ID:', error);
    throw new Error('Failed to fetch post');
  }
};

export const create = async (prisma: PrismaClient, userId: string, postData: PostDto) => {
  if (!userId || typeof userId !== 'string' || userId.trim() === '') {
    throw new Error('Invalid user ID');
  }

  try {
    const data: Prisma.PostCreateInput = {
      title: postData.title,
      content: postData.content,
      category: postData.category as PostCategory,
      tags: postData.tags as PostTag[],
      ...(postData.images && postData.images.length > 0 && { images: postData.images }),
      user: {
        connect: { id: userId }
      },
      ...(postData.cityId && {
        city: {
          connect: { id: postData.cityId }
        }
      })
    };

    return await prisma.post.create({
      data,
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
    console.error('Error creating post:', error);
    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2025') {
      throw new Error('City not found');
    }
    throw new Error('Failed to create post');
  }
};

export const update = async (prisma: PrismaClient, id: string, postData: UpdatePostDto) => {
  if (!id || typeof id !== 'string' || id.trim() === '') {
    throw new Error('Invalid post ID');
  }

  try {
    return await prisma.post.update({
      where: { id },
      data: {
        ...(postData.title && { title: postData.title }),
        ...(postData.content && { content: postData.content }),
        ...(postData.category && { category: postData.category as PostCategory }),
        ...(postData.tags && { tags: postData.tags as PostTag[] }),
        ...(postData.images && { images: { set: postData.images } }),
        ...(postData.cityId && { 
          city: { connect: { id: postData.cityId } }
        })
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
    console.error('Error updating post:', error);
    throw new Error('Failed to update post');
  }
};

export const delete_ = async (prisma: PrismaClient, id: string) => {
  if (!id || typeof id !== 'string' || id.trim() === '') {
    throw new Error('Invalid post ID');
  }

  try {
    return await prisma.post.delete({
      where: { id }
    });
  } catch (error) {
    console.error('Error deleting post:', error);
    throw new Error('Failed to delete post');
  }
};

export const incrementCommentsCount = async (prisma: PrismaInstance, id: string) => {
  if (!id || typeof id !== 'string' || id.trim() === '') {
    throw new Error('Invalid post ID');
  }

  return await prisma.post.update({
    where: { id },
    data: {
      commentsCount: {
        increment: 1
      }
    }
  });
};

export const decrementCommentsCount = async (prisma: PrismaClient, id: string) => {
  if (!id || typeof id !== 'string' || id.trim() === '') {
    throw new Error('Invalid post ID');
  }

  return await prisma.post.update({
    where: { id },
    data: {
      commentsCount: {
        decrement: 1
      }
    }
  });
};

export const findManyWithComments = async (prisma: PrismaInstance, query: PostQuery, userId?: string) => {
  const page = query.page || 1;
  const limit = Math.min(query.limit || 20, 100);
  const skip = (page - 1) * limit;

  const where: any = {};

  if (query.search) {
    where.OR = [
      { title: { contains: query.search, mode: 'insensitive' } },
      { content: { contains: query.search, mode: 'insensitive' } }
    ];
  }

  if (query.category) {
    where.category = query.category;
  }

  if (query.tags && query.tags.length > 0) {
    where.tags = { hasSome: query.tags };
  }

  if (query.cityId) {
    where.cityId = query.cityId;
  }

  if (query.userId) {
    where.userId = query.userId;
  }

  const [posts, total] = await Promise.all([
    prisma.post.findMany({
      where,
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
        },
        comments: {
          take: 5,
          orderBy: { createdAt: 'desc' },
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
        },
        votes: {
          select: {
            type: true,
            userId: true
          }
        },
        saves: userId ? {
          where: { userId },
          select: { id: true }
        } : false,
        _count: {
          select: {
            comments: true
          }
        }
      },
      orderBy: { createdAt: 'desc' },
      skip,
      take: limit
    }),
    prisma.post.count({ where })
  ]);

  // Transform posts to include vote counts and user's vote
  const transformedPosts = posts.map(post => {
    const upvotes = post.votes.filter(vote => vote.type === 'UPVOTE').length;
    const downvotes = post.votes.filter(vote => vote.type === 'DOWNVOTE').length;
    const userVote = userId ? post.votes.find(vote => vote.userId === userId)?.type || null : null;

    return {
      ...post,
      upvotes,
      downvotes,
      score: upvotes - downvotes,
      userVote,
      isSaved: userId ? post.saves?.length > 0 : false,
      hasMoreComments: post._count.comments > post.comments.length,
      votes: undefined,
      saves: undefined
    };
  });

  return {
    posts: transformedPosts,
    total,
    pagination: {
      page,
      limit,
      total,
      pages: Math.ceil(total / limit)
    }
  };
};

export const findUpvotedByUser = async (
  prisma: PrismaInstance,
  userId: string,
  page: number = 1,
  limit: number = 20
) => {
  if (!userId || typeof userId !== 'string' || userId.trim() === '') {
    throw new Error('Invalid user ID');
  }

  const safePage = Math.max(1, page);
  const safeLimit = Math.min(Math.max(1, limit), 100);
  const skip = (safePage - 1) * safeLimit;

  const where = {
    votes: {
      some: {
        userId,
        type: 'UPVOTE'
      }
    }
  } as any;

  const [posts, total] = await Promise.all([
    prisma.post.findMany({
      where,
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
        },
        votes: {
          select: {
            type: true,
            userId: true
          }
        },
        saves: {
          where: { userId },
          select: { id: true }
        }
      },
      orderBy: { createdAt: 'desc' },
      skip,
      take: safeLimit
    }),
    prisma.post.count({ where })
  ]);

  // Transform posts to include vote counts and flags
  const transformedPosts = posts.map(post => {
    const upvotes = post.votes.filter(v => v.type === 'UPVOTE').length;
    const downvotes = post.votes.filter(v => v.type === 'DOWNVOTE').length;

    return {
      ...post,
      upvotes,
      downvotes,
      score: upvotes - downvotes,
      userVote: 'UPVOTE', // by definition
      isSaved: post.saves?.length > 0,
      votes: undefined,
      saves: undefined
    } as any;
  });

  return {
    posts: transformedPosts,
    pagination: {
      page: safePage,
      limit: safeLimit,
      total,
      pages: Math.ceil(total / safeLimit),
      hasNext: safePage < Math.ceil(total / safeLimit),
      hasPrev: safePage > 1
    }
  };
};

export const getCountriesStats = async (prisma: PrismaClient) => {
  const posts = await prisma.post.findMany({
    include: {
      city: {
        select: {
          country: true
        }
      }
    }
  });

  const map = new Map<string, number>();
  posts.forEach(p => {
    const country = p.city?.country;
    if (country) {
      map.set(country, (map.get(country) || 0) + 1);
    }
  });

  return Array.from(map.entries()).map(([country, count]) => ({ country, count }));
}; 