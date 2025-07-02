import { Request, Response } from 'express';
import * as cityService from '../services/CityService';
import * as cityReviewCommentService from '../services/CityReviewCommentService';
import { 
  createErrorResponse, 
  createPaginatedResponse,
  CityQuery,
  CommentSchema,
  IdSchema,
  validateRequest,
  validateParams
} from '../types';
import { CityReviewSchema, CityReviewUpdateSchema } from '../types/validations/city';
import { createSuccessResponse } from '../types/responses';
import { prisma } from '../index';

export const getCities = async (req: Request, res: Response): Promise<void> => {
  try {
    const fullQuery: CityQuery = req.query as any;
    const result = await cityService.getCities(fullQuery);
    res.json(createPaginatedResponse(result.cities, result.pagination));
  } catch (error) {
    res.status(500).json(createErrorResponse('Failed to fetch cities', error instanceof Error ? error.message : 'Unknown error'));
  }
};

export const getCitiesWithReviews = async (req: Request, res: Response): Promise<void> => {
  try {
    const fullQuery: CityQuery = req.query as any;
    const result = await cityService.getCitiesWithReviews(fullQuery);
    res.json(createPaginatedResponse(result.cities, result.pagination));
  } catch (error) {
    res.status(500).json(createErrorResponse('Failed to fetch cities with reviews', error instanceof Error ? error.message : 'Unknown error'));
  }
};

export const createReview = async (req: Request, res: Response): Promise<void> => {
  try {
    const userId = req.user?.id;
    if (!userId) {
      res.status(401).json(createErrorResponse('Unauthorized'));
      return;
    }

    // Accept cityId either from path param (new RESTful design) or from body (legacy)
    const cityIdParam = (req.params as any).cityId as string | undefined;
    const cityId = cityIdParam || (req.body as any).cityId;

    if (!cityId || typeof cityId !== 'string') {
      res.status(400).json(createErrorResponse('cityId is required and must be a string'));
      return;
    }

    const parsed = CityReviewSchema.safeParse(req.body);
    if (!parsed.success) {
      res.status(400).json(createErrorResponse('Validation failed', JSON.stringify(parsed.error.errors)));
      return;
    }

    // Remove cityId from the payload we forward to the service layer
    const { cityId: _removed, ...reviewData } = req.body;

    const review = await cityService.createReview(userId, cityId, reviewData);
    res.status(201).json(createSuccessResponse('Review created successfully', review));
  } catch (error) {
    res.status(500).json(createErrorResponse('Failed to create review', error instanceof Error ? error.message : 'Unknown error'));
  }
};

export const getCityReviews = async (req: Request, res: Response): Promise<void> => {
  try {
    const cityIdParam = (req.params as any).cityId as string | undefined;
    const cityId = cityIdParam || (req.query as any).cityId;
    if (!cityId || typeof cityId !== 'string') {
      res.status(400).json(createErrorResponse('cityId is required and must be a string'));
      return;
    }
    const userId = req.user?.id;
    const result = await cityService.getCityReviews(cityId, req.query, userId);
    res.json(createPaginatedResponse(result.reviews, result.pagination));
  } catch (error) {
    res.status(500).json(createErrorResponse('Failed to fetch city reviews', error instanceof Error ? error.message : 'Unknown error'));
  }
};

export const updateReview = async (req: Request, res: Response): Promise<void> => {
  try {
    const userId = req.user?.id;
    if (!userId) {
      res.status(401).json(createErrorResponse('Unauthorized'));
      return;
    }
    const { reviewId } = req.params;
    if (!reviewId || typeof reviewId !== 'string') {
      res.status(400).json(createErrorResponse('reviewId is required and must be a string'));
      return;
    }
    const parsed = CityReviewUpdateSchema.safeParse(req.body);
    if (!parsed.success) {
      res.status(400).json(createErrorResponse('Validation failed', JSON.stringify(parsed.error.errors)));
      return;
    }
    const review = await cityService.updateReview(userId, reviewId, req.body);
    res.status(200).json(createSuccessResponse('Review updated successfully', review));
  } catch (error) {
    res.status(500).json(createErrorResponse('Failed to update review', error instanceof Error ? error.message : 'Unknown error'));
  }
};

