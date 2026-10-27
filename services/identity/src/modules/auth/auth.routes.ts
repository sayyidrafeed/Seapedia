import { factory } from '@seapedia/platform/factory';
import { describeRoute, validator } from 'hono-openapi';
import type { Context } from 'hono';
import { getCookie, setCookie, deleteCookie } from 'hono/cookie';
import { ACCESS_COOKIE, REFRESH_COOKIE } from '@seapedia/platform/auth';
import { jsonContent, errorResponses } from '@seapedia/platform/openapi';
import { successSchema } from '@seapedia/platform/schemas';
import { requireSession } from '@seapedia/platform/auth';
import { env } from '@/env';
import {
  registerSchema,
  loginSchema,
  selectRoleSchema,
  userResponseSchema,
  onboardSchema,
  sessionResponseSchema,
  financialSummarySchema,
} from './auth.schemas';
import { AuthService, type IssuedTokens } from './auth.service';
import { StorageService } from '@/lib/storage';

export const authRouter = factory.createApp();

const secure = env.NODE_ENV === 'production';

// The access token goes everywhere; the refresh token only ever reaches /api/auth.
function setAuthCookies(c: Context, tokens: IssuedTokens) {
  setCookie(c, ACCESS_COOKIE, tokens.accessToken, {
    httpOnly: true,
    path: '/',
    sameSite: 'Lax',
    secure,
    maxAge: tokens.accessTtl,
  });
  if (tokens.refreshToken) {
    setCookie(c, REFRESH_COOKIE, tokens.refreshToken, {
      httpOnly: true,
      path: '/api/auth',
      sameSite: 'Lax',
      secure,
      maxAge: tokens.refreshTtl,
    });
  }
}

function clearAuthCookies(c: Context) {
  deleteCookie(c, ACCESS_COOKIE, { path: '/', httpOnly: true, sameSite: 'Lax', secure });
  deleteCookie(c, REFRESH_COOKIE, { path: '/api/auth', httpOnly: true, sameSite: 'Lax', secure });
}

authRouter.post(
  '/register',
  describeRoute({
    operationId: 'registerUser',
    tags: ['Auth'],
    summary: 'Register a new user account',
    responses: {
      201: jsonContent(successSchema, 'Registration successful'),
      ...errorResponses(400, 409, 500),
    },
  }),
  validator('json', registerSchema),
  async (c) => {
    const body = c.req.valid('json');
    const { tokens } = await AuthService.register(body);
    setAuthCookies(c, tokens);

    c.status(201);
    return c.json({ success: true as const });
  },
);

authRouter.post(
  '/login',
  describeRoute({
    operationId: 'loginUser',
    tags: ['Auth'],
    summary: 'Login to user account',
    responses: {
      200: jsonContent(successSchema, 'Login successful'),
      ...errorResponses(400, 500),
    },
  }),
  validator('json', loginSchema),
  async (c) => {
    const body = c.req.valid('json');
    const { tokens } = await AuthService.login(body);
    setAuthCookies(c, tokens);

    return c.json({ success: true as const });
  },
);

authRouter.post(
  '/refresh',
  describeRoute({
    operationId: 'refreshSession',
    tags: ['Auth'],
    summary: 'Rotate the refresh token and issue a new access token',
    responses: {
      200: jsonContent(successSchema, 'Tokens refreshed'),
      ...errorResponses(401, 500),
    },
  }),
  async (c) => {
    const presented = getCookie(c, REFRESH_COOKIE);
    if (!presented) {
      clearAuthCookies(c);
      return c.json({ error: 'Session expired' }, 401);
    }
    const result = await AuthService.refresh(presented);
    if (result.reused) {
      clearAuthCookies(c);
      return c.json({ error: 'Session revoked' }, 401);
    }
    setAuthCookies(c, result.tokens);
    return c.json({ success: true as const });
  },
);

