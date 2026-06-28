import { z } from 'zod';

export const registerSchema = z
  .object({
    username: z.string().min(3).max(50),
    email: z.string().email(),
    password: z.string().min(8),
    name: z.string().optional(),
  })
  .meta({ id: 'RegisterInput' });

export const loginSchema = z
  .object({
    username: z.string().min(1),
    password: z.string().min(1),
  })
  .meta({ id: 'LoginInput' });

export const selectRoleSchema = z
  .object({
    role: z.enum(['admin', 'seller', 'buyer', 'driver']),
  })
  .meta({ id: 'SelectRoleInput' });

export const userResponseSchema = z
  .object({
    id: z.string(),
    username: z.string(),
    email: z.string(),
    name: z.string().nullable(),
    isOnboarded: z.boolean(),
    createdAt: z.string(),
  })
  .meta({ id: 'UserResponse' });

export const onboardSchema = z
  .object({
    roles: z.array(z.enum(['buyer', 'seller', 'driver'])),
  })
  .meta({ id: 'OnboardInput' });

export const sessionResponseSchema = z
  .object({
    userId: z.string(),
    activeRole: z.string(),
    roles: z.array(z.string()),
  })
  .meta({ id: 'SessionResponse' });
