import express from 'express';
import path from 'path';
import fs from 'fs';
import cookieParser from 'cookie-parser';
import { createServer as createViteServer } from 'vite';
import { authRouter } from './server/routes/auth.routes.js';
import { adminRouter } from './server/routes/admin.routes.js';
import { blogRouter } from './server/routes/blog.routes.js';
import { mediaRouter } from './server/routes/media.routes.js';
import { analyticsPublicRouter } from './server/routes/analytics.routes.js';
import { adsPublicRouter, adsAdminRouter } from './server/routes/ads.routes.js';

async function startServer() {
  const app = express();
  const PORT = 3000;

  // Basic Middlewares
  app.use(express.json());
  app.use(express.urlencoded({ extended: true }));
  app.use(cookieParser());

  // Serve uploads statically
  const uploadsStaticDir = path.resolve(process.cwd(), 'public', 'uploads');
  if (!fs.existsSync(uploadsStaticDir)) {
    fs.mkdirSync(uploadsStaticDir, { recursive: true });
  }
  app.use('/uploads', express.static(uploadsStaticDir));

  // API Routes (mounted BEFORE Vite/static handlers)
  app.use('/api/analytics', analyticsPublicRouter);
  app.use('/api/ads', adsPublicRouter);
  app.use('/api/admin/auth', authRouter);
  app.use('/api/admin/blog', blogRouter);
  app.use('/api/admin/media', mediaRouter);
  app.use('/api/admin/ads', adsAdminRouter);
  app.use('/api/admin', adminRouter);

  // Health check endpoint
  app.get('/api/health', (_req, res) => {
    res.json({ status: 'ok', time: new Date().toISOString() });
  });

  const isProduction = process.env.NODE_ENV === 'production';

  if (!isProduction) {
    // Development mode with Vite Middleware
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'custom',
    });

    // Dedicated handler for /admin and /admin/* routes
    app.get(['/admin', '/admin/*'], async (req, res, next) => {
      try {
        const adminHtmlPath = path.resolve(process.cwd(), 'admin', 'index.html');
        if (fs.existsSync(adminHtmlPath)) {
          const rawHtml = await fs.promises.readFile(adminHtmlPath, 'utf-8');
          const transformedHtml = await vite.transformIndexHtml(req.originalUrl, rawHtml);
          res.status(200).set({ 'Content-Type': 'text/html' }).end(transformedHtml);
          return;
        }
        next();
      } catch (err) {
        vite.ssrFixStacktrace(err as Error);
        next(err);
      }
    });

    // Vite handles all static files, HMR, assets, and fallback
    app.use(vite.middlewares);

    // Fallback for HTML documents in dev
    app.get('*', async (req, res, next) => {
      try {
        const url = req.originalUrl.split('?')[0];
        let targetFile = path.resolve(process.cwd(), url.replace(/^\//, ''));
        if (url === '/' || url === '') {
          targetFile = path.resolve(process.cwd(), 'index.html');
        } else if (fs.existsSync(targetFile) && fs.statSync(targetFile).isDirectory()) {
          targetFile = path.join(targetFile, 'index.html');
        }

        if (fs.existsSync(targetFile) && targetFile.endsWith('.html')) {
          const rawHtml = await fs.promises.readFile(targetFile, 'utf-8');
          const transformed = await vite.transformIndexHtml(req.originalUrl, rawHtml);
          res.status(200).set({ 'Content-Type': 'text/html' }).end(transformed);
          return;
        }

        // Return custom 404 page with HTTP 404 status
        const notFoundFile = path.resolve(process.cwd(), '404.html');
        if (fs.existsSync(notFoundFile)) {
          const rawHtml = await fs.promises.readFile(notFoundFile, 'utf-8');
          const transformed = await vite.transformIndexHtml(req.originalUrl, rawHtml);
          res.status(404).set({ 'Content-Type': 'text/html' }).end(transformed);
          return;
        }

        res.status(404).send('Page Not Found');
      } catch (err) {
        next(err);
      }
    });
  } else {
    // Production mode: Serve compiled assets from dist/
    const distPath = path.resolve(process.cwd(), 'dist');
    app.use(express.static(distPath));

    // Admin SPA fallback
    app.get(['/admin', '/admin/*'], (_req, res) => {
      const adminFile = path.resolve(distPath, 'admin', 'index.html');
      if (fs.existsSync(adminFile)) {
        res.sendFile(adminFile);
      } else {
        res.sendFile(path.resolve(distPath, 'index.html'));
      }
    });

    // Fallback for static HTML and custom 404
    app.get('*', (req, res) => {
      const url = req.originalUrl.split('?')[0];
      let targetFile = path.resolve(process.cwd(), url.replace(/^\//, ''));
      if (url === '/' || url === '') {
        targetFile = path.resolve(distPath, 'index.html');
      } else if (fs.existsSync(targetFile) && fs.statSync(targetFile).isDirectory()) {
        targetFile = path.join(targetFile, 'index.html');
      }

      if (fs.existsSync(targetFile) && targetFile.endsWith('.html')) {
        res.status(200).sendFile(targetFile);
        return;
      }

      const notFoundFile = fs.existsSync(path.resolve(distPath, '404.html'))
        ? path.resolve(distPath, '404.html')
        : path.resolve(process.cwd(), '404.html');

      if (fs.existsSync(notFoundFile)) {
        res.status(404).sendFile(notFoundFile);
      } else {
        res.status(404).sendFile(path.resolve(distPath, 'index.html'));
      }
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`[Deskwork Server] Running on http://0.0.0.0:${PORT} (${isProduction ? 'production' : 'development'})`);
  });
}

startServer().catch((err) => {
  console.error('[Deskwork Server] Fatal startup failure:', err);
  process.exit(1);
});
