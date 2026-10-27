import { createRuntime } from '@seapedia/platform/runtime';
import { env } from './env';

export const runtime = createRuntime('identity', env);
