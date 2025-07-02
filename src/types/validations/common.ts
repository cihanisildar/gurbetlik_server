import { z } from 'zod';

// Common validation schemas
export const IdSchema = z.object({
  id: z.string().uuid('Invalid UUID format')
});

// PaginationSchema moved to query.ts to avoid duplication

// Parameter Schemas
export const IdParamSchema = z.preprocess(
  (data: any) => ({ id: data?.id }),
  z.object({
    id: z.string().transform((val: string) => parseInt(val)).refine((val: number) => !isNaN(val) && val > 0, 'Invalid ID')
  })
);

// Validation utility functions
export const validateRequest = <T>(schema: z.ZodSchema<T>, data: unknown): { success: true; data: T } | { success: false; error: string } => {
  try {
    const validatedData = schema.parse(data);
    return { success: true, data: validatedData };
  } catch (error) {
    if (error instanceof z.ZodError) {
      const errorMessage = error.errors.map((err: any) => `${err.path.join('.')}: ${err.message}`).join(', ');
      return { success: false, error: errorMessage };
    }
    return { success: false, error: 'Validation failed' };
  }
};

export const validateParams = <T>(schema: z.ZodSchema<T>, params: unknown): { success: true; data: T } | { success: false; error: string } => {
  return validateRequest(schema, params);
};

export const validateQuery = (schema: z.ZodTypeAny, query: unknown): { success: true; data: any } | { success: false; error: string } => {
  return validateRequest(schema, query);
}; 