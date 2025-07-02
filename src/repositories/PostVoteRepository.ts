import { PrismaClient, VoteType } from '@prisma/client';

type PrismaInstance = PrismaClient;

export const findByUserAndPost = async (prisma: PrismaInstance, userId: string, postId: string) => {
  if (!userId || typeof userId !== 'string' || userId.trim() === '') {
    throw new Error('Invalid user ID');
  }
  if (!postId || typeof postId !== 'string' || postId.trim() === '') {
    throw new Error('Invalid post ID');
  }

  return await prisma.postVote.findUnique({
    where: {
      userId_postId: { userId, postId }
    }
  });
};

export const upsertVote = async (prisma: PrismaInstance, userId: string, postId: string, type: VoteType) => {
  if (!userId || typeof userId !== 'string' || userId.trim() === '') {
    throw new Error('Invalid user ID');
  }
  if (!postId || typeof postId !== 'string' || postId.trim() === '') {
    throw new Error('Invalid post ID');
  }

  try {
    return await prisma.postVote.upsert({
      where: {
        userId_postId: { userId, postId }
      },
      update: {
        type
      },
      create: {
        userId,
        postId,
        type
      }
    });
  } catch (error) {
    console.error('Error upserting post vote:', error);
    throw new Error('Failed to vote on post');
  }
};

export const deleteVote = async (prisma: PrismaInstance, userId: string, postId: string) => {
  if (!userId || typeof userId !== 'string' || userId.trim() === '') {
    throw new Error('Invalid user ID');
  }
  if (!postId || typeof postId !== 'string' || postId.trim() === '') {
    throw new Error('Invalid post ID');
  }

  try {
    return await prisma.postVote.delete({
      where: {
        userId_postId: { userId, postId }
      }
    });
  } catch (error) {
    console.error('Error deleting post vote:', error);
    throw new Error('Failed to remove vote');
  }
};

export const getVoteCounts = async (prisma: PrismaInstance, postId: string) => {
  if (!postId || typeof postId !== 'string' || postId.trim() === '') {
    throw new Error('Invalid post ID');
  }

  const [upvotes, downvotes] = await Promise.all([
    prisma.postVote.count({ 
      where: { 
        postId, 
        type: VoteType.UPVOTE 
      } 
    }),
    prisma.postVote.count({ 
      where: { 
        postId, 
        type: VoteType.DOWNVOTE 
      } 
    })
  ]);

  return { upvotes, downvotes };
};

export const getPostsVoteCounts = async (prisma: PrismaInstance, postIds: string[]) => {
  if (!postIds || postIds.length === 0) {
    return {};
  }

  const votes = await prisma.postVote.groupBy({
    by: ['postId', 'type'],
    where: {
      postId: { in: postIds }
    },
    _count: {
      id: true
    }
  });

  const voteCounts: Record<string, { upvotes: number; downvotes: number }> = {};
  
  // Initialize all posts with 0 votes
  postIds.forEach(postId => {
    voteCounts[postId] = { upvotes: 0, downvotes: 0 };
  });

  // Populate actual counts
  votes.forEach(vote => {
    if (voteCounts[vote.postId]) {
      if (vote.type === VoteType.UPVOTE) {
        voteCounts[vote.postId]!.upvotes = vote._count.id;
      } else {
        voteCounts[vote.postId]!.downvotes = vote._count.id;
      }
    }
  });

  return voteCounts;
}; 