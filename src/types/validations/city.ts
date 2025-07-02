import { z } from 'zod';

// -----------------------------
// Base schema (all fields required)
// -----------------------------

const CityReviewBaseSchema = z.object({
  cityName: z.string().min(2, 'City name must be at least 2 characters').max(100),
  country: z.string().min(2, 'Country must be at least 2 characters').max(100),
  title: z.string().max(100, 'Title too long').nullish(),
  jobOpportunities: z.number().int().min(1).max(5),
  costOfLiving: z.number().int().min(1).max(5),
  safety: z.number().int().min(1).max(5),
  transport: z.number().int().min(1).max(5),
  community: z.number().int().min(1).max(5),
  healthcare: z.number().int().min(1).max(5).nullish(),
  education: z.number().int().min(1).max(5).nullish(),
  nightlife: z.number().int().min(1).max(5).nullish(),
  weather: z.number().int().min(1).max(5).nullish(),
  internet: z.number().int().min(1).max(5).nullish(),
  pros: z.array(z.string()).optional(),
  cons: z.array(z.string()).optional(),
  note: z.string().max(500, 'Note too long').nullish(),
  images: z.array(z.string()).optional(),
  language: z.string().max(10).nullish(),
});

// -----------------------------
// Full schema with transform (for create)
// -----------------------------

export const CityReviewSchema = CityReviewBaseSchema.transform(data => ({
  ...data,
  note: data.note || null,
  title: data.title || null,
  healthcare: data.healthcare ?? null,
  education: data.education ?? null,
  nightlife: data.nightlife ?? null,
  weather: data.weather ?? null,
  internet: data.internet ?? null,
  language: data.language || null,
  pros: data.pros || [],
  cons: data.cons || [],
  images: data.images || [],
}));

// -----------------------------
// Partial schema (for update) – no transform needed
// -----------------------------

export const CityReviewUpdateSchema = CityReviewBaseSchema.partial();

// Infer types from city schemas
export type CityReviewDto = z.infer<typeof CityReviewSchema>;
export type CityReviewUpdateDto = z.infer<typeof CityReviewUpdateSchema>;
 