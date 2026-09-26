import { Router, Request, Response } from 'express';
import { requireAdminAuth } from '../auth/auth.middleware.js';
import {
  OverviewRepository,
  ActivityLogRepository,
  AnalyticsRepository,
  defaultStorageDriver,
} from '../data/repository.js';

export const adminRouter = Router();

// Protect ALL routes under /api/admin/* (except /api/admin/auth/login handled in authRouter)
adminRouter.use(requireAdminAuth);

const overviewRepo = new OverviewRepository();
const activityRepo = new ActivityLogRepository();
const analyticsRepo = new AnalyticsRepository();

/**
 * GET /api/admin/overview
 * Real data summary: post counts, active ads, storage driver, and real analytics state.
 */
adminRouter.get('/overview', async (_req: Request, res: Response): Promise<void> => {
  try {
    const overview = await overviewRepo.getOverview();
    res.json(overview);
  } catch (err) {
    console.error('Failed to get dashboard overview:', err);
    res.status(500).json({ error: 'Failed to retrieve overview statistics' });
  }
});

/**
 * GET /api/admin/analytics/report
 * Returns aggregated anonymous analytics report for admin viewing.
 */
adminRouter.get('/analytics/report', async (req: Request, res: Response): Promise<void> => {
  try {
    let rangeDays = parseInt(req.query.range as string, 10);
    if (isNaN(rangeDays) || rangeDays < 1) {
      rangeDays = 7;
    } else if (rangeDays > 90) {
      rangeDays = 90;
    }

    const report = await analyticsRepo.getReport(rangeDays);
    res.json(report);
  } catch (err) {
    console.error('Failed to get analytics report:', err);
    res.status(500).json({ error: 'Failed to retrieve analytics report' });
  }
});

/**
 * DELETE /api/admin/analytics/reset
 * Resets visitor analytics telemetry and records an administrative audit log.
 */
adminRouter.delete('/analytics/reset', async (req: Request, res: Response): Promise<void> => {
  try {
    await analyticsRepo.reset();
    await activityRepo.log(
      'analytics_reset',
      'Admin purged anonymous visitor telemetry data',
    );
    res.json({ success: true, message: 'Analytics telemetry reset successfully.' });
  } catch (err) {
    console.error('Failed to reset analytics:', err);
    res.status(500).json({ error: 'Failed to reset analytics data' });
  }
});

/**
 * GET /api/admin/activity
 * Recent activity logs (admin audit only).
 */
adminRouter.get('/activity', async (_req: Request, res: Response): Promise<void> => {
  try {
    const logs = await activityRepo.getAll();
    res.json(logs);
  } catch (err) {
    console.error('Failed to get activity logs:', err);
    res.status(500).json({ error: 'Failed to retrieve activity logs' });
  }
});

/**
 * GET /api/admin/system
 * Server runtime information and storage driver status.
 */
adminRouter.get('/system', async (_req: Request, res: Response): Promise<void> => {
  res.json({
    nodeVersion: process.version,
    platform: process.platform,
    uptimeSeconds: Math.floor(process.uptime()),
    environment: process.env.NODE_ENV || 'development',
    storageDriver: defaultStorageDriver.getDriverName(),
    storagePersistenceNote:
      'Cloud Run filesystem storage is ephemeral across container replacement. The repository abstraction allows seamless upgrade to SQLite, PostgreSQL, or Firestore when persistent cloud DB is required.',
  });
});
