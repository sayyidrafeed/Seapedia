import { factory } from '@/lib/factory';
import { describeRoute, validator } from 'hono-openapi';
import { jsonContent, errorResponses } from '@/lib/openapi';
import { z } from 'zod';
import { locationListSchema } from './locations.schemas';
import { LocationsProvider } from './locations.service';

export const locationsRouter = factory.createApp();

locationsRouter.get(
  '/provinces',
  describeRoute({
    operationId: 'getProvinces',
    tags: ['Locations'],
    summary: 'Get all provinces',
    responses: {
      200: jsonContent(locationListSchema, 'List of provinces'),
      ...errorResponses(500),
    },
  }),
  async (c) => {
    const provinces = await LocationsProvider.getProvinces();
    return c.json(provinces);
  },
);

locationsRouter.get(
  '/cities',
  describeRoute({
    operationId: 'getCities',
    tags: ['Locations'],
    summary: 'Get cities by province ID',
    responses: {
      200: jsonContent(locationListSchema, 'List of cities'),
      ...errorResponses(400, 500),
    },
  }),
  validator('query', z.object({ provinceId: z.string() })),
  async (c) => {
    const { provinceId } = c.req.valid('query');
    const cities = await LocationsProvider.getCities(provinceId);
    return c.json(cities);
  },
);

locationsRouter.get(
  '/districts',
  describeRoute({
    operationId: 'getDistricts',
    tags: ['Locations'],
    summary: 'Get districts by city ID',
    responses: {
      200: jsonContent(locationListSchema, 'List of districts'),
      ...errorResponses(400, 500),
    },
  }),
  validator('query', z.object({ cityId: z.string() })),
  async (c) => {
    const { cityId } = c.req.valid('query');
    const districts = await LocationsProvider.getDistricts(cityId);
    return c.json(districts);
  },
);
