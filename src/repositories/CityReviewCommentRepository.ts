import { PrismaClient } from '@prisma/client';
import { CommentDto, UpdateCommentDto } from '../types';

type PrismaInstance = PrismaClient;

export const findByCityReviewId = async (prisma: PrismaInstance, cityReviewId: string, query: any, userId?: string) => {
  if (!cityReviewId || typeof cityReviewId !== 'string' || cityReviewId.trim() === '') {
    throw new Error('Invalid city review ID');
  }

  const page = Math.max(1, query.page || 1);
  const limit = Math.min(Math.max(1, query.limit || 20), 100);
  const skip = (page - 1) * limit;

  try {
    // First, get all comments for this city review
    const [allComments, total] = await Promise.all([
      prisma.cityReviewComment.findMany({
        where: { cityReviewId },
        include: {
          user: {
            select: {
              id: true,
              username: true,
              avatar: true,
              role: true
            }
          },
          votes: {
            select: {
              type: true,
              userId: true
            }
          }
        },
        orderBy: { createdAt: 'asc' }
      }),
      prisma.cityReviewComment.count({ where: { cityReviewId, parentCommentId: null } })
    ]);

    // Transform comments to include vote counts and user's vote
    const transformedComments = allComments.map(comment => {
      const upvotes = comment.votes.filter(vote => vote.type === 'UPVOTE').length;
      const downvotes = comment.votes.filter(vote => vote.type === 'DOWNVOTE').length;
      const userVote = userId ? comment.votes.find(vote => vote.userId === userId)?.type || null : null;

      return {
        ...comment,
        upvotes,
        downvotes,
        score: upvotes - downvotes,
        userVote,
        votes: undefined,
        replies: [] as any[] // Will be populated below
      };
    });

    // Build comment tree structure
    const commentMap = new Map();
    const rootComments: any[] = [];

    // First pass: create map and identify root comments
    transformedComments.forEach(comment => {
      commentMap.set(comment.id, comment);
      if (!comment.parentCommentId) {
        rootComments.push(comment);
      }
    });

    // Second pass: build tree by adding children to parents
    transformedComments.forEach(comment => {
      if (comment.parentCommentId) {
        const parent = commentMap.get(comment.parentCommentId);
        if (parent) {
          parent.replies.push(comment);
        }
      }
    });

    // Sort replies recursively by creation date
    const sortReplies = (comments: any[]) => {
      comments.forEach(comment => {
        if (comment.replies.length > 0) {
          comment.replies.sort((a: any, b: any) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime());
          sortReplies(comment.replies);
        }
      });
    };

    // Sort root comments by creation date (newest first) and their replies
    rootComments.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
    sortReplies(rootComments);

    // Apply pagination to root comments only
    const paginatedRootComments = rootComments.slice(skip, skip + limit);

    return {
      comments: paginatedRootComments,
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
    console.error('Error fetching city review comments:', error);
    throw new Error('Failed to fetch city review comments');
  }
};

export const findById = async (prisma: PrismaClient, id: string) => {
  if (!id || typeof id !== 'string' || id.trim() === '') {
    throw new Error('Invalid city review comment ID');
  }

  try {
    return await prisma.cityReviewComment.findUnique({
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
        cityReview: {
          select: {
            id: true,
            title: true,
            userId: true
          }
        }
      }
    });
  } catch (error) {
    console.error('Error fetching city review comment by ID:', error);
    throw new Error('Failed to fetch city review comment');
  }
};

