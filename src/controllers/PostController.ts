import { Request, Response } from 'express';
import { prisma } from '../index';
import * as postService from '../services/PostService';
import { findById as findCityById, getAllCountries } from '../repositories/CityRepository';
import * as s3Service from '../services/S3Service';
import { 
  createSuccessResponse, 
  createErrorResponse, 
  createPaginatedResponse,
  PostSchema,
  UpdatePostSchema,
  CommentSchema,
  PostQuerySchema,
  IdSchema,
  validateRequest,
  validateQuery,
  validateParams
} from '../types';

export const createPost = async (req: Request, res: Response): Promise<void> => {
  try {
    if (!req.user) {
      res.status(401).json(createErrorResponse('Authentication required'));
      return;
    }

    // Handle both JSON and form data
    let postData: any;
    
    if (req.is('multipart/form-data')) {
      // Parse form data
      postData = {
        title: req.body.title,
        content: req.body.content,
        category: req.body.category || 'DISCUSSION',
        tags: Array.isArray(req.body.tags) ? req.body.tags : [req.body.tags].filter(Boolean),
        cityId: req.body.cityId || undefined 
      };
    } else {
      // Use JSON body as before
      postData = req.body;
    }

    const validation = validateRequest(PostSchema, postData);
    if (!validation.success) {
      res.status(400).json(createErrorResponse('Validation failed', validation.error));
      return;
    }

    const { cityId, ...rest } = validation.data;
    
    // Handle cityId validation and conversion
    let finalCityId = cityId;
    if (cityId) {
      try {
        // First try to find the city in the database
        const existingCity = await prisma.city.findUnique({
          where: { id: cityId }
        });
        
        if (!existingCity) {
          // If not found in database, try to find it in CSV data
          const csvCity = await findCityById(cityId);
          if (csvCity) {
            // Create the city in the database
            const newCity = await prisma.city.create({
              data: {
                id: csvCity.id,
                name: csvCity.name,
                country: csvCity.country,
                slug: `${csvCity.name.toLowerCase().replace(/[^a-z0-9]+/g, '-')}-${csvCity.country.toLowerCase().replace(/[^a-z0-9]+/g, '-')}-${csvCity.id}`
              }
            });
            finalCityId = newCity.id;
          } else {
            res.status(400).json(createErrorResponse('City not found. Please provide a valid city ID.'));
            return;
          }
        }
      } catch (error) {
        console.error('Error handling cityId:', error);
        res.status(400).json(createErrorResponse('Invalid city ID. Please provide a valid city ID.'));
        return;
      }
    }
    
    // Handle image uploads if present
    let imageUrls: string[] = [];
    const files = req.files as Express.Multer.File[] | undefined;
    
    if (files && files.length > 0) {
      // Create post first to get ID for S3 upload
      const tempPostData = { 
        ...rest, 
        ...(finalCityId && { cityId: finalCityId }),
        category: rest.category ?? 'DISCUSSION'
      };
      const tempPost = await postService.createPost(prisma, req.user.id, tempPostData);
      
      // Upload images to S3
      imageUrls = await Promise.all(
        files.map(file => s3Service.uploadPostImage(file.buffer, file.mimetype, tempPost.id))
      );
      
      // Update post with image URLs
      const finalPost = await postService.updatePost(prisma, req.user.id, tempPost.id, { images: imageUrls });
      res.status(201).json(createSuccessResponse('Post created successfully', finalPost));
    } else {
      // No images, create post normally
      const postDataWithCity = { 
        ...rest, 
        ...(finalCityId && { cityId: finalCityId }),
        category: rest.category ?? 'DISCUSSION'
      };
      const post = await postService.createPost(prisma, req.user.id, postDataWithCity);
      res.status(201).json(createSuccessResponse('Post created successfully', post));
    }
  } catch (error) {
    res.status(400).json(createErrorResponse('Failed to create post', error instanceof Error ? error.message : 'Unknown error'));
  }
};

