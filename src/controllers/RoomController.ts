import { Request, Response } from 'express';
import { prisma } from '../index';
import * as roomService from '../services/RoomService';
import { 
  createSuccessResponse, 
  createErrorResponse, 
  createPaginatedResponse,
  RoomSchema,
  RoomQuerySchema,
  IdSchema,
  PaginationSchema,
  validateRequest,
  validateQuery,
  validateParams
} from '../types';

export const createRoom = async (req: Request, res: Response): Promise<void> => {
  try {
    if (!req.user) {
      res.status(401).json(createErrorResponse('Authentication required'));
      return;
    }

    const validation = validateRequest(RoomSchema, req.body);
    if (!validation.success) {
      res.status(400).json(createErrorResponse('Validation failed', validation.error));
      return;
    }

    const room = await roomService.createRoom(prisma, req.user.id, validation.data as any);

    res.status(201).json(createSuccessResponse('Room created successfully', { ...room, onlineMembers: [] }));
  } catch (error) {
    res.status(400).json(createErrorResponse('Failed to create room', error instanceof Error ? error.message : 'Unknown error'));
  }
};

export const getRooms = async (req: Request, res: Response): Promise<void> => {
  try {
    const queryValidation = validateQuery(RoomQuerySchema, req.query);
    if (!queryValidation.success) {
      res.status(400).json(createErrorResponse('Invalid query parameters', queryValidation.error));
      return;
    }

    const userId = req.user?.id;
    const result = await roomService.getRooms(prisma, queryValidation.data as any, userId);

    res.json(createPaginatedResponse(result.rooms, result.pagination));
  } catch (error) {
    res.status(500).json(createErrorResponse('Failed to fetch rooms', error instanceof Error ? error.message : 'Unknown error'));
  }
};

/**
 * Get room by ID, including onlineMembers (array of online user objects in the room)
 */
export const getRoomById = async (req: Request, res: Response): Promise<void> => {
  try {
    const paramsValidation = validateParams(IdSchema, req.params);
    if (!paramsValidation.success) {
      res.status(400).json(createErrorResponse('Invalid room ID', paramsValidation.error));
      return;
    }

    const userId = req.user?.id;
    const { id } = paramsValidation.data as { id: string };
    const room = await roomService.getRoomById(prisma, id, userId);

    res.json(createSuccessResponse('Room retrieved successfully', room));
  } catch (error) {
    if (error instanceof Error) {
      if (error.message === 'Room not found') {
        res.status(404).json(createErrorResponse('Room not found'));
        return;
      }
      if (error.message === 'Invalid room ID') {
        res.status(400).json(createErrorResponse('Invalid room ID'));
        return;
      }
    }
    res.status(500).json(createErrorResponse('Failed to retrieve room', error instanceof Error ? error.message : 'Unknown error'));
  }
};

export const joinRoom = async (req: Request, res: Response): Promise<void> => {
  try {
    if (!req.user) {
      res.status(401).json(createErrorResponse('Authentication required'));
      return;
    }

    const paramsValidation = validateParams(IdSchema, req.params);
    if (!paramsValidation.success) {
      res.status(400).json(createErrorResponse('Invalid room ID', paramsValidation.error));
      return;
    }

    await roomService.joinRoom(prisma, req.user.id, (paramsValidation.data as { id: string }).id);

    res.json(createSuccessResponse('Joined room successfully', null));
  } catch (error) {
    res.status(400).json(createErrorResponse('Failed to join room', error instanceof Error ? error.message : 'Unknown error'));
  }
};

export const leaveRoom = async (req: Request, res: Response): Promise<void> => {
  try {
    if (!req.user) {
      res.status(401).json(createErrorResponse('Authentication required'));
      return;
    }

    const paramsValidation = validateParams(IdSchema, req.params);
    if (!paramsValidation.success) {
      res.status(400).json(createErrorResponse('Invalid room ID', paramsValidation.error));
      return;
    }

    await roomService.leaveRoom(prisma, req.user.id, (paramsValidation.data as { id: string }).id);

    res.json(createSuccessResponse('Left room successfully', null));
  } catch (error) {
    res.status(400).json(createErrorResponse('Failed to leave room', error instanceof Error ? error.message : 'Unknown error'));
  }
};

export const getMessages = async (req: Request, res: Response): Promise<void> => {
  try {
    if (!req.user) {
      res.status(401).json(createErrorResponse('Authentication required'));
      return;
    }

    const paramsValidation = validateParams(IdSchema, req.params);
    if (!paramsValidation.success) {
      res.status(400).json(createErrorResponse('Invalid room ID', paramsValidation.error));
      return;
    }

    const queryValidation = validateQuery(PaginationSchema, req.query);
    if (!queryValidation.success) {
      res.status(400).json(createErrorResponse('Invalid query parameters', queryValidation.error));
      return;
    }

    const result = await roomService.getMessages(prisma, (paramsValidation.data as { id: string }).id, req.user.id, queryValidation.data);

    res.json(createPaginatedResponse(result.messages, result.pagination));
  } catch (error) {
    if (error instanceof Error && error.message === 'You are not a member of this room') {
      res.status(403).json(createErrorResponse(error.message));
      return;
    }
    res.status(500).json(createErrorResponse('Failed to fetch messages', error instanceof Error ? error.message : 'Unknown error'));
  }
};

export const getRoomsWithMembersAndMessages = async (req: Request, res: Response): Promise<void> => {
  try {
    const queryValidation = validateQuery(RoomQuerySchema, req.query);
    if (!queryValidation.success) {
      res.status(400).json(createErrorResponse('Invalid query parameters', queryValidation.error));
      return;
    }

    const userId = req.user?.id;
    const result = await roomService.getRoomsWithMembersAndMessages(prisma, queryValidation.data as any, userId);

    res.json(createPaginatedResponse(result.rooms, result.pagination));
  } catch (error) {
    res.status(500).json(createErrorResponse('Failed to fetch rooms with members and messages', error instanceof Error ? error.message : 'Unknown error'));
  }
};

export const sendMessage = async (req: Request, res: Response): Promise<void> => {
  try {
    if (!req.user) {
      res.status(401).json(createErrorResponse('Authentication required'));
      return;
    }
    const paramsValidation = validateParams(IdSchema, req.params);
    if (!paramsValidation.success) {
      res.status(400).json(createErrorResponse('Invalid room ID', paramsValidation.error));
      return;
    }
    const { content } = req.body;
    if (!content || typeof content !== 'string' || content.trim() === '') {
      res.status(400).json(createErrorResponse('Message content is required'));
      return;
    }
    const message = await roomService.sendMessage(
      prisma,
      req.user.id,
      (paramsValidation.data as { id: string }).id,
      { content }
    );
    res.status(201).json(createSuccessResponse('Message sent successfully', message));
  } catch (error) {
    if (error instanceof Error && error.message === 'You are not a member of this room') {
      res.status(403).json(createErrorResponse(error.message));
      return;
    }
    res.status(500).json(createErrorResponse('Failed to send message', error instanceof Error ? error.message : 'Unknown error'));
  }
};

export const getCountriesStats = async (req: Request, res: Response): Promise<void> => {
  try {
    const data = await roomService.getCountriesStats(prisma);
    res.json(createSuccessResponse('Countries retrieved successfully', data));
  } catch (error) {
    res.status(500).json(createErrorResponse('Failed to fetch countries', error instanceof Error ? error.message : 'Unknown error'));
  }
}; 