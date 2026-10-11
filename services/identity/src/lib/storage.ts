import { createStorage } from '@seapedia/platform/storage';
import { env } from '@/env';

export const StorageService = createStorage(env);