authRouter.post(
  '/logout',
  describeRoute({
    operationId: 'logoutUser',
    tags: ['Auth'],
    summary: 'Logout current device session',
    responses: {
      200: jsonContent(successSchema, 'Logout successful'),
      ...errorResponses(500),
    },
  }),
  async (c) => {
    // Works with an expired access token too: the refresh cookie identifies the session.
    await AuthService.logout({
      sessionId: c.get('sessionId'),
      refreshToken: getCookie(c, REFRESH_COOKIE),
    });
    clearAuthCookies(c);
    return c.json({ success: true as const });
  },
);

authRouter.get(
  '/me',
  describeRoute({
    operationId: 'getCurrentUser',
    tags: ['Auth'],
    summary: 'Get details of currently authenticated user',
    security: [{ cookieAuth: [] }],
    responses: {
      200: jsonContent(userResponseSchema, 'Current user details'),
      ...errorResponses(401, 500),
    },
  }),
  requireSession,
  async (c) => {
    const userId = c.get('userId')!;
    const user = await AuthService.getUser(userId);

    return c.json({
      id: user.id,
      username: user.username,
      email: user.email,
      name: user.name,
      avatarKey: user.avatarKey,
      avatarUrl: user.avatarKey ? StorageService.getPublicUrl(user.avatarKey) : null,
      isOnboarded: user.isOnboarded,
      createdAt: user.createdAt.toISOString(),
    });
  },
);

authRouter.get(
  '/me/financial-summary',
  describeRoute({
    operationId: 'getCurrentUserFinancialSummary',
    tags: ['Auth'],
    summary: 'Get financial summary placeholder of currently authenticated user',
    security: [{ cookieAuth: [] }],
    responses: {
      200: jsonContent(financialSummarySchema, 'Current user financial summary'),
      ...errorResponses(401, 500),
    },
  }),
  requireSession,
  async (c) => {
    const userId = c.get('userId')!;
    const summary = await AuthService.getFinancialSummary(userId);
    return c.json(summary);
  },
);

authRouter.post(
  '/onboard',
  describeRoute({
    operationId: 'onboardUser',
    tags: ['Auth'],
    summary: 'Onboard a new user with selected roles',
    security: [{ cookieAuth: [] }],
    responses: {
      200: jsonContent(successSchema, 'Onboarding successful'),
      ...errorResponses(400, 401, 500),
    },
  }),
  requireSession,
  validator('json', onboardSchema),
  async (c) => {
    const userId = c.get('userId')!;
    const sessionId = c.get('sessionId')!;
    const { roles } = c.req.valid('json');

    setAuthCookies(c, await AuthService.onboard(userId, sessionId, roles));

    return c.json({ success: true as const });
  },
);

authRouter.get(
  '/session',
  describeRoute({
    operationId: 'getCurrentSession',
    tags: ['Auth'],
    summary: 'Get status and roles of current session',
    security: [{ cookieAuth: [] }],
    responses: {
      200: jsonContent(sessionResponseSchema, 'Current session information'),
      ...errorResponses(401, 500),
    },
  }),
  requireSession,
  async (c) => {
    const userId = c.get('userId')!;
    const sessionId = c.get('sessionId')!;
    const info = await AuthService.getSessionInfo(userId, sessionId);

    return c.json(info);
  },
);

authRouter.post(
  '/select-role',
  describeRoute({
    operationId: 'selectActiveRole',
    tags: ['Auth'],
    summary: 'Switch current active role in session',
    security: [{ cookieAuth: [] }],
    responses: {
      200: jsonContent(successSchema, 'Role updated successfully'),
      ...errorResponses(400, 401, 403, 500),
    },
  }),
  requireSession,
  validator('json', selectRoleSchema),
  async (c) => {
    const userId = c.get('userId')!;
    const sessionId = c.get('sessionId')!;
    const { role } = c.req.valid('json');

    setAuthCookies(c, await AuthService.selectRole(userId, sessionId, role));

    return c.json({ success: true as const });
  },
);
