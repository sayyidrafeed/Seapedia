import { defineConfig } from '@hey-api/openapi-ts';

const apiUrl = (process.env.VITE_API_URL ?? 'http://localhost:8787').replace(/\/$/, '');

export default defineConfig({
  input: `${apiUrl}/openapi.json`,
  output: 'src/lib/api/generated',
  plugins: [
    '@hey-api/typescript',
    '@hey-api/sdk',
    {
      name: '@hey-api/client-fetch',
      runtimeConfigPath: '@/lib/api/hey-api',
    },
    'zod',
    {
      name: '@tanstack/react-query',
      queryOptions: true,
      mutationOptions: true,
    },
  ],
});
