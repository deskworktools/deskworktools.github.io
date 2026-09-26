import { Router, Request, Response } from 'express';
import { authService } from '../auth/auth.service.js';
import {
  SESSION_COOKIE_NAME,
  getSessionCookieOptions,
  requireAdminAuth,
} from '../auth/auth.middleware.js';
import { ActivityLogRepository } from '../data/repository.js';

export const authRouter = Router();
const activityRepo = new ActivityLogRepository();

/**
 * POST /api/admin/auth/login
 * Validates password with scrypt comparison, checks brute-force rate limiter.
 */
authRouter.post('/login', async (req: Request, res: Response): Promise<void> => {
  const clientIp =
    (req.headers['x-forwarded-for'] as string)?.split(',')[0].trim() ||
    req.socket.remoteAddress ||
    '127.0.0.1';
  const ipKey = authService.hashClientIp(clientIp);

  // Check rate limit
  const rateLimitStatus = await authService.getRateLimiter().isBlocked(ipKey);
  if (rateLimitStatus.blocked) {
    res.status(429).json({
      error: `Too many failed login attempts. Please try again in ${rateLimitStatus.remainingSeconds} seconds.`,
      code: 'RATE_LIMITED',
      retryAfter: rateLimitStatus.remainingSeconds,
    });
    return;
  }

  const { password } = req.body || {};
  if (!password || typeof password !== 'string') {
    res.status(400).json({ error: 'Password required' });
    return;
  }

  const isValid = authService.verifyPassword(password);
  if (!isValid) {
    const failureRecord = await authService.getRateLimiter().recordFailure(ipKey);
    await activityRepo.log('AUTH_FAILED', `Failed admin login attempt from ${ipKey}`, ipKey);

    if (failureRecord.blocked) {
      res.status(429).json({
        error: `Too many failed attempts. Account locked for 15 minutes.`,
        code: 'RATE_LIMITED',
        retryAfter: failureRecord.remainingSeconds,
      });
      return;
    }

    res.status(401).json({
      error: 'Invalid password. Please verify your admin credentials.',
      code: 'INVALID_CREDENTIALS',
      attemptsRemaining: Math.max(0, 5 - failureRecord.count),
    });
    return;
  }

  // Success
  await authService.getRateLimiter().recordSuccess(ipKey);
  const session = await authService.getSessionStore().createSession(
    ipKey,
    req.headers['user-agent'] as string,
  );

  const cookieOptions = getSessionCookieOptions(req);
  res.cookie(SESSION_COOKIE_NAME, session.sessionId, cookieOptions);

  await activityRepo.log('AUTH_SUCCESS', `Admin authenticated successfully`, ipKey);

  res.json({
    success: true,
    message: 'Authenticated successfully',
    session: {
      createdAt: session.createdAt,
      expiresAt: session.expiresAt,
    },
  });
});

/**
 * POST /api/admin/auth/logout
 * Invalidates session and clears cookie.
 */
authRouter.post('/logout', async (req: Request, res: Response): Promise<void> => {
  const sid = req.cookies?.[SESSION_COOKIE_NAME];
  if (sid) {
    await authService.getSessionStore().deleteSession(sid);
  }
  res.clearCookie(SESSION_COOKIE_NAME, { path: '/' });
  await activityRepo.log('AUTH_LOGOUT', `Admin logged out`);
  res.json({ success: true, message: 'Logged out successfully' });
});

/**
 * GET /api/admin/auth/me
 * Checks session validity and returns session metadata.
 */
authRouter.get('/me', requireAdminAuth, (req: Request, res: Response): void => {
  res.json({
    authenticated: true,
    session: {
      createdAt: req.adminSession?.createdAt,
      expiresAt: req.adminSession?.expiresAt,
    },
  });
});
