import { PrismaClient } from '@prisma/client';
import { UserQuery, UpdateUserDto } from '../types';
import * as userRepository from '../repositories/UserRepository';
import * as postSaveRepository from '../repositories/PostSaveRepository';
import * as cityReviewSaveRepository from '../repositories/CityReviewSaveRepository';
import * as postRepository from '../repositories/PostRepository';
import * as cityReviewRepository from '../repositories/CityReviewRepository';

export const getAllUsers = async (prisma: PrismaClient, query: any) => {
  return await userRepository.findAll(prisma, query);
};

export const getUserById = async (prisma: PrismaClient, id: string) => {
  return await userRepository.findById(prisma, id);
};

export const getUserByEmail = async (prisma: PrismaClient, email: string) => {
  return await userRepository.findByEmail(prisma, email);
};

export const updateUser = async (prisma: PrismaClient, id: string, updateData: UpdateUserDto, requestingUserId: string) => {
  // In a real-world scenario, you might want to check if the requesting user
  // has permission to update the target user (e.g., admin role or same user)
  if (id !== requestingUserId) {
    throw new Error('Unauthorized to update this user');
  }
  
  return await userRepository.update(prisma, id, updateData);
};

export const getUsersWithActivity = async (prisma: PrismaClient, query: UserQuery) => {
  return await userRepository.findAllWithActivity(prisma, query);
};

export const getSavedPosts = async (prisma: PrismaClient, userId: string, query: { page?: number; limit?: number }) => {
  const page = Math.max(1, query.page || 1);
  const limit = Math.min(Math.max(1, query.limit || 20), 100);
  return await postSaveRepository.findSavedPostsByUser(prisma, userId, page, limit);
};

export const getSavedCityReviews = async (
  prisma: PrismaClient,
  userId: string,
  query: { page?: number; limit?: number }
) => {
  const page = Math.max(1, query.page || 1);
  const limit = Math.min(Math.max(1, query.limit || 20), 100);
  return await cityReviewSaveRepository.findSavedReviewsByUser(prisma, userId, page, limit);
};

export const getUpvotedPosts = async (prisma: PrismaClient, userId: string, query: { page?: number; limit?: number }) => {
  const page = Math.max(1, query.page || 1);
  const limit = Math.min(Math.max(1, query.limit || 20), 100);
  return await postRepository.findUpvotedByUser(prisma, userId, page, limit);
};

export const getCityReviewsByUser = async (
  prisma: PrismaClient,
  userId: string,
  query: { page?: number; limit?: number },
  currentUserId?: string
) => {
  const page = Math.max(1, query.page || 1);
  const limit = Math.min(Math.max(1, query.limit || 20), 100);
  return await cityReviewRepository.findByUserId(prisma, userId, { page, limit }, currentUserId);
}; 