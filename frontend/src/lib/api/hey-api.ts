import { env } from '@/config';
import type { Config, ClientOptions } from './generated/client';

export const createClientConfig = (defaultConfig: Config<ClientOptions>): Config<ClientOptions> => {
  return {
    ...defaultConfig,
    baseUrl: env.VITE_API_URL,
    credentials: 'include' as RequestCredentials,
  };
};
