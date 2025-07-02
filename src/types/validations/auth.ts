import { z } from 'zod';
import { sanitizeUsername, sanitizeText, sanitizeUrl } from '../../utils/sanitize';

// Authentication Schemas
export const RegisterSchema = z.object({
  username: z.string()
    .min(2, 'Username must be at least 2 characters')
    .max(50, 'Username must be less than 50 characters')
    .transform(sanitizeUsername),
  email: z.string().email('Invalid email format').toLowerCase(),
  password: z.string()
    .min(8, 'Password must be at least 8 characters')
    .max(128, 'Password too long')
    .regex(
      /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]/,
      'Password must contain at least one uppercase letter, one lowercase letter, one number, and one special character (@$!%*?&)'
    ),
  role: z.enum(['EXPLORER', 'ABROADER'])
}).transform(data => ({
  ...data,
  role: data.role || 'EXPLORER' as const
}));

export const LoginSchema = z.object({
  email: z.string().email('Invalid email format'),
  password: z.string().min(1, 'Password is required')
});

export const UpdateProfileSchema = z.object({
  username: z.string()
    .min(2, 'Username must be at least 2 characters')
    .max(50)
    .transform(sanitizeUsername)
    .optional(),
  currentCity: z.string()
    .max(100)
    .transform(sanitizeText)
    .optional(),
  currentCountry: z.string()
    .max(100)
    .transform(sanitizeText)
    .optional(),
  targetCountry: z.string()
    .max(100)
    .transform(sanitizeText)
    .optional(),
  techStack: z.preprocess((val) => {
    if (typeof val === 'string') {
      try {
        return JSON.parse(val);
      } catch {
        return val;
      }
    }
    return val;
  }, z.array(z.string().transform(sanitizeText))).optional(),
  bio: z.string()
    .max(500, 'Bio must be less than 500 characters')
    .transform(sanitizeText)
    .optional(),
  avatar: z.string()
    .url('Invalid URL format')
    .transform(sanitizeUrl)
    .optional()
});

// Infer types from auth schemas
export type RegisterDto = z.infer<typeof RegisterSchema>;
export type LoginDto = z.infer<typeof LoginSchema>;
export type UpdateUserDto = z.infer<typeof UpdateProfileSchema>; 