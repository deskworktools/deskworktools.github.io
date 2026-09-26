import { Router, Request, Response } from 'express';
import express from 'express';
import { AnalyticsRepository } from '../data/repository.js';
import { AnalyticsEventType, AnalyticsIngestPayload } from '../data/types.js';

export const analyticsPublicRouter = Router();
const analyticsRepo = new AnalyticsRepository();

// In-memory rate limiting map: ip -> { count: number, resetTime: number }
interface RateLimitRecord {
  count: number;
  resetTime: number;
}
const rateLimitMap = new Map<string, RateLimitRecord>();
const RATE_LIMIT_WINDOW_MS = 60 * 1000; // 1 minute
const MAX_REQUESTS_PER_WINDOW = 60; // 60 events per minute per IP

// Periodic cleanup of rate limit map every 5 minutes
setInterval(() => {
  const now = Date.now();
  for (const [ip, record] of rateLimitMap.entries()) {
    if (now > record.resetTime) {
      rateLimitMap.delete(ip);
    }
  }
}, 5 * 60 * 1000).unref();

function checkRateLimit(ip: string): boolean {
  const now = Date.now();
  const record = rateLimitMap.get(ip);

  if (!record || now > record.resetTime) {
    rateLimitMap.set(ip, { count: 1, resetTime: now + RATE_LIMIT_WINDOW_MS });
    return true;
  }

  if (record.count >= MAX_REQUESTS_PER_WINDOW) {
    return false;
  }

  record.count += 1;
  return true;
}

const ALLOWED_EVENT_TYPES = new Set<AnalyticsEventType>([
  'page_view',
  'tool_opened',
  'tool_used',
  'blog_view',
  'export_completed',
]);

const ALLOWED_TOOLS = new Set<string>([
  'resume-builder',
  'japan-rirekisho',
  'letter-builder',
  'cover-letter-builder',
  'image-converter',
  'document-converter',
  'document-scanner',
  'gpa-calculator',
  'blog-writer',
  'pdf-merge',
]);

const ALLOWED_TEMPLATES = new Set<string>([
  'classic',
  'modern',
  'compact',
  'intl',
  'academic',
  'bd',
  'bd2',
  'sidebar',
  'europass',
  'gulf',
  'japan',
  'japan-rirekisho',
  'letter',
]);

/**
 * Strips URL query parameters, hash fragments, and restricts to safe path characters.
 */
function sanitizePath(rawPath?: any): string {
  if (typeof rawPath !== 'string') return '/';
  // Strip query strings and hashes
  let clean = rawPath.split('?')[0].split('#')[0].trim();
  if (!clean.startsWith('/')) {
    clean = '/' + clean;
  }
  // Remove any double slashes or dangerous characters
  clean = clean.replace(/\/+/g, '/').replace(/[^a-zA-Z0-9_\-\.\/]/g, '');
  if (clean.length > 100) {
    clean = clean.substring(0, 100);
  }
  return clean || '/';
}

/**
 * Sanitizes article slug to lowercase alphanumeric and dashes only.
 */
function sanitizeSlug(rawSlug?: any): string {
  if (typeof rawSlug !== 'string') return 'unknown-article';
  const clean = rawSlug.trim().toLowerCase().replace(/[^a-z0-9\-]/g, '');
  return clean.substring(0, 100) || 'unknown-article';
}

/**
 * POST /api/analytics/event
 * Public ingestion endpoint for anonymous telemetry.
 * Strictly limited payload size, rate-limited, allowlisted, normalized.
 */
analyticsPublicRouter.post(
  '/event',
  express.json({ limit: '1kb' }),
  async (req: Request, res: Response): Promise<void> => {
    try {
      // 1. Rate Limiting Check
      const clientIp =
        (req.headers['x-forwarded-for'] as string)?.split(',')[0].trim() ||
        req.socket.remoteAddress ||
        '127.0.0.1';

      if (!checkRateLimit(clientIp)) {
        res.status(429).json({ error: 'Rate limit exceeded. Try again in 1 minute.' });
        return;
      }

      // 2. Enforce 1KB Payload Size Limit
      const contentLength = req.headers['content-length'] ? parseInt(req.headers['content-length'], 10) : 0;
      if (contentLength > 1024) {
        res.status(413).json({ error: 'Payload too large. Telemetry events must be under 1KB.' });
        return;
      }

      // 3. Validate Body Structure
      const body = req.body;
      if (!body || typeof body !== 'object' || Array.isArray(body)) {
        res.status(400).json({ error: 'Invalid payload: JSON object expected.' });
        return;
      }

      if (JSON.stringify(body).length > 1024) {
        res.status(413).json({ error: 'Payload too large. Telemetry events must be under 1KB.' });
        return;
      }

      // 4. Strict Event Type Allowlist
      const eventType = body.type as AnalyticsEventType;
      if (!eventType || !ALLOWED_EVENT_TYPES.has(eventType)) {
        res.status(400).json({
          error: `Invalid event type. Allowed: ${Array.from(ALLOWED_EVENT_TYPES).join(', ')}`,
        });
        return;
      }

      // 4. Field Validation & Normalization (Disallows arbitrary data)
      const normalizedPayload: AnalyticsIngestPayload = {
        type: eventType,
      };

      if (eventType === 'page_view') {
        normalizedPayload.path = sanitizePath(body.path);
      } else if (eventType === 'tool_opened' || eventType === 'tool_used') {
        const rawTool = typeof body.tool === 'string' ? body.tool.toLowerCase().trim() : '';
        if (rawTool && ALLOWED_TOOLS.has(rawTool)) {
          normalizedPayload.tool = rawTool;
        } else {
          normalizedPayload.tool = 'resume-builder'; // Safe fallback for unrecognized tool
        }
      } else if (eventType === 'blog_view') {
        normalizedPayload.slug = sanitizeSlug(body.slug);
      } else if (eventType === 'export_completed') {
        const rawTemplate = typeof body.template === 'string' ? body.template.toLowerCase().trim() : '';
        if (rawTemplate && ALLOWED_TEMPLATES.has(rawTemplate)) {
          normalizedPayload.template = rawTemplate;
        } else {
          normalizedPayload.template = 'classic';
        }
      }

      // 5. Asynchronous persistence via AnalyticsRepository (No raw IP stored)
      await analyticsRepo.recordEvent(normalizedPayload, clientIp);

      // Return clean success
      res.status(200).json({ success: true });
    } catch (err: any) {
      console.error('Analytics ingestion error:', err);
      res.status(400).json({ error: 'Malformed telemetry payload.' });
    }
  },
);
