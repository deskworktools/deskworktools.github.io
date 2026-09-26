import crypto from 'crypto';

export interface AdminSession {
  sessionId: string;
  createdAt: number;
  expiresAt: number;
  ipHash?: string;
  userAgent?: string;
}

export interface RateLimitStatus {
  blocked: boolean;
  remainingSeconds?: number;
  count?: number;
}

export interface FailureRecord {
  count: number;
  lastAttempt?: number;
  blocked: boolean;
  remainingSeconds?: number;
}

export interface IRateLimiter {
  isBlocked(ipKey: string): Promise<RateLimitStatus> | RateLimitStatus;
  recordFailure(ipKey: string): Promise<FailureRecord> | FailureRecord;
  recordSuccess(ipKey: string): Promise<void> | void;
}

/**
 * ISessionStore: Boundary for administrative session persistence.
 */
export interface ISessionStore {
  createSession(ipHash?: string, userAgent?: string): Promise<AdminSession>;
  getSession(sessionId: string): Promise<AdminSession | null>;
  deleteSession(sessionId: string): Promise<void>;
  pruneExpired(): Promise<void>;
}

/**
 * MemorySessionStore
 *
 * Local in-memory session registry.
 * Used for development / test environments when STORAGE_DRIVER=json.
 */
export class MemorySessionStore implements ISessionStore {
  private sessions = new Map<string, AdminSession>();
  private readonly SESSION_DURATION_MS = 24 * 60 * 60 * 1000; // 24 hours

  async createSession(ipHash?: string, userAgent?: string): Promise<AdminSession> {
    const sessionId = crypto.randomBytes(32).toString('hex');
    const now = Date.now();
    const session: AdminSession = {
      sessionId,
      createdAt: now,
      expiresAt: now + this.SESSION_DURATION_MS,
      ipHash,
      userAgent,
    };
    this.sessions.set(sessionId, session);
    return session;
  }

  async getSession(sessionId: string): Promise<AdminSession | null> {
    const session = this.sessions.get(sessionId);
    if (!session) return null;
    if (Date.now() > session.expiresAt) {
      this.sessions.delete(sessionId);
      return null;
    }
    return session;
  }

  async deleteSession(sessionId: string): Promise<void> {
    this.sessions.delete(sessionId);
  }

  async pruneExpired(): Promise<void> {
    const now = Date.now();
    for (const [id, s] of this.sessions.entries()) {
      if (now > s.expiresAt) {
        this.sessions.delete(id);
      }
    }
  }
}

/**
 * LoginRateLimiter
 *
 * In-memory brute-force rate limiter for local development.
 * Adheres strictly to the 15-minute sliding failure window:
 * - Max 5 attempts
 * - 15-minute failure window
 * - 15-minute lockout
 * - Reset counter if lastAttempt is older than 15 minutes
 */
export class LoginRateLimiter implements IRateLimiter {
  private attempts = new Map<string, { count: number; blockedUntil: number; lastAttempt: number }>();
  private readonly MAX_ATTEMPTS = 5;
  private readonly WINDOW_MS = 15 * 60 * 1000; // 15 minutes window
  private readonly LOCKOUT_WINDOW_MS = 15 * 60 * 1000; // 15 minutes lockout

  isBlocked(ipKey: string): RateLimitStatus {
    const record = this.attempts.get(ipKey);
    if (!record) return { blocked: false };
    const now = Date.now();
    if (record.blockedUntil > now) {
      return {
        blocked: true,
        remainingSeconds: Math.ceil((record.blockedUntil - now) / 1000),
      };
    }
    if (record.blockedUntil <= now && record.count >= this.MAX_ATTEMPTS) {
      this.attempts.delete(ipKey);
    }
    return { blocked: false };
  }

  recordFailure(ipKey: string): FailureRecord {
    const now = Date.now();
    const record = this.attempts.get(ipKey) || { count: 0, blockedUntil: 0, lastAttempt: now };

    // Reset failure counter if last attempt is older than the 15-minute failure window
    if (now - record.lastAttempt > this.WINDOW_MS) {
      record.count = 0;
      record.blockedUntil = 0;
    }

    record.count += 1;
    record.lastAttempt = now;

    if (record.count >= this.MAX_ATTEMPTS) {
      record.blockedUntil = now + this.LOCKOUT_WINDOW_MS;
      this.attempts.set(ipKey, record);
      return {
        count: record.count,
        blocked: true,
        remainingSeconds: Math.ceil(this.LOCKOUT_WINDOW_MS / 1000),
      };
    }

    this.attempts.set(ipKey, record);
    return { count: record.count, blocked: false };
  }

  recordSuccess(ipKey: string): void {
    this.attempts.delete(ipKey);
  }
}

export class AuthService {
  private sessionStore: ISessionStore;
  private rateLimiter: IRateLimiter;
  private salt: string;
  private passwordHash: string;

  constructor(sessionStore?: ISessionStore, rateLimiter?: IRateLimiter) {
    // ADMIN_PASSWORD is required for local admin access
    const sourcePassword = process.env.ADMIN_PASSWORD?.trim();
    if (!sourcePassword) {
      throw new Error(
        '[AuthService] FATAL CONFIGURATION ERROR: The ADMIN_PASSWORD environment variable is required. Server startup aborted. Please configure ADMIN_PASSWORD in your environment configuration.',
      );
    }

    const rawSessionSecret = process.env.SESSION_SECRET?.trim();
    const secretSeed = rawSessionSecret || crypto.randomBytes(32).toString('hex');
    this.salt = crypto.createHash('sha256').update(secretSeed).digest('hex').substring(0, 32);
    this.passwordHash = this.hashPassword(sourcePassword);

    this.sessionStore = sessionStore || new MemorySessionStore();
    this.rateLimiter = rateLimiter || new LoginRateLimiter();
  }

  private hashPassword(password: string): string {
    return crypto.scryptSync(password, this.salt, 64).toString('hex');
  }

  verifyPassword(candidate: string): boolean {
    if (!candidate || typeof candidate !== 'string') return false;
    const candidateHash = this.hashPassword(candidate);
    const bufA = Buffer.from(this.passwordHash, 'hex');
    const bufB = Buffer.from(candidateHash, 'hex');
    if (bufA.length !== bufB.length) return false;
    return crypto.timingSafeEqual(bufA, bufB);
  }

  getSessionStore(): ISessionStore {
    return this.sessionStore;
  }

  getRateLimiter(): IRateLimiter {
    return this.rateLimiter;
  }

  hashClientIp(ip: string): string {
    const salt = this.salt;
    return crypto.createHash('sha256').update(`${ip}-${salt}`).digest('hex').substring(0, 16);
  }
}

export const authService = new AuthService();
