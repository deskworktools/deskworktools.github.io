import { Request, Response, NextFunction } from 'express';
import { authService, AdminSession } from './auth.service.js';

export const SESSION_COOKIE_NAME = 'dw_admin_sid';

// Extend Express Request to hold the verified admin session
declare global {
  namespace Express {
    interface Request {
      adminSession?: AdminSession;
    }
  }
}

export function getSessionCookieOptions(req: Request) {
  const isHttps =
    req.secure ||
    req.headers['x-forwarded-proto'] === 'https' ||
    process.env.NODE_ENV === 'production';

  return {
    httpOnly: true,
    secure: Boolean(isHttps),
    sameSite: 'lax' as const,
    path: '/',
    maxAge: 24 * 60 * 60 * 1000, // 24 hours
  };
}

export async function requireAdminAuth(req: Request, res: Response, next: NextFunction): Promise<void> {
  // Extract session ID from signed or unsigned cookie, or Authorization header
  const cookieSid = req.cookies?.[SESSION_COOKIE_NAME];
  let sid = cookieSid;

  if (!sid && req.headers.authorization) {
    const parts = req.headers.authorization.split(' ');
    if (parts.length === 2 && parts[0].toLowerCase() === 'bearer') {
      sid = parts[1];
    }
  }

  if (!sid) {
    res.status(401).json({
      error: 'Unauthorized: Admin session required',
      code: 'AUTH_REQUIRED',
    });
    return;
  }

  const session = await authService.getSessionStore().getSession(sid);
  if (!session) {
    // Clear stale cookie
    res.clearCookie(SESSION_COOKIE_NAME, { path: '/' });
    res.status(401).json({
      error: 'Unauthorized: Session expired or invalid',
      code: 'SESSION_INVALID',
    });
    return;
  }

  req.adminSession = session;
  next();
}
