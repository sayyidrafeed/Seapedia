import { env } from '@/config';
import { client } from './generated/client.gen';

// Access tokens live 10 minutes. On a 401 the client rotates the refresh token once (shared by
// concurrent requests) and replays the original request. Only the credential endpoints are never
// retried; account reads such as /api/auth/me must refresh, or a reload would sign the user out.
const CREDENTIAL_PATHS = new Set([
  '/api/auth/login',
  '/api/auth/register',
  '/api/auth/refresh',
  '/api/auth/logout',
]);
const replayable = new WeakMap<Request, Request>();
let refreshing: Promise<boolean> | null = null;

function refreshSession() {
  refreshing ??= fetch(`${env.VITE_API_URL}/api/auth/refresh`, {
    method: 'POST',
    credentials: 'include',
  })
    .then((res) => res.ok)
    .catch(() => false)
    .finally(() => {
      refreshing = null;
    });
  return refreshing;
}

client.interceptors.request.use((request) => {
  replayable.set(request, request.clone());
  return request;
});

client.interceptors.response.use(async (response, request) => {
  if (response.status !== 401 || CREDENTIAL_PATHS.has(new URL(request.url).pathname))
    return response;
  const replay = replayable.get(request);
  if (!replay || !(await refreshSession())) return response;
  return fetch(replay);
});
