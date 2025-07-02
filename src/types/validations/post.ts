import { z } from 'zod';
import { sanitizeText, sanitizeHtml } from '../../utils/sanitize';

// Post Schemas
export const PostSchema = z.object({
  title: z.string()
    .min(1, 'Title is required')
    .max(255, 'Title too long')
    .transform(sanitizeText),
  content: z.string()
    .min(1, 'Content is required')
    .max(10000, 'Content too long')
    .transform(sanitizeHtml),
  category: z.enum(['REVIEW', 'GUIDE', 'EXPERIENCE', 'QUESTION', 'DISCUSSION', 'TIP']).default('DISCUSSION'),
  tags: z.array(z.enum(['JOB', 'VISA', 'CULTURE', 'REMOTE', 'STUDY', 'HOUSING', 'LANGUAGE', 'NETWORKING', 'INTERVIEW', 'SALARY'])).max(5, 'Maximum 5 tags allowed'),
  images: z.array(z.string().url()).max(10, 'Maximum 10 images allowed').optional(),
  cityId: z.string().min(1, 'City ID is required').optional()
});

export const UpdatePostSchema = z.object({
  title: z.string().min(1, 'Title is required').max(255, 'Title too long').optional(),
  content: z.string().min(1, 'Content is required').max(10000, 'Content too long').optional(),
  category: z.enum(['REVIEW', 'GUIDE', 'EXPERIENCE', 'QUESTION', 'DISCUSSION', 'TIP']).optional(),
  tags: z.array(z.enum(['JOB', 'VISA', 'CULTURE', 'REMOTE', 'STUDY', 'HOUSING', 'LANGUAGE', 'NETWORKING', 'INTERVIEW', 'SALARY'])).max(5, 'Maximum 5 tags allowed').optional(),
  images: z.array(z.string().url()).max(10, 'Maximum 10 images allowed').optional(),
  cityId: z.string().min(1, 'City ID is required').optional()
});

export const CommentSchema = z.object({
  content: z.string()
    .min(1, 'Content is required')
    .max(1000, 'Content too long')
    .transform(sanitizeHtml),
  parentCommentId: z.string().min(1, 'parentCommentId must be a valid string').optional()
});

export const UpdateCommentSchema = z.object({
  content: z.string()
    .min(1, 'Content is required')
    .max(1000, 'Content too long')
    .transform(sanitizeHtml)
    .optional()
});

// Infer types from post schemas
export type PostDto = z.infer<typeof PostSchema>;
export type UpdatePostDto = z.infer<typeof UpdatePostSchema>;
export type CommentDto = z.infer<typeof CommentSchema>;
export type UpdateCommentDto = z.infer<typeof UpdateCommentSchema>; 