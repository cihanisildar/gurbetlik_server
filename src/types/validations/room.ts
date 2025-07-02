import { z } from 'zod';

// Room Schemas
export const RoomSchema = z.object({
  name: z.string().min(3, 'Room name must be at least 3 characters').max(100, 'Room name too long'),
  description: z.string().max(500, 'Description too long').optional(),
  type: z.enum(['COUNTRY', 'STUDY', 'INTERVIEW', 'LANGUAGE', 'GENERAL']),
  country: z.string().max(100).optional(),
  isPublic: z.boolean().optional(),
  maxMembers: z.number().int().min(2).max(1000).optional()
}).transform(data => ({
  ...data,
  isPublic: data.isPublic ?? true,
  maxMembers: data.maxMembers ?? 100
}));

// Infer types from room schemas
export type RoomDto = z.infer<typeof RoomSchema>; 