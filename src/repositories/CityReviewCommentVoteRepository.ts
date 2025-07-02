import { PrismaClient, VoteType } from '@prisma/client';

export const findByUserAndComment = async (prisma: PrismaClient, userId: string, cityReviewCommentId: string) => {
  if (!userId || typeof userId !== 'string' || userId.trim() === '') {
    throw new Error('Invalid user ID');
  }
  if (!cityReviewCommentId || typeof cityReviewCommentId !== 'string' || cityReviewCommentId.trim() === '') {
    throw new Error('Invalid city review comment ID');
  }

  try {
    return await prisma.cityReviewCommentVote.findUnique({
      where: {
        userId_cityReviewCommentId: {
          userId,
          cityReviewCommentId
        }
      }
    });
  } catch (error) {
    console.error('Error finding city review comment vote:', error);
    throw new Error('Failed to find city review comment vote');
  }
};

export const upsertVote = async (prisma: PrismaClient, userId: string, cityReviewCommentId: string, voteType: VoteType) => {
  if (!userId || typeof userId !== 'string' || userId.trim() === '') {
    throw new Error('Invalid user ID');
  }
  if (!cityReviewCommentId || typeof cityReviewCommentId !== 'string' || cityReviewCommentId.trim() === '') {
    throw new Error('Invalid city review comment ID');
  }

  try {
    return await prisma.cityReviewCommentVote.upsert({
      where: {
        userId_cityReviewCommentId: {
          userId,
          cityReviewCommentId
        }
      },
      update: {
        type: voteType
      },
      create: {
        userId,
        cityReviewCommentId,
        type: voteType
      }
    });
  } catch (error) {
    console.error('Error upserting city review comment vote:', error);
    throw new Error('Failed to vote on city review comment');
  }
};

export const deleteVote = async (prisma: PrismaClient, userId: string, cityReviewCommentId: string) => {
  if (!userId || typeof userId !== 'string' || userId.trim() === '') {
    throw new Error('Invalid user ID');
  }
  if (!cityReviewCommentId || typeof cityReviewCommentId !== 'string' || cityReviewCommentId.trim() === '') {
    throw new Error('Invalid city review comment ID');
  }

  try {
    return await prisma.cityReviewCommentVote.delete({
      where: {
        userId_cityReviewCommentId: {
          userId,
          cityReviewCommentId
        }
      }
    });
  } catch (error) {
    console.error('Error deleting city review comment vote:', error);
    throw new Error('Failed to delete city review comment vote');
  }
}; 