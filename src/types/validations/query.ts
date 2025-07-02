import { z } from 'zod';

// Base query schema with common pagination and search
const baseQuerySchema = z.object({
  page: z.preprocess(
    (val) => (val ? Number(val) : 1),
    z.number().min(1, 'Page must be at least 1')
  ),
  limit: z.preprocess(
    (val) => (val ? Number(val) : 20),
    z.number().min(1, 'Limit must be at least 1').max(100, 'Limit must be between 1 and 100')
  ),
  search: z.string().max(100).optional(),
  sortBy: z.enum(['createdAt', 'updatedAt', 'name', 'username']).optional(),
  sortOrder: z.enum(['asc', 'desc']).optional().default('desc')
});

// User query schema
export const UserQuerySchema = baseQuerySchema.extend({
  role: z.enum(['EXPLORER', 'ABROADER', 'EMIGRANT', 'LOCAL']).optional(),
  currentCountry: z.string().max(100).optional(),
  targetCountry: z.string().max(100).optional(),
  isOnline: z.string().optional().transform((val) => val === 'true' ? true : val === 'false' ? false : undefined)
});

// Post query schema
export const PostQuerySchema = baseQuerySchema.extend({
  category: z.enum(['REVIEW', 'GUIDE', 'EXPERIENCE', 'QUESTION', 'DISCUSSION', 'TIP']).optional(),
  tags: z.array(z.string()).or(z.string().transform(str => [str])).optional(),
  authorId: z.string().uuid('Invalid author ID').optional(),
  cityId: z.string().uuid('Invalid city ID').optional(),
  userId: z.string().uuid('Invalid user ID').optional()
});

// Room query schema
export const RoomQuerySchema = baseQuerySchema.extend({
  type: z.enum(['COUNTRY', 'STUDY', 'INTERVIEW', 'LANGUAGE', 'GENERAL']).optional(),
  country: z.string().max(100).optional(),
  isPublic: z.string().optional().transform((val) => val === 'true' ? true : val === 'false' ? false : undefined)
});

// Message query schema
export const MessageQuerySchema = baseQuerySchema.extend({
  roomId: z.string().uuid('Invalid room ID').optional()
});

// Comment query schema  
export const CommentQuerySchema = baseQuerySchema.extend({
  postId: z.string().uuid('Invalid post ID').optional()
});

// City review query schema
export const CityReviewQuerySchema = baseQuerySchema.extend({
  cityId: z.string().uuid('Invalid city ID').optional(),
  userId: z.string().uuid('Invalid user ID').optional()
});

// Query Schemas
export const PaginationSchema = z.preprocess(
  (data: any) => ({
    page: data?.page,
    limit: data?.limit
  }),
  baseQuerySchema
);

// Infer types from query schemas
export type PostQuery = z.infer<typeof PostQuerySchema>;
export type RoomQuery = z.infer<typeof RoomQuerySchema>;
export type UserQuery = z.infer<typeof UserQuerySchema>;
export type PaginationQuery = z.infer<typeof PaginationSchema>; 