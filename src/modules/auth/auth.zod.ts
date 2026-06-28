import { z } from 'zod';

export const loginZodSchema = z.object({
  body: z.object({
    email: z.string().trim().email(),
    password: z.string().min(6),
  }),
});

export const socialSyncZodSchema = z.object({
  body: z
    .object({
      email: z.string().trim().email(),
      name: z.string().trim().min(1, 'Name is required'),
      avatar: z.string().url().optional(),
      provider: z.enum(['google', 'github']),
      googleId: z.string().trim().optional(),
      githubId: z.string().trim().optional(),
    })
    .superRefine((data, ctx) => {
      if (data.provider === 'google' && !data.googleId) {
        ctx.addIssue({
          code: 'custom',
          message: 'googleId is required for Google login',
          path: ['googleId'],
        });
      }

      if (data.provider === 'github' && !data.githubId) {
        ctx.addIssue({
          code: 'custom',
          message: 'githubId is required for GitHub login',
          path: ['githubId'],
        });
      }
    }),
});

export const forgotPasswordZodSchema = z.object({
  body: z.object({
    email: z.string().trim().email(),
  }),
});

export const resetPasswordZodSchema = z.object({
  body: z.object({
    email: z.string().trim().email(),
    otp: z.string().trim().min(4),
    newPassword: z.string().min(6),
  }),
});