export const getCityReviewByUser = async (req: Request, res: Response): Promise<void> => {
  try {
    const userId = req.user?.id;
    const cityIdParam = (req.params as any).cityId as string | undefined;
    const cityId = cityIdParam || (req.query as any).cityId;
    if (!userId) {
      res.status(401).json(createErrorResponse('Unauthorized'));
      return;
    }
    if (!cityId || typeof cityId !== 'string') {
      res.status(400).json(createErrorResponse('cityId is required and must be a string'));
      return;
    }
    const review = await cityService.getCityReviewByUser(userId, cityId);
    if (!review) {
      res.status(404).json(createErrorResponse('Review not found'));
      return;
    }
    res.json(createSuccessResponse('Review fetched successfully', review));
  } catch (error) {
    res.status(500).json(createErrorResponse('Failed to fetch review', error instanceof Error ? error.message : 'Unknown error'));
  }
};

export const deleteReview = async (req: Request, res: Response): Promise<void> => {
  try {
    const userId = req.user?.id;
    const { reviewId } = req.params;
    if (!userId) {
      res.status(401).json(createErrorResponse('Unauthorized'));
      return;
    }
    if (!reviewId || typeof reviewId !== 'string') {
      res.status(400).json(createErrorResponse('reviewId is required and must be a string'));
      return;
    }
    await cityService.deleteReview(userId, reviewId);
    res.status(200).json(createSuccessResponse('Review deleted successfully', null));
  } catch (error) {
    res.status(500).json(createErrorResponse('Failed to delete review', error instanceof Error ? error.message : 'Unknown error'));
  }
};

export const getAllCityReviews = async (req: Request, res: Response): Promise<void> => {
  try {
    const userId = req.user?.id;
    const result = await cityService.getAllCityReviews(req.query, userId);
    res.json(createPaginatedResponse(result.reviews, result.pagination));
  } catch (error) {
    res.status(500).json(createErrorResponse('Failed to fetch all city reviews', error instanceof Error ? error.message : 'Unknown error'));
  }
};

export const upvoteCityReview = async (req: Request, res: Response): Promise<void> => {
  try {
    const userId = req.user?.id;
    if (!userId) {
      res.status(401).json(createErrorResponse('Unauthorized'));
      return;
    }
    
    const bodyId = (req.body as any).cityReviewId as string | undefined;
    const paramId = (req.params as any).reviewId as string | undefined;
    const cityReviewId = bodyId || paramId;

    if (!cityReviewId || typeof cityReviewId !== 'string') {
      res.status(400).json(createErrorResponse('cityReviewId is required and must be a string'));
      return;
    }

    await cityService.upvoteCityReview(userId, cityReviewId);
    res.status(200).json(createSuccessResponse('City review upvoted successfully', null));
  } catch (error) {
    res.status(500).json(createErrorResponse('Failed to upvote city review', error instanceof Error ? error.message : 'Unknown error'));
  }
};

export const downvoteCityReview = async (req: Request, res: Response): Promise<void> => {
  try {
    const userId = req.user?.id;
    if (!userId) {
      res.status(401).json(createErrorResponse('Unauthorized'));
      return;
    }
    
    const bodyId = (req.body as any).cityReviewId as string | undefined;
    const paramId = (req.params as any).reviewId as string | undefined;
    const cityReviewId = bodyId || paramId;

    if (!cityReviewId || typeof cityReviewId !== 'string') {
      res.status(400).json(createErrorResponse('cityReviewId is required and must be a string'));
      return;
    }

    await cityService.downvoteCityReview(userId, cityReviewId);
    res.status(200).json(createSuccessResponse('City review downvoted successfully', null));
  } catch (error) {
    res.status(500).json(createErrorResponse('Failed to downvote city review', error instanceof Error ? error.message : 'Unknown error'));
  }
};

export const removeVoteFromCityReview = async (req: Request, res: Response): Promise<void> => {
  try {
    const userId = req.user?.id;
    if (!userId) {
      res.status(401).json(createErrorResponse('Unauthorized'));
      return;
    }
    
    const bodyId = (req.body as any).cityReviewId as string | undefined;
    const paramId = (req.params as any).reviewId as string | undefined;
    const cityReviewId = bodyId || paramId;

    if (!cityReviewId || typeof cityReviewId !== 'string') {
      res.status(400).json(createErrorResponse('cityReviewId is required and must be a string'));
      return;
    }

    await cityService.removeVoteFromCityReview(userId, cityReviewId);
    res.status(200).json(createSuccessResponse('Vote removed successfully', null));
  } catch (error) {
    res.status(500).json(createErrorResponse('Failed to remove vote', error instanceof Error ? error.message : 'Unknown error'));
  }
};