export const getPosts = async (req: Request, res: Response): Promise<void> => {
  try {
    const queryValidation = validateQuery(PostQuerySchema, req.query);
    if (!queryValidation.success) {
      res.status(400).json(createErrorResponse('Invalid query parameters', queryValidation.error));
      return;
    }

    const userId = req.user?.id;
    const result = await postService.getPosts(prisma, queryValidation.data as any, userId);

    res.json(createPaginatedResponse(result.posts, result.pagination));
  } catch (error) {
    res.status(500).json(createErrorResponse('Failed to fetch posts', error instanceof Error ? error.message : 'Unknown error'));
  }
};

export const getPostById = async (req: Request, res: Response): Promise<void> => {
  try {
    const paramsValidation = validateParams(IdSchema, req.params);
    if (!paramsValidation.success) {
      res.status(400).json(createErrorResponse('Invalid post ID', paramsValidation.error));
      return;
    }

    const userId = req.user?.id;
    const { id } = paramsValidation.data as { id: string };
    const post = await postService.getPostById(prisma, id, userId);

    res.json(createSuccessResponse('Post retrieved successfully', post));
  } catch (error) {
    if (error instanceof Error && error.message === 'Post not found') {
      res.status(404).json(createErrorResponse('Post not found'));
      return;
    }
    res.status(500).json(createErrorResponse('Failed to retrieve post', error instanceof Error ? error.message : 'Unknown error'));
  }
};

export const upvotePost = async (req: Request, res: Response): Promise<void> => {
  try {
    if (!req.user) {
      res.status(401).json(createErrorResponse('Authentication required'));
      return;
    }

    const paramsValidation = validateParams(IdSchema, req.params);
    if (!paramsValidation.success) {
      res.status(400).json(createErrorResponse('Invalid post ID', paramsValidation.error));
      return;
    }

    await postService.votePost(prisma, req.user.id, (paramsValidation.data as { id: string }).id, 'UPVOTE');

    res.json(createSuccessResponse('Post upvoted successfully', null));
  } catch (error) {
    res.status(400).json(createErrorResponse('Failed to upvote post', error instanceof Error ? error.message : 'Unknown error'));
  }
};

export const downvotePost = async (req: Request, res: Response): Promise<void> => {
  try {
    if (!req.user) {
      res.status(401).json(createErrorResponse('Authentication required'));
      return;
    }

    const paramsValidation = validateParams(IdSchema, req.params);
    if (!paramsValidation.success) {
      res.status(400).json(createErrorResponse('Invalid post ID', paramsValidation.error));
      return;
    }

    await postService.votePost(prisma, req.user.id, (paramsValidation.data as { id: string }).id, 'DOWNVOTE');

    res.json(createSuccessResponse('Post downvoted successfully', null));
  } catch (error) {
    res.status(400).json(createErrorResponse('Failed to downvote post', error instanceof Error ? error.message : 'Unknown error'));
  }
};

export const removeVote = async (req: Request, res: Response): Promise<void> => {
  try {
    if (!req.user) {
      res.status(401).json(createErrorResponse('Authentication required'));
      return;
    }

    const paramsValidation = validateParams(IdSchema, req.params);
    if (!paramsValidation.success) {
      res.status(400).json(createErrorResponse('Invalid post ID', paramsValidation.error));
      return;
    }

    await postService.removeVote(prisma, req.user.id, (paramsValidation.data as { id: string }).id);

    res.json(createSuccessResponse('Vote removed successfully', null));
  } catch (error) {
    res.status(400).json(createErrorResponse('Failed to remove vote', error instanceof Error ? error.message : 'Unknown error'));
  }
};

export const savePost = async (req: Request, res: Response): Promise<void> => {
  try {
    if (!req.user) {
      res.status(401).json(createErrorResponse('Authentication required'));
      return;
    }

    const paramsValidation = validateParams(IdSchema, req.params);
    if (!paramsValidation.success) {
      res.status(400).json(createErrorResponse('Invalid post ID', paramsValidation.error));
      return;
    }

    await postService.savePost(prisma, req.user.id, (paramsValidation.data as { id: string }).id);

    res.json(createSuccessResponse('Post saved successfully', null));
  } catch (error) {
    res.status(400).json(createErrorResponse('Failed to save post', error instanceof Error ? error.message : 'Unknown error'));
  }
};

