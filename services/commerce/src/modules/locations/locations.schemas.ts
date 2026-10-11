import { z } from 'zod';

export const locationItemSchema = z
  .object({
    id: z.string(),
    name: z.string(),
  })
  .meta({ id: 'LocationItem' });

export const locationListSchema = z.array(locationItemSchema).meta({ id: 'LocationList' });
