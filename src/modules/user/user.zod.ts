import { z } from 'zod';

export const createUserZodSchema = z.object({
  body: z.object({
    name: z.string().trim().min(1).optional(),
    age: z.number().int().min(0).optional(),
    phone: z.string().trim().optional(),
    email: z.string().trim().email(),
    password: z.string().min(6),
  }),
});

export const verifyOtpZodSchema = z.object({
  body: z.object({
    email: z.string().trim().email(),
    otp: z.string().trim().min(4),
  }),
});
