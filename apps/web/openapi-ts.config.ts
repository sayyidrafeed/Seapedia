import { defineConfig } from '@hey-api/openapi-ts';

export default defineConfig({
  // Merged public contract produced by `bun scripts/openapi.ts` from the running services.
  input: './public/openapi.json',
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
