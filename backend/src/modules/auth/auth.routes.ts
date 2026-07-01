import { factory } from '@/lib/factory';
import { describeRoute, validator } from 'hono-openapi';
import { setCookie, deleteCookie } from 'hono/cookie';
import { jsonContent, errorResponses } from '@/lib/openapi';
import { successSchema } from '@/lib/schemas';
import { requireSession } from '@/middleware/auth';
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
import { AuthService } from './auth.service';
import { signJwt } from '@/lib/jwt';
import { StorageService } from '@/lib/storage';

export const authRouter = factory.createApp();

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
    const { user, session } = await AuthService.register(body);

    const token = await signJwt({ userId: user.id, sessionId: session.id });
    setCookie(c, '__session', token, {
      httpOnly: true,
      path: '/',
      sameSite: 'Lax',
      secure: env.NODE_ENV === 'production',
      maxAge: 2 * 60 * 60, // 2 hours
    });

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
    const { user, session } = await AuthService.login(body);

    const token = await signJwt({ userId: user.id, sessionId: session.id });
    setCookie(c, '__session', token, {
      httpOnly: true,
      path: '/',
      sameSite: 'Lax',
      secure: env.NODE_ENV === 'production',
      maxAge: 2 * 60 * 60, // 2 hours
    });

    return c.json({ success: true as const });
  },
);

authRouter.post(
  '/logout',
  describeRoute({
    operationId: 'logoutUser',
    tags: ['Auth'],
    summary: 'Logout current user session',
    security: [{ cookieAuth: [] }],
    responses: {
      200: jsonContent(successSchema, 'Logout successful'),
      ...errorResponses(401, 500),
    },
  }),
  requireSession,
  async (c) => {
    const sessionId = c.get('sessionId')!;
    await AuthService.logout(sessionId);

    deleteCookie(c, '__session', {
      path: '/',
      httpOnly: true,
      sameSite: 'Lax',
      secure: env.NODE_ENV === 'production',
    });

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
    const { roles } = c.req.valid('json');

    await AuthService.onboard(userId, roles);

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

    await AuthService.selectRole(userId, sessionId, role);

    return c.json({ success: true as const });
  },
);