export const unsavePost = async (req: Request, res: Response): Promise<void> => {
  try {
    if (!req.user) {
      res.status(401).json(createErrorResponse('Authentication required'));
      return;
    }

    const paramsValidation = validateParams(IdSchema, req.params);
    if (!paramsValidation.success) {
      res.status(400).json(createErrorResponse('Invalid post ID', paramsValidation.error));
      return;
    }

    await postService.unsavePost(prisma, req.user.id, (paramsValidation.data as { id: string }).id);

    res.json(createSuccessResponse('Post unsaved successfully', null));
  } catch (error) {
    res.status(400).json(createErrorResponse('Failed to unsave post', error instanceof Error ? error.message : 'Unknown error'));
  }
};

export const addComment = async (req: Request, res: Response): Promise<void> => {
  try {
    if (!req.user) {
      res.status(401).json(createErrorResponse('Authentication required'));
      return;
    }

    const paramsValidation = validateParams(IdSchema, req.params);
    if (!paramsValidation.success) {
      res.status(400).json(createErrorResponse('Invalid post ID', paramsValidation.error));
      return;
    }

    const bodyValidation = validateRequest(CommentSchema, req.body);
    if (!bodyValidation.success) {
      res.status(400).json(createErrorResponse('Validation failed', bodyValidation.error));
      return;
    }

    const comment = await postService.addComment(prisma, req.user.id, (paramsValidation.data as { id: string }).id, bodyValidation.data);

    res.status(201).json(createSuccessResponse('Comment added successfully', comment));
  } catch (error) {
    res.status(400).json(createErrorResponse('Failed to add comment', error instanceof Error ? error.message : 'Unknown error'));
  }
};

export const getPostsWithComments = async (req: Request, res: Response): Promise<void> => {
  try {
    const queryValidation = validateQuery(PostQuerySchema, req.query);
    if (!queryValidation.success) {
      res.status(400).json(createErrorResponse('Invalid query parameters', queryValidation.error));
      return;
    }

    const userId = req.user?.id;
    const result = await postService.getPostsWithComments(prisma, queryValidation.data as any, userId);

    res.json(createPaginatedResponse(result.posts, result.pagination));
  } catch (error) {
    res.status(500).json(createErrorResponse('Failed to fetch posts with comments', error instanceof Error ? error.message : 'Unknown error'));
  }
};

export const getPostComments = async (req: Request, res: Response): Promise<void> => {
  try {
    const paramsValidation = validateParams(IdSchema, req.params);
    if (!paramsValidation.success) {
      res.status(400).json(createErrorResponse('Invalid post ID', paramsValidation.error));
      return;
    }

    const userId = req.user?.id;
    const result = await postService.getPostComments(prisma, (paramsValidation.data as { id: string }).id, req.query, userId);

    res.json(createPaginatedResponse(result.comments, result.pagination));
  } catch (error) {
    res.status(500).json(createErrorResponse('Failed to fetch post comments', error instanceof Error ? error.message : 'Unknown error'));
  }
};

export const updatePost = async (req: Request, res: Response): Promise<void> => {
  try {
    if (!req.user) {
      res.status(401).json(createErrorResponse('Authentication required'));
      return;
    }

    const paramsValidation = validateParams(IdSchema, req.params);
    if (!paramsValidation.success) {
      res.status(400).json(createErrorResponse('Invalid post ID', paramsValidation.error));
      return;
    }

    const validation = validateRequest(UpdatePostSchema, req.body);
    if (!validation.success) {
      res.status(400).json(createErrorResponse('Validation failed', validation.error));
      return;
    }

    const { id } = paramsValidation.data as { id: string };
    
    // Handle cityId validation and conversion for updates
    let updateData = validation.data;
    if (updateData.cityId) {
      try {
        // First try to find the city in the database
        const existingCity = await prisma.city.findUnique({
          where: { id: updateData.cityId }
        });
        
        if (!existingCity) {
          // If not found in database, try to find it in CSV data
          const csvCity = await findCityById(updateData.cityId);
          if (csvCity) {
            // Create the city in the database
            const newCity = await prisma.city.create({
              data: {
                id: csvCity.id,
                name: csvCity.name,
                country: csvCity.country,
                slug: `${csvCity.name.toLowerCase().replace(/[^a-z0-9]+/g, '-')}-${csvCity.country.toLowerCase().replace(/[^a-z0-9]+/g, '-')}-${csvCity.id}`
              }
            });
            updateData = { ...updateData, cityId: newCity.id };
          } else {
            res.status(400).json(createErrorResponse('City not found. Please provide a valid city ID.'));
            return;
          }
        }
      } catch (error) {
        console.error('Error handling cityId in update:', error);
        res.status(400).json(createErrorResponse('Invalid city ID. Please provide a valid city ID.'));
        return;
      }
    }
    
    const post = await postService.updatePost(prisma, req.user.id, id, updateData);

    res.json(createSuccessResponse('Post updated successfully', post));
  } catch (error) {
    if (error instanceof Error) {
      if (error.message === 'Post not found') {
        res.status(404).json(createErrorResponse('Post not found'));
        return;
      }
      if (error.message.includes('Unauthorized')) {
        res.status(403).json(createErrorResponse(error.message));
        return;
      }
      if (error.message === 'Selected city not found') {
        res.status(400).json(createErrorResponse('Selected city not found'));
        return;
      }
    }
    res.status(400).json(createErrorResponse('Failed to update post', error instanceof Error ? error.message : 'Unknown error'));
  }
};