export const saveCityReview = async (req: Request, res: Response): Promise<void> => {
  try {
    const userId = req.user?.id;
    if (!userId) {
      res.status(401).json(createErrorResponse('Unauthorized'));
      return;
    }

    const bodyId = (req.body as any).cityReviewId as string | undefined;
    const paramId = (req.params as any).reviewId as string | undefined;
    const cityReviewId = bodyId || paramId;

    if (!cityReviewId || typeof cityReviewId !== 'string') {
      res.status(400).json(createErrorResponse('cityReviewId is required and must be a string'));
      return;
    }

    await cityService.saveCityReview(userId, cityReviewId);
    res.status(200).json(createSuccessResponse('City review saved successfully', null));
  } catch (error) {
    res.status(500).json(createErrorResponse('Failed to save city review', error instanceof Error ? error.message : 'Unknown error'));
  }
};

export const unsaveCityReview = async (req: Request, res: Response): Promise<void> => {
  try {
    const userId = req.user?.id;
    if (!userId) {
      res.status(401).json(createErrorResponse('Unauthorized'));
      return;
    }

    const bodyId = (req.body as any).cityReviewId as string | undefined;
    const paramId = (req.params as any).reviewId as string | undefined;
    const cityReviewId = bodyId || paramId;

    if (!cityReviewId || typeof cityReviewId !== 'string') {
      res.status(400).json(createErrorResponse('cityReviewId is required and must be a string'));
      return;
    }

    await cityService.unsaveCityReview(userId, cityReviewId);
    res.status(200).json(createSuccessResponse('City review unsaved successfully', null));
  } catch (error) {
    res.status(500).json(createErrorResponse('Failed to unsave city review', error instanceof Error ? error.message : 'Unknown error'));
  }
};

// City Review Comment Methods

export const getCityReviewComments = async (req: Request, res: Response): Promise<void> => {
  try {
    const paramsValidation = validateParams(IdSchema, req.params);
    if (!paramsValidation.success) {
      res.status(400).json(createErrorResponse('Invalid city review ID', paramsValidation.error));
      return;
    }

    const userId = req.user?.id;
    const result = await cityReviewCommentService.getCityReviewComments(prisma, (paramsValidation.data as { id: string }).id, req.query, userId);

    res.json(createPaginatedResponse(result.comments, result.pagination));
  } catch (error) {
    res.status(500).json(createErrorResponse('Failed to fetch city review comments', error instanceof Error ? error.message : 'Unknown error'));
  }
};

export const addCityReviewComment = async (req: Request, res: Response): Promise<void> => {
  try {
    if (!req.user) {
      res.status(401).json(createErrorResponse('Authentication required'));
      return;
    }

    const paramsValidation = validateParams(IdSchema, req.params);
    if (!paramsValidation.success) {
      res.status(400).json(createErrorResponse('Invalid city review ID', paramsValidation.error));
      return;
    }

    const bodyValidation = validateRequest(CommentSchema, req.body);
    if (!bodyValidation.success) {
      res.status(400).json(createErrorResponse('Validation failed', bodyValidation.error));
      return;
    }

    const comment = await cityReviewCommentService.addComment(prisma, req.user.id, (paramsValidation.data as { id: string }).id, bodyValidation.data);

    res.status(201).json(createSuccessResponse('Comment added successfully', comment));
  } catch (error) {
    res.status(400).json(createErrorResponse('Failed to add comment', error instanceof Error ? error.message : 'Unknown error'));
  }
};

export const getReviewById = async (req: Request, res: Response): Promise<void> => {
  try {
    const { reviewId } = req.params;
    if (!reviewId || typeof reviewId !== 'string') {
      res.status(400).json(createErrorResponse('reviewId is required and must be a string'));
      return;
    }
    const userId = req.user?.id;
    const review = await cityService.getReviewById(reviewId, userId);
    if (!review) {
      res.status(404).json(createErrorResponse('Review not found'));
      return;
    }
    res.json(createSuccessResponse('Review fetched successfully', review));
  } catch (error) {
    res.status(500).json(createErrorResponse('Failed to fetch review', error instanceof Error ? error.message : 'Unknown error'));
  }
};

export const getReviewCountriesStats = async (req: Request, res: Response): Promise<void> => {
  try {
    const data = await cityService.getReviewCountriesStats();
    res.json(createSuccessResponse('Countries retrieved successfully', data));
  } catch (error) {
    res.status(500).json(createErrorResponse('Failed to fetch countries', error instanceof Error ? error.message : 'Unknown error'));
  }
}; 