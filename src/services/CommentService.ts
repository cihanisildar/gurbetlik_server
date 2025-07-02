import { PrismaClient, VoteType } from '@prisma/client';
import { UpdateCommentDto } from '../types';
import * as commentVoteRepository from '../repositories/CommentVoteRepository';
import * as commentRepository from '../repositories/CommentRepository';
import * as postRepository from '../repositories/PostRepository';

// Input validation helpers
const validateAuthentication = (userId?: string): void => {
  if (!userId) {
    throw new Error('Authentication required');
  }
};

const validateCommentId = (id: string | undefined): string => {
  if (!id || typeof id !== 'string' || id.trim() === '') {
    throw new Error('Invalid comment ID');
  }
  return id;
};

export const voteComment = async (prisma: PrismaClient, userId: string, commentId: string, voteType: VoteType) => {
  validateAuthentication(userId);
  const validatedCommentId = validateCommentId(commentId);

  // Verify comment exists
  const comment = await commentRepository.findById(prisma, validatedCommentId);
  if (!comment) {
    throw new Error('Comment not found');
  }

  // Upsert vote (create or update existing vote)
  await commentVoteRepository.upsertVote(prisma, userId, validatedCommentId, voteType);

  return { message: `Comment ${voteType.toLowerCase()}d successfully` };
};

export const removeVote = async (prisma: PrismaClient, userId: string, commentId: string) => {
  validateAuthentication(userId);
  const validatedCommentId = validateCommentId(commentId);

  // Check if vote exists
  const existingVote = await commentVoteRepository.findByUserAndComment(prisma, userId, validatedCommentId);
  if (!existingVote) {
    throw new Error('No vote to remove');
  }

  // Remove vote
  await commentVoteRepository.deleteVote(prisma, userId, validatedCommentId);

  return { message: 'Vote removed successfully' };
};

export const getUserComments = async (
  prisma: PrismaClient,
  targetUserId: string,
  query: any,
  currentUserId?: string
) => {
  return await commentRepository.findByUserId(prisma, targetUserId, query, currentUserId);
};

export const updateComment = async (
  prisma: PrismaClient,
  userId: string,
  commentId: string,
  commentData: UpdateCommentDto
) => {
  validateAuthentication(userId);
  const validatedCommentId = validateCommentId(commentId);

  // Check if comment exists and belongs to user
  const existingComment = await commentRepository.findById(prisma, validatedCommentId);
  if (!existingComment) {
    throw new Error('Comment not found');
  }

  if (existingComment.userId !== userId) {
    throw new Error('Unauthorized: You can only edit your own comments');
  }

  // Don't allow editing deleted comments
  if (existingComment.content === '[deleted]') {
    throw new Error('Cannot edit deleted comments');
  }

  return await commentRepository.update(prisma, validatedCommentId, commentData);
};

export const deleteComment = async (
  prisma: PrismaClient,
  userId: string,
  commentId: string
) => {
  validateAuthentication(userId);
  const validatedCommentId = validateCommentId(commentId);

  // Check if comment exists and belongs to user
  const existingComment = await commentRepository.findById(prisma, validatedCommentId);
  if (!existingComment) {
    throw new Error('Comment not found');
  }

  if (existingComment.userId !== userId) {
    throw new Error('Unauthorized: You can only delete your own comments');
  }

  // Don't allow deleting already deleted comments
  if (existingComment.content === '[deleted]') {
    throw new Error('Comment already deleted');
  }

  const result = await commentRepository.delete_(prisma, validatedCommentId);

  // Only decrement comment count if it was a hard delete (no replies)
  // If it was soft deleted (has replies), we keep the count
  if (!result.content || result.content !== '[deleted]') {
    await postRepository.decrementCommentsCount(prisma, existingComment.postId);
  }

  return result;
}; 