import { PrismaClient, VoteType } from '@prisma/client';
import { PostQuery, PostDto, UpdatePostDto, CommentDto } from '../types';
import * as postRepository from '../repositories/PostRepository';
import * as postVoteRepository from '../repositories/PostVoteRepository';
import * as postSaveRepository from '../repositories/PostSaveRepository';
import * as commentRepository from '../repositories/CommentRepository';

// Input validation helpers
const validateAuthentication = (userId?: string): void => {
  if (!userId) {
    throw new Error('Authentication required');
  }
};

const validatePostId = (id: string | undefined): string => {
  if (!id || typeof id !== 'string' || id.trim() === '') {
    throw new Error('Invalid post ID');
  }
  return id;
};

export const createPost = async (prisma: PrismaClient, userId: string, postData: PostDto) => {
  validateAuthentication(userId);
  return await postRepository.create(prisma, userId, postData);
};

export const getPosts = async (prisma: PrismaClient, query: PostQuery, userId?: string) => {
  return await postRepository.findMany(prisma, query, userId);
};

export const getPostById = async (prisma: PrismaClient, postId: string, userId?: string) => {
  const validatedPostId = validatePostId(postId);
  
  const post = await postRepository.findById(prisma, validatedPostId, userId);
  
  if (!post) {
    throw new Error('Post not found');
  }

  return post;
};

export const votePost = async (prisma: PrismaClient, userId: string, postId: string, voteType: VoteType) => {
  validateAuthentication(userId);
  const validatedPostId = validatePostId(postId);

  // Upsert vote (create or update existing vote)
  await postVoteRepository.upsertVote(prisma, userId, validatedPostId, voteType);

  return { message: `Post ${voteType.toLowerCase()}d successfully` };
};

export const removeVote = async (prisma: PrismaClient, userId: string, postId: string) => {
  validateAuthentication(userId);
  const validatedPostId = validatePostId(postId);

  // Check if vote exists
  const existingVote = await postVoteRepository.findByUserAndPost(prisma, userId, validatedPostId);
  if (!existingVote) {
    throw new Error('No vote to remove');
  }

  // Remove vote
  await postVoteRepository.deleteVote(prisma, userId, validatedPostId);

  return { message: 'Vote removed successfully' };
};

export const savePost = async (prisma: PrismaClient, userId: string, postId: string) => {
  validateAuthentication(userId);
  const validatedPostId = validatePostId(postId);

  // Check if already saved
  const existingSave = await postSaveRepository.findByUserAndPost(prisma, userId, validatedPostId);
  if (existingSave) {
    throw new Error('Post already saved');
  }

  // Create save
  await postSaveRepository.create(prisma, userId, validatedPostId);

  return { message: 'Post saved successfully' };
};

export const unsavePost = async (prisma: PrismaClient, userId: string, postId: string) => {
  validateAuthentication(userId);
  const validatedPostId = validatePostId(postId);

  // Check if saved
  const existingSave = await postSaveRepository.findByUserAndPost(prisma, userId, validatedPostId);
  if (!existingSave) {
    throw new Error('Post not saved');
  }

  // Remove save
  await postSaveRepository.deleteByUserAndPost(prisma, userId, validatedPostId);

  return { message: 'Post unsaved successfully' };
};

export const addComment = async (
  prisma: PrismaClient,
  userId: string,
  postId: string,
  commentData: CommentDto
) => {
  validateAuthentication(userId);
  const validatedPostId = validatePostId(postId);

  // If replying to another comment, optionally validate that comment exists and belongs to same post
  if (commentData.parentCommentId) {
    const parent = await commentRepository.findById(prisma, commentData.parentCommentId);
    if (!parent) {
      throw new Error('Parent comment not found');
    }
    if (parent.postId !== validatedPostId) {
      throw new Error('Parent comment does not belong to this post');
    }
  }

  // Create comment (root or reply)
  const comment = await commentRepository.create(prisma, userId, validatedPostId, commentData);

  // Increment comments count on the post (could also choose to only increment for root comments)
  await postRepository.incrementCommentsCount(prisma, validatedPostId);

  return comment;
};

export const getPostsWithComments = async (prisma: PrismaClient, query: PostQuery, userId?: string) => {
  return await postRepository.findManyWithComments(prisma, query, userId);
};

export const getPostComments = async (prisma: PrismaClient, postId: string, query: any, userId?: string) => {
  const validatedPostId = validatePostId(postId);
  return await commentRepository.findByPostId(prisma, validatedPostId, query, userId);
};

export const updatePost = async (prisma: PrismaClient, userId: string, postId: string, postData: UpdatePostDto) => {
  validateAuthentication(userId);
  const validatedPostId = validatePostId(postId);

  // Check if post exists and belongs to user
  const existingPost = await postRepository.findById(prisma, validatedPostId);
  if (!existingPost) {
    throw new Error('Post not found');
  }

  if (existingPost.userId !== userId) {
    throw new Error('Unauthorized: You can only edit your own posts');
  }

  // Validate city exists if provided
  if (postData.cityId) {
    const { findById: findCityById } = await import('../repositories/CityRepository');
    const city = await findCityById(postData.cityId);
    if (!city) {
      throw new Error('Selected city not found');
    }
  }

  // Handle images update: delete removed images from S3
  if (postData.images) {
    const existingImages: string[] = Array.isArray((existingPost as any).images) ? (existingPost as any).images : [];
    const newImages: string[] = postData.images;
    const removedImages = existingImages.filter((url) => !newImages.includes(url));

    if (removedImages.length > 0) {
      const { deletePostImage } = await import('./S3Service');
      await Promise.all(removedImages.map((url) => deletePostImage(url)));
    }
  }

  return await postRepository.update(prisma, validatedPostId, postData);
};

export const deletePost = async (prisma: PrismaClient, userId: string, postId: string) => {
  validateAuthentication(userId);
  const validatedPostId = validatePostId(postId);

  // Check if post exists and belongs to user
  const existingPost = await postRepository.findById(prisma, validatedPostId);
  if (!existingPost) {
    throw new Error('Post not found');
  }

  if (existingPost.userId !== userId) {
    throw new Error('Unauthorized: You can only delete your own posts');
  }

  // Delete images from S3 if any
  const existingPostAny = existingPost as any;
  if (Array.isArray(existingPostAny.images) && existingPostAny.images.length > 0) {
    const { deletePostImage } = await import('./S3Service');
    await Promise.all(existingPostAny.images.map((url: string) => deletePostImage(url)));
  }

  return await postRepository.delete_(prisma, validatedPostId);
};

export const getCountriesStats = async (prisma: PrismaClient) => {
  return await postRepository.getCountriesStats(prisma);
}; 