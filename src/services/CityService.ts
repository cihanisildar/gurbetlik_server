import { CityDto, CityReviewDto, CityQuery } from "../types";
import * as cityRepository from "../repositories/CityRepository";
import * as cityReviewRepository from "../repositories/CityReviewRepository";
import * as cityReviewSaveRepository from "../repositories/CityReviewSaveRepository";
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export const getCities = async (query: CityQuery) => {
  return await cityRepository.findMany(query);
};

export const getCityById = async (id: string) => {
  if (!id || typeof id !== "string" || id.trim() === "") {
    throw new Error("Invalid city ID");
  }
  const city = await cityRepository.findById(id);
  if (!city) {
    throw new Error("City not found");
  }
  return city;
};

export const getCitiesWithReviews = async (query: any) => {
  return await cityRepository.findManyWithReviews(query);
};

export const createReview = async (userId: string, cityId: string, reviewData: Omit<CityReviewDto, 'cityName' | 'country'>) => {
  return await cityReviewRepository.create(prisma, userId, cityId, reviewData);
};

export const updateReview = async (userId: string, reviewId: string, reviewData: Partial<CityReviewDto>) => {
  return await cityReviewRepository.update(prisma, userId, reviewId, reviewData);
};

export const getCityReviews = async (cityId: string, query: any, userId?: string) => {
  return await cityReviewRepository.findByCityId(prisma, cityId, query, userId);
};

export const getCityReviewByUser = async (userId: string, cityId: string) => {
  return await cityReviewRepository.findByUserAndCity(prisma, userId, cityId);
};

export const deleteReview = async (userId: string, reviewId: string) => {
  return await cityReviewRepository.deleteReview(prisma, userId, reviewId);
};

export const getAllCityReviews = async (query: any, userId?: string) => {
  return await cityReviewRepository.findAll(prisma, query, userId);
};

export const upvoteCityReview = async (userId: string, cityReviewId: string) => {
  return await cityReviewRepository.upvoteCityReview(prisma, userId, cityReviewId);
};

export const downvoteCityReview = async (userId: string, cityReviewId: string) => {
  return await cityReviewRepository.downvoteCityReview(prisma, userId, cityReviewId);
};

export const removeVoteFromCityReview = async (userId: string, cityReviewId: string) => {
  return await cityReviewRepository.removeVoteFromCityReview(prisma, userId, cityReviewId);
};

export const getCityReviewVote = async (userId: string, cityReviewId: string) => {
  return await cityReviewRepository.getVoteByUser(prisma, userId, cityReviewId);
};

export const saveCityReview = async (userId: string, cityReviewId: string) => {
  if (!userId || typeof userId !== 'string' || userId.trim() === '') {
    throw new Error('Invalid user ID');
  }
  if (!cityReviewId || typeof cityReviewId !== 'string' || cityReviewId.trim() === '') {
    throw new Error('Invalid city review ID');
  }

  const existingSave = await cityReviewSaveRepository.findByUserAndReview(prisma, userId, cityReviewId);
  if (existingSave) {
    throw new Error('City review already saved');
  }

  await cityReviewSaveRepository.create(prisma, userId, cityReviewId);

  return { message: 'City review saved successfully' };
};

export const unsaveCityReview = async (userId: string, cityReviewId: string) => {
  if (!userId || typeof userId !== 'string' || userId.trim() === '') {
    throw new Error('Invalid user ID');
  }
  if (!cityReviewId || typeof cityReviewId !== 'string' || cityReviewId.trim() === '') {
    throw new Error('Invalid city review ID');
  }

  const existingSave = await cityReviewSaveRepository.findByUserAndReview(prisma, userId, cityReviewId);
  if (!existingSave) {
    throw new Error('City review not saved');
  }

  await cityReviewSaveRepository.deleteByUserAndReview(prisma, userId, cityReviewId);

  return { message: 'City review unsaved successfully' };
};

export const getReviewById = async (reviewId: string, userId?: string) => {
  return await cityReviewRepository.findById(prisma, reviewId, userId);
};

export const getReviewCountriesStats = async () => {
  return await cityReviewRepository.getCountriesStats(prisma);
};

