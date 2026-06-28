import { z } from 'zod';

const objectIdSchema = z
  .string()
  .trim()
  .regex(/^[0-9a-fA-F]{24}$/, 'Invalid image id');

export const uploadImageZodSchema = z.object({
  body: z.object({
    alt: z.string().optional().default(''),
  }),
});

export const imageIdParamsZodSchema = z.object({
  params: z.object({
    id: objectIdSchema,
  }),
});

export const listImagesQueryZodSchema = z.object({
  query: z.object({
    page: z.coerce.number().int().min(1).optional().default(1),
    limit: z.coerce.number().int().min(1).max(100).optional().default(20),
  }),
});

export const updateImageZodSchema = z.object({
  params: z.object({
    id: objectIdSchema,
  }),
  body: z.object({
    alt: z.string().optional().default(''),
  }),
});
