import { PrismaClient, VoteType } from '@prisma/client';

type PrismaInstance = PrismaClient;

export const findByUserAndComment = async (prisma: PrismaInstance, userId: string, commentId: string) => {
  if (!userId || typeof userId !== 'string' || userId.trim() === '') {
    throw new Error('Invalid user ID');
  }
  if (!commentId || typeof commentId !== 'string' || commentId.trim() === '') {
    throw new Error('Invalid comment ID');
  }

  try {
    return await prisma.commentVote.findUnique({
      where: {
        userId_commentId: {
          userId,
          commentId
        }
      }
    });
  } catch (error) {
    console.error('Error finding comment vote:', error);
    throw new Error('Failed to find comment vote');
  }
};

export const upsertVote = async (prisma: PrismaInstance, userId: string, commentId: string, type: VoteType) => {
  if (!userId || typeof userId !== 'string' || userId.trim() === '') {
    throw new Error('Invalid user ID');
  }
  if (!commentId || typeof commentId !== 'string' || commentId.trim() === '') {
    throw new Error('Invalid comment ID');
  }

  try {
    return await prisma.commentVote.upsert({
      where: {
        userId_commentId: {
          userId,
          commentId
        }
      },
      update: {
        type
      },
      create: {
        userId,
        commentId,
        type
      }
    });
  } catch (error) {
    console.error('Error upserting comment vote:', error);
    throw new Error('Failed to vote on comment');
  }
};

export const deleteVote = async (prisma: PrismaInstance, userId: string, commentId: string) => {
  if (!userId || typeof userId !== 'string' || userId.trim() === '') {
    throw new Error('Invalid user ID');
  }
  if (!commentId || typeof commentId !== 'string' || commentId.trim() === '') {
    throw new Error('Invalid comment ID');
  }

  try {
    return await prisma.commentVote.delete({
      where: {
        userId_commentId: {
          userId,
          commentId
        }
      }
    });
  } catch (error) {
    console.error('Error deleting comment vote:', error);
    throw new Error('Failed to remove comment vote');
  }
}; 