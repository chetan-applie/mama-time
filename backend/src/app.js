import fs from 'node:fs';
import path from 'node:path';
import express from 'express';
import helmet from 'helmet';
import compression from 'compression';
import cookieParser from 'cookie-parser';
import morgan from 'morgan';
import { config } from './config.js';
import { initDb, query } from './db.js';
import { publicRouter } from './routes/publicRoutes.js';
import { authRouter } from './routes/authRoutes.js';
import { adminRouter } from './routes/adminRoutes.js';
import { asyncHandler } from './utils/helpers.js';

export async function createApp() {
  await initDb();
  const app = express();
  if (config.trustProxy) app.set('trust proxy', config.trustProxy);
  app.disable('x-powered-by');

  app.use(helmet({
    contentSecurityPolicy: config.isProduction ? {
      directives: {
        defaultSrc: ["'self'"],
        imgSrc: ["'self'", 'data:', 'https:'],
        styleSrc: ["'self'", "'unsafe-inline'"],
        scriptSrc: ["'self'", 'https://connect.facebook.net'],
        connectSrc: ["'self'", 'https://connect.facebook.net', 'https://www.facebook.com'],
        fontSrc: ["'self'", 'data:'],
        objectSrc: ["'none'"],
        baseUri: ["'self'"],
        formAction: ["'self'"],
        frameAncestors: ["'none'"]
      }
    } : false,
    crossOriginResourcePolicy: { policy: 'same-site' }
  }));
  app.use(compression());
  app.use(cookieParser());
  app.use(express.json({ limit: '100kb' }));
  app.use(express.urlencoded({ extended: false, limit: '100kb' }));
  if (!config.isProduction) app.use(morgan('dev'));

  app.use('/api', (_req, res, next) => {
    res.setHeader('Cache-Control', 'no-store, max-age=0');
    next();
  });

  app.get('/api/health', asyncHandler(async (_req, res) => {
    await query('SELECT 1 AS healthy');
    res.json({
      ok: true,
      service: 'mama-time-api',
      version: config.version,
      environment: config.env,
      storage: config.database.useMemory ? 'pg-mem-test' : 'postgresql',
      time: new Date().toISOString()
    });
  }));
  app.use('/api/public', publicRouter);
  app.use('/api/admin/auth', authRouter);
  app.use('/api/admin', adminRouter);

  app.use('/api', (_req, res) => {
    res.status(404).json({ ok: false, message: 'API endpoint not found.' });
  });

  if (fs.existsSync(config.frontendDist)) {
    app.use(express.static(config.frontendDist, {
      index: false,
      maxAge: config.isProduction ? '7d' : 0,
      setHeaders(res, filePath) {
        if (filePath.endsWith('index.html')) res.setHeader('Cache-Control', 'no-cache');
      }
    }));
    app.get('*', (_req, res) => {
      res.setHeader('Cache-Control', 'no-cache');
      res.sendFile(path.join(config.frontendDist, 'index.html'));
    });
  } else {
    app.get('/', (_req, res) => {
      res.status(503).send('Frontend not built. Run `npm run build` or use the Vite development server.');
    });
  }

  app.use((error, req, res, _next) => {
    console.error('[MAMA TIME] Unhandled error:', error);
    if (res.headersSent) return;
    const message = config.isProduction ? 'Ein unerwarteter Fehler ist aufgetreten.' : error.message;
    res.status(error.status || 500).json({ ok: false, message, requestPath: req.path });
  });

  return app;
}