export const deletePost = async (req: Request, res: Response): Promise<void> => {
  try {
    if (!req.user) {
      res.status(401).json(createErrorResponse('Authentication required'));
      return;
    }

    const paramsValidation = validateParams(IdSchema, req.params);
    if (!paramsValidation.success) {
      res.status(400).json(createErrorResponse('Invalid post ID', paramsValidation.error));
      return;
    }

    const { id } = paramsValidation.data as { id: string };
    await postService.deletePost(prisma, req.user.id, id);

    res.json(createSuccessResponse('Post deleted successfully', null));
  } catch (error) {
    if (error instanceof Error) {
      if (error.message === 'Post not found') {
        res.status(404).json(createErrorResponse('Post not found'));
        return;
      }
      if (error.message.includes('Unauthorized')) {
        res.status(403).json(createErrorResponse(error.message));
        return;
      }
    }
    res.status(400).json(createErrorResponse('Failed to delete post', error instanceof Error ? error.message : 'Unknown error'));
  }
};

// Upload images for a post (additive)
export const uploadImages = async (req: Request, res: Response): Promise<void> => {
  try {
    if (!req.user) {
      res.status(401).json(createErrorResponse('Authentication required'));
      return;
    }

    const paramsValidation = validateParams(IdSchema, req.params);
    if (!paramsValidation.success) {
      res.status(400).json(createErrorResponse('Invalid post ID', paramsValidation.error));
      return;
    }

    const { id } = paramsValidation.data as { id: string };

    // Ensure files uploaded
    const files = req.files as Express.Multer.File[] | undefined;
    if (!files || files.length === 0) {
      res.status(400).json(createErrorResponse('No files uploaded'));
      return;
    }

    // Verify post belongs to user (only owner can add images)
    const post = await postService.getPostById(prisma, id, req.user.id);
    if (!post) {
      res.status(404).json(createErrorResponse('Post not found'));
      return;
    }
    if ((post as any).userId && (post as any).userId !== req.user.id) {
      res.status(403).json(createErrorResponse('Unauthorized'));
      return;
    }

    // Upload each image
    const uploadedUrls: string[] = await Promise.all(
      files.map(file => s3Service.uploadPostImage(file.buffer, file.mimetype, id))
    );

    // Append to existing images
    const existingImages: string[] = Array.isArray((post as any).images) ? (post as any).images : [];
    const updatedPost = await postService.updatePost(prisma, req.user.id, id, { images: [...existingImages, ...uploadedUrls] } as any);

    res.json(createSuccessResponse('Images uploaded successfully', { images: uploadedUrls, post: updatedPost }));
  } catch (error) {
    res.status(500).json(createErrorResponse('Failed to upload images', error instanceof Error ? error.message : 'Unknown error'));
  }
};

export const getCountriesStats = async (req: Request, res: Response): Promise<void> => {
  try {
    const data = await postService.getCountriesStats(prisma);
    res.json(createSuccessResponse('Countries retrieved successfully', data));
  } catch (error) {
    res.status(500).json(createErrorResponse('Failed to fetch countries', error instanceof Error ? error.message : 'Unknown error'));
  }
}; 