import { Request, Response } from 'express';
import { prisma } from '../index';
import * as userService from '../services/UserService';
import * as s3Service from '../services/S3Service';
import * as commentService from '../services/CommentService';
import { 
  createSuccessResponse, 
  createErrorResponse, 
  createPaginatedResponse,
  UserQuerySchema,
  UpdateProfileSchema,
  IdParamSchema,
  validateQuery,
  validateParams,
  validateRequest,
  CommentQuerySchema,
  IdSchema,
  PaginationSchema
} from '../types';

export const getUsers = async (req: Request, res: Response): Promise<void> => {
  try {
    const queryValidation = UserQuerySchema.safeParse(req.query);
    if (!queryValidation.success) {
      res.status(400).json(createErrorResponse('Invalid query parameters', queryValidation.error.message));
      return;
    }

    const result = await userService.getAllUsers(prisma, queryValidation.data);

    res.json(createPaginatedResponse(result.users, result.pagination));
  } catch (error) {
    res.status(500).json(createErrorResponse('Failed to fetch users', error instanceof Error ? error.message : 'Unknown error'));
  }
};

export const getUserById = async (req: Request, res: Response): Promise<void> => {
  try {
    const paramsValidation = validateParams(IdParamSchema, req.params);
    if (!paramsValidation.success) {
      res.status(400).json(createErrorResponse('Invalid user ID', paramsValidation.error));
      return;
    }

    const user = await userService.getUserById(prisma, (paramsValidation.data as { id: string }).id);

    res.json(createSuccessResponse('User retrieved successfully', user));
  } catch (error) {
    if (error instanceof Error && error.message === 'User not found') {
      res.status(404).json(createErrorResponse('User not found'));
      return;
    }
    res.status(500).json(createErrorResponse('Failed to retrieve user', error instanceof Error ? error.message : 'Unknown error'));
  }
};

export const updateUser = async (req: Request, res: Response): Promise<void> => {
  try {
    if (!req.user) {
      res.status(401).json(createErrorResponse('Authentication required'));
      return;
    }

    const paramsValidation = validateParams(IdParamSchema, req.params);
    if (!paramsValidation.success) {
      res.status(400).json(createErrorResponse('Invalid user ID', paramsValidation.error));
      return;
    }

    const bodyValidation = validateRequest(UpdateProfileSchema, req.body);
    if (!bodyValidation.success) {
      res.status(400).json(createErrorResponse('Validation failed', bodyValidation.error));
      return;
    }

    const user = await userService.updateUser(prisma, (paramsValidation.data as { id: string }).id, bodyValidation.data as any, req.user.id);

    res.json(createSuccessResponse('User updated successfully', user));
  } catch (error) {
    if (error instanceof Error && error.message === 'Permission denied') {
      res.status(403).json(createErrorResponse(error.message));
      return;
    }

    res.status(400).json(createErrorResponse('Failed to update user', error instanceof Error ? error.message : 'Unknown error'));
  }
};

export const getUsersWithActivity = async (req: Request, res: Response): Promise<void> => {
  try {
    const queryValidation = UserQuerySchema.safeParse(req.query);
    if (!queryValidation.success) {
      res.status(400).json(createErrorResponse('Invalid query parameters', queryValidation.error.message));
      return;
    }

    const result = await userService.getUsersWithActivity(prisma, queryValidation.data);

    res.json(createPaginatedResponse(result.users, result.pagination));
  } catch (error) {
    res.status(500).json(createErrorResponse('Failed to fetch users with activity', error instanceof Error ? error.message : 'Unknown error'));
  }
};

export const uploadAvatar = async (req: Request, res: Response): Promise<void> => {
  try {
    if (!req.user) {
      res.status(401).json(createErrorResponse('Authentication required'));
      return;
    }

    const { id } = req.params;

    if (id !== req.user.id) {
      res.status(403).json(createErrorResponse('Cannot upload avatar for another user'));
      return;
    }

    if (!req.file) {
      res.status(400).json(createErrorResponse('No file uploaded'));
      return;
    }

    // Get current user data to access old avatar URL
    const currentUser = await userService.getUserById(prisma, req.user.id);
    const oldAvatarUrl = currentUser?.avatar ?? null;

    // Upload new avatar to S3
    const avatarUrl = await s3Service.uploadAvatar(req.file.buffer, req.file.mimetype, req.user.id);

    // Update user record with new avatar URL
    const updatedUser = await userService.updateUser(
      prisma,
      req.user.id,
      { avatar: avatarUrl } as any,
      req.user.id
    );

    // Delete old avatar after successful update (if it exists and is an S3 URL)
    if (oldAvatarUrl && oldAvatarUrl.includes('s3.') && oldAvatarUrl.includes('amazonaws.com')) {
      try {
        await s3Service.deleteAvatar(oldAvatarUrl);
      } catch (deleteError) {
        // Log the error but don't fail the request - the avatar upload was successful
        console.error('Failed to delete old avatar:', deleteError);
      }
    }

    res.json(createSuccessResponse('Avatar uploaded successfully', updatedUser));
  } catch (error) {
    res.status(500).json(createErrorResponse('Failed to upload avatar', error instanceof Error ? error.message : 'Unknown error'));
  }
};

