import { Request, Response } from 'express';
import { prisma } from '../index';
import * as commentService from '../services/CommentService';
import { 
  createSuccessResponse, 
  createErrorResponse,
  IdSchema,
  UpdateCommentSchema,
  validateParams,
  validateRequest
} from '../types';

export const upvoteComment = async (req: Request, res: Response): Promise<void> => {
  try {
    if (!req.user) {
      res.status(401).json(createErrorResponse('Authentication required'));
      return;
    }

    const paramsValidation = validateParams(IdSchema, req.params);
    if (!paramsValidation.success) {
      res.status(400).json(createErrorResponse('Invalid comment ID', paramsValidation.error));
      return;
    }

    await commentService.voteComment(prisma, req.user.id, (paramsValidation.data as { id: string }).id, 'UPVOTE');

    res.json(createSuccessResponse('Comment upvoted successfully', null));
  } catch (error) {
    if (error instanceof Error) {
      if (error.message === 'Comment not found') {
        res.status(404).json(createErrorResponse('Comment not found'));
        return;
      }
    }
    res.status(400).json(createErrorResponse('Failed to upvote comment', error instanceof Error ? error.message : 'Unknown error'));
  }
};

export const downvoteComment = async (req: Request, res: Response): Promise<void> => {
  try {
    if (!req.user) {
      res.status(401).json(createErrorResponse('Authentication required'));
      return;
    }

    const paramsValidation = validateParams(IdSchema, req.params);
    if (!paramsValidation.success) {
      res.status(400).json(createErrorResponse('Invalid comment ID', paramsValidation.error));
      return;
    }

    await commentService.voteComment(prisma, req.user.id, (paramsValidation.data as { id: string }).id, 'DOWNVOTE');

    res.json(createSuccessResponse('Comment downvoted successfully', null));
  } catch (error) {
    if (error instanceof Error) {
      if (error.message === 'Comment not found') {
        res.status(404).json(createErrorResponse('Comment not found'));
        return;
      }
    }
    res.status(400).json(createErrorResponse('Failed to downvote comment', error instanceof Error ? error.message : 'Unknown error'));
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
      res.status(400).json(createErrorResponse('Invalid comment ID', paramsValidation.error));
      return;
    }

    await commentService.removeVote(prisma, req.user.id, (paramsValidation.data as { id: string }).id);

    res.json(createSuccessResponse('Vote removed successfully', null));
  } catch (error) {
    if (error instanceof Error && error.message === 'No vote to remove') {
      res.status(400).json(createErrorResponse(error.message));
      return;
    }
    res.status(400).json(createErrorResponse('Failed to remove vote', error instanceof Error ? error.message : 'Unknown error'));
  }
};

export const updateComment = async (req: Request, res: Response): Promise<void> => {
  try {
    if (!req.user) {
      res.status(401).json(createErrorResponse('Authentication required'));
      return;
    }

    const paramsValidation = validateParams(IdSchema, req.params);
    if (!paramsValidation.success) {
      res.status(400).json(createErrorResponse('Invalid comment ID', paramsValidation.error));
      return;
    }

    const bodyValidation = validateRequest(UpdateCommentSchema, req.body);
    if (!bodyValidation.success) {
      res.status(400).json(createErrorResponse('Validation failed', bodyValidation.error));
      return;
    }

    const comment = await commentService.updateComment(
      prisma, 
      req.user.id, 
      (paramsValidation.data as { id: string }).id, 
      bodyValidation.data
    );

    res.json(createSuccessResponse('Comment updated successfully', comment));
  } catch (error) {
    if (error instanceof Error) {
      if (error.message === 'Comment not found') {
        res.status(404).json(createErrorResponse('Comment not found'));
        return;
      }
      if (error.message.includes('Unauthorized')) {
        res.status(403).json(createErrorResponse(error.message));
        return;
      }
      if (error.message === 'Cannot edit deleted comments') {
        res.status(400).json(createErrorResponse(error.message));
        return;
      }
    }
    res.status(400).json(createErrorResponse('Failed to update comment', error instanceof Error ? error.message : 'Unknown error'));
  }
};

export const deleteComment = async (req: Request, res: Response): Promise<void> => {
  try {
    if (!req.user) {
      res.status(401).json(createErrorResponse('Authentication required'));
      return;
    }

    const paramsValidation = validateParams(IdSchema, req.params);
    if (!paramsValidation.success) {
      res.status(400).json(createErrorResponse('Invalid comment ID', paramsValidation.error));
      return;
    }

    await commentService.deleteComment(
      prisma, 
      req.user.id, 
      (paramsValidation.data as { id: string }).id
    );

    res.json(createSuccessResponse('Comment deleted successfully', null));
  } catch (error) {
    if (error instanceof Error) {
      if (error.message === 'Comment not found') {
        res.status(404).json(createErrorResponse('Comment not found'));
        return;
      }
      if (error.message.includes('Unauthorized')) {
        res.status(403).json(createErrorResponse(error.message));
        return;
      }
      if (error.message === 'Comment already deleted') {
        res.status(400).json(createErrorResponse(error.message));
        return;
      }
    }
    res.status(400).json(createErrorResponse('Failed to delete comment', error instanceof Error ? error.message : 'Unknown error'));
  }
}; 