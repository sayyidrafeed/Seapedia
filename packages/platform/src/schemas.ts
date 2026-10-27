import { z } from 'zod';

export const errorSchema = z
  .object({
    error: z.string(),
  })
  .meta({ id: 'Error' });

export const successSchema = z
  .object({
    success: z.literal(true),
  })
  .meta({ id: 'Success' });

export const paginationQuerySchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(20),
  search: z.string().trim().min(1).optional(),
  sortBy: z.string().optional(),
  order: z.enum(['asc', 'desc']).default('desc'),
});

export const customMsg = (required: string, invalidType: string) => ({
  error: (issue: { code: string; received?: string; input?: unknown }) => {
    const isRequired =
      issue.received === 'undefined' ||
      issue.input === undefined ||
      (issue.code === 'invalid_type' && issue.received === 'undefined');
    return { message: isRequired ? required : invalidType };
  },
});