export const create = async (
  prisma: PrismaInstance,
  userId: string,
  cityReviewId: string,
  commentData: CommentDto
) => {
  if (!userId || typeof userId !== 'string' || userId.trim() === '') {
    throw new Error('Invalid user ID');
  }
  if (!cityReviewId || typeof cityReviewId !== 'string' || cityReviewId.trim() === '') {
    throw new Error('Invalid city review ID');
  }

  try {
    return await prisma.cityReviewComment.create({
      data: {
        content: commentData.content,
        user: {
          connect: { id: userId }
        },
        cityReview: {
          connect: { id: cityReviewId }
        },
        ...(commentData.parentCommentId && {
          parentComment: {
            connect: { id: commentData.parentCommentId }
          }
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
        parentComment: commentData.parentCommentId
          ? {
              select: {
                id: true,
                userId: true
              }
            }
          : false
      }
    });
  } catch (error) {
    console.error('Error creating city review comment:', error);
    throw new Error('Failed to create city review comment');
  }
};

export const update = async (prisma: PrismaClient, id: string, commentData: UpdateCommentDto) => {
  if (!id || typeof id !== 'string' || id.trim() === '') {
    throw new Error('Invalid city review comment ID');
  }

  try {
    // Filter out undefined values for exactOptionalPropertyTypes compatibility
    const filteredData = Object.fromEntries(
      Object.entries(commentData).filter(([_, value]) => value !== undefined)
    );

    return await prisma.cityReviewComment.update({
      where: { id },
      data: filteredData,
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
    console.error('Error updating city review comment:', error);
    throw new Error('Failed to update city review comment');
  }
};

export const delete_ = async (prisma: PrismaClient, id: string) => {
  if (!id || typeof id !== 'string' || id.trim() === '') {
    throw new Error('Invalid city review comment ID');
  }

  try {
    // First get the comment to check if it has replies
    const comment = await prisma.cityReviewComment.findUnique({
      where: { id },
      include: {
        replies: true
      }
    });

    if (!comment) {
      throw new Error('City review comment not found');
    }

    // If comment has replies, we'll soft delete by updating content
    // If no replies, we can hard delete
    if (comment.replies && comment.replies.length > 0) {
      return await prisma.cityReviewComment.update({
        where: { id },
        data: {
          content: '[deleted]',
          updatedAt: new Date()
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
    } else {
      return await prisma.cityReviewComment.delete({
        where: { id }
      });
    }
  } catch (error) {
    console.error('Error deleting city review comment:', error);
    throw new Error('Failed to delete city review comment');
  }
};

export const countByCityReview = async (prisma: PrismaClient, cityReviewId: string) => {
  if (!cityReviewId || typeof cityReviewId !== 'string' || cityReviewId.trim() === '') {
    throw new Error('Invalid city review ID');
  }
  return await prisma.cityReviewComment.count({ where: { cityReviewId } });
};

export const findByUserId = async (
  prisma: PrismaInstance,
  userId: string,
  query: any,
  currentUserId?: string
) => {
  // Validate inputs
  if (!userId || typeof userId !== 'string' || userId.trim() === '') {
    throw new Error('Invalid user ID');
  }

  const page = Math.max(1, query.page || 1);
  const limit = Math.min(Math.max(1, query.limit || 20), 100);
  const skip = (page - 1) * limit;

  // Optional filter by cityReviewId
  const where: any = { userId };
  if (query.cityReviewId) {
    where.cityReviewId = query.cityReviewId;
  }

  try {
    const [comments, total] = await Promise.all([
      prisma.cityReviewComment.findMany({
        where,
        include: {
          user: {
            select: {
              id: true,
              username: true,
              avatar: true,
              role: true
            }
          },
          cityReview: {
            select: {
              id: true,
              title: true
            }
          },
          votes: {
            select: {
              type: true,
              userId: true
            }
          }
        },
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit
      }),
      prisma.cityReviewComment.count({ where })
    ]);

    // Transform to include vote counts and current user's vote
    const transformedComments = comments.map((comment) => {
      const upvotes = comment.votes.filter((v) => v.type === 'UPVOTE').length;
      const downvotes = comment.votes.filter((v) => v.type === 'DOWNVOTE').length;
      const userVote = currentUserId
        ? comment.votes.find((v) => v.userId === currentUserId)?.type || null
        : null;

      return {
        ...comment,
        upvotes,
        downvotes,
        score: upvotes - downvotes,
        userVote,
        votes: undefined // remove raw votes array
      } as any;
    });

    return {
      comments: transformedComments,
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
    console.error('Error fetching city review comments by user ID:', error);
    throw new Error('Failed to fetch user city review comments');
  }
}; 