export const getUserComments = async (req: Request, res: Response): Promise<void> => {
  try {
    const paramsValidation = validateParams(IdSchema, req.params);
    if (!paramsValidation.success) {
      res.status(400).json(createErrorResponse('Invalid user ID', paramsValidation.error));
      return;
    }

    const queryValidation = validateQuery(CommentQuerySchema, req.query);
    if (!queryValidation.success) {
      res.status(400).json(createErrorResponse('Invalid query parameters', queryValidation.error));
      return;
    }

    const { id } = paramsValidation.data as { id: string };
    const currentUserId = req.user?.id;

    const result = await commentService.getUserComments(
      prisma,
      id,
      queryValidation.data,
      currentUserId
    );

    res.json(createPaginatedResponse(result.comments, result.pagination));
  } catch (error) {
    res.status(500).json(createErrorResponse('Failed to fetch user comments', error instanceof Error ? error.message : 'Unknown error'));
  }
};

export const getSavedPosts = async (req: Request, res: Response): Promise<void> => {
  try {
    const paramsValidation = validateParams(IdSchema, req.params);
    if (!paramsValidation.success) {
      res.status(400).json(createErrorResponse('Invalid user ID', paramsValidation.error));
      return;
    }

    const queryValidation = validateQuery(PaginationSchema, req.query);
    if (!queryValidation.success) {
      res.status(400).json(createErrorResponse('Invalid query parameters', queryValidation.error));
      return;
    }

    const { id } = paramsValidation.data as { id: string };
    const result = await userService.getSavedPosts(prisma, id, queryValidation.data as any);

    res.json(createPaginatedResponse(result.posts, result.pagination));
  } catch (error) {
    res.status(500).json(createErrorResponse('Failed to fetch saved posts', error instanceof Error ? error.message : 'Unknown error'));
  }
};

export const getSavedCityReviews = async (req: Request, res: Response): Promise<void> => {
  try {
    const paramsValidation = validateParams(IdSchema, req.params);
    if (!paramsValidation.success) {
      res.status(400).json(createErrorResponse('Invalid user ID', paramsValidation.error));
      return;
    }

    const queryValidation = validateQuery(PaginationSchema, req.query);
    if (!queryValidation.success) {
      res.status(400).json(createErrorResponse('Invalid query parameters', queryValidation.error));
      return;
    }

    const { id } = paramsValidation.data as { id: string };
    const result = await userService.getSavedCityReviews(prisma, id, queryValidation.data as any);

    res.json(createPaginatedResponse(result.reviews, result.pagination));
  } catch (error) {
    res.status(500).json(createErrorResponse('Failed to fetch saved city reviews', error instanceof Error ? error.message : 'Unknown error'));
  }
};

export const getUpvotedPosts = async (req: Request, res: Response): Promise<void> => {
  try {
    const paramsValidation = validateParams(IdSchema, req.params);
    if (!paramsValidation.success) {
      res.status(400).json(createErrorResponse('Invalid user ID', paramsValidation.error));
      return;
    }

    const queryValidation = validateQuery(PaginationSchema, req.query);
    if (!queryValidation.success) {
      res.status(400).json(createErrorResponse('Invalid query parameters', queryValidation.error));
      return;
    }

    const { id } = paramsValidation.data as { id: string };
    const result = await userService.getUpvotedPosts(prisma, id, queryValidation.data as any);

    res.json(createPaginatedResponse(result.posts, result.pagination));
  } catch (error) {
    res.status(500).json(createErrorResponse('Failed to fetch upvoted posts', error instanceof Error ? error.message : 'Unknown error'));
  }
};

export const getUserCityReviews = async (req: Request, res: Response): Promise<void> => {
  try {
    const paramsValidation = validateParams(IdSchema, req.params);
    if (!paramsValidation.success) {
      res.status(400).json(createErrorResponse('Invalid user ID', paramsValidation.error));
      return;
    }

    const queryValidation = validateQuery(PaginationSchema, req.query);
    if (!queryValidation.success) {
      res.status(400).json(createErrorResponse('Invalid query parameters', queryValidation.error));
      return;
    }

    const { id } = paramsValidation.data as { id: string };
    const currentUserId = req.user?.id;

    const result = await userService.getCityReviewsByUser(
      prisma,
      id,
      queryValidation.data as any,
      currentUserId
    );

    res.json(createPaginatedResponse(result.reviews, result.pagination));
  } catch (error) {
    res.status(500).json(createErrorResponse('Failed to fetch city reviews', error instanceof Error ? error.message : 'Unknown error'));
  }
};

 