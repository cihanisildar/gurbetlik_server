import { PrismaClient, VoteType } from '@prisma/client';
import { CommentDto, UpdateCommentDto } from '../types';
import * as cityReviewCommentVoteRepository from '../repositories/CityReviewCommentVoteRepository';
import * as cityReviewCommentRepository from '../repositories/CityReviewCommentRepository';
import * as cityReviewRepository from '../repositories/CityReviewRepository';

// Input validation helpers
const validateAuthentication = (userId?: string): void => {
  if (!userId) {
    throw new Error('Authentication required');
  }
};

const validateCommentId = (id: string | undefined): string => {
  if (!id || typeof id !== 'string' || id.trim() === '') {
    throw new Error('Invalid city review comment ID');
  }
  return id;
};

const validateCityReviewId = (id: string | undefined): string => {
  if (!id || typeof id !== 'string' || id.trim() === '') {
    throw new Error('Invalid city review ID');
  }
  return id;
};

export const addComment = async (
  prisma: PrismaClient,
  userId: string,
  cityReviewId: string,
  commentData: CommentDto
) => {
  validateAuthentication(userId);
  const validatedCityReviewId = validateCityReviewId(cityReviewId);

  // If replying to another comment, validate that comment exists and belongs to same city review
  if (commentData.parentCommentId) {
    const parent = await cityReviewCommentRepository.findById(prisma, commentData.parentCommentId);
    if (!parent) {
      throw new Error('Parent comment not found');
    }
    if (parent.cityReviewId !== validatedCityReviewId) {
      throw new Error('Parent comment does not belong to this city review');
    }
  }

  // Create comment (root or reply)
  const comment = await cityReviewCommentRepository.create(prisma, userId, validatedCityReviewId, commentData);

  // Increment comments count on the city review
  await cityReviewRepository.incrementCommentsCount(prisma, validatedCityReviewId);

  return comment;
};

export const getCityReviewComments = async (prisma: PrismaClient, cityReviewId: string, query: any, userId?: string) => {
  const validatedCityReviewId = validateCityReviewId(cityReviewId);
  return await cityReviewCommentRepository.findByCityReviewId(prisma, validatedCityReviewId, query, userId);
};

export const voteComment = async (prisma: PrismaClient, userId: string, commentId: string, voteType: VoteType) => {
  validateAuthentication(userId);
  const validatedCommentId = validateCommentId(commentId);

  // Verify comment exists
  const comment = await cityReviewCommentRepository.findById(prisma, validatedCommentId);
  if (!comment) {
    throw new Error('City review comment not found');
  }

  // Upsert vote (create or update existing vote)
  await cityReviewCommentVoteRepository.upsertVote(prisma, userId, validatedCommentId, voteType);

  return { message: `City review comment ${voteType.toLowerCase()}d successfully` };
};

export const removeVote = async (prisma: PrismaClient, userId: string, commentId: string) => {
  validateAuthentication(userId);
  const validatedCommentId = validateCommentId(commentId);

  // Check if vote exists
  const existingVote = await cityReviewCommentVoteRepository.findByUserAndComment(prisma, userId, validatedCommentId);
  if (!existingVote) {
    throw new Error('No vote to remove');
  }

  // Remove vote
  await cityReviewCommentVoteRepository.deleteVote(prisma, userId, validatedCommentId);

  return { message: 'Vote removed successfully' };
};

export const getUserComments = async (
  prisma: PrismaClient,
  targetUserId: string,
  query: any,
  currentUserId?: string
) => {
  return await cityReviewCommentRepository.findByUserId(prisma, targetUserId, query, currentUserId);
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
  const existingComment = await cityReviewCommentRepository.findById(prisma, validatedCommentId);
  if (!existingComment) {
    throw new Error('City review comment not found');
  }

  if (existingComment.userId !== userId) {
    throw new Error('Unauthorized: You can only edit your own comments');
  }

  // Don't allow editing deleted comments
  if (existingComment.content === '[deleted]') {
    throw new Error('Cannot edit deleted comments');
  }

  return await cityReviewCommentRepository.update(prisma, validatedCommentId, commentData);
};

export const deleteComment = async (
  prisma: PrismaClient,
  userId: string,
  commentId: string
) => {
  validateAuthentication(userId);
  const validatedCommentId = validateCommentId(commentId);

  // Check if comment exists and belongs to user
  const existingComment = await cityReviewCommentRepository.findById(prisma, validatedCommentId);
  if (!existingComment) {
    throw new Error('City review comment not found');
  }

  if (existingComment.userId !== userId) {
    throw new Error('Unauthorized: You can only delete your own comments');
  }

  // Don't allow deleting already deleted comments
  if (existingComment.content === '[deleted]') {
    throw new Error('Comment already deleted');
  }

  const result = await cityReviewCommentRepository.delete_(prisma, validatedCommentId);

  // Only decrement comment count if it was a hard delete (no replies)
  // If it was soft deleted (has replies), we keep the count
  if (!result.content || result.content !== '[deleted]') {
    await cityReviewRepository.decrementCommentsCount(prisma, existingComment.cityReviewId);
  }

  return result;
}; 