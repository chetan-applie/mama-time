import fs from 'node:fs';
import path from 'node:path';
import express from 'express';
import helmet from 'helmet';
import compression from 'compression';
import cookieParser from 'cookie-parser';
import morgan from 'morgan';
import { config } from './config.js';
import { getDb } from './db.js';
import { publicRouter } from './routes/publicRoutes.js';
import { authRouter } from './routes/authRoutes.js';
import { adminRouter } from './routes/adminRoutes.js';

export function createApp() {
  getDb();
  const app = express();
  if (config.trustProxy) app.set('trust proxy', config.trustProxy);
  app.disable('x-powered-by');

  app.use(helmet({
    contentSecurityPolicy: config.isProduction ? {
      directives: {
        defaultSrc: ["'self'"],
        imgSrc: ["'self'", 'data:', 'https:'],
        styleSrc: ["'self'", "'unsafe-inline'"],
        scriptSrc: ["'self'"],
        connectSrc: ["'self'"],
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

  app.get('/api/health', (_req, res) => {
    res.json({ ok: true, service: 'mama-time-api', version: config.version, environment: config.env, storage: 'atomic-json-file', time: new Date().toISOString() });
  });
  app.get('/api/diagnose', (_req, res) => {
    const store = getDb();
    res.json({
      env: {
        VERCEL: process.env.VERCEL || 'not set',
        VERCEL_URL: process.env.VERCEL_URL || 'not set',
        NODE_ENV: process.env.NODE_ENV || 'not set',
        databasePath: config.databasePath,
      },
      configBootstrap: {
        email: config.auth.bootstrapEmail,
        passwordLength: config.auth.bootstrapPassword ? config.auth.bootstrapPassword.length : 0,
        isDefaultPassword: config.auth.bootstrapPassword === 'VercelChangeMe-Now-2026!',
        isRandomPassword: config.auth.bootstrapPassword && config.auth.bootstrapPassword.startsWith('MT-'),
      },
      dbAdmins: store.admins.map(admin => ({
        id: admin.id,
        email: admin.email,
        active: admin.active,
        has_password_hash: !!admin.password_hash
      }))
    });
  });
  app.use('/api/public', publicRouter);
  app.use('/api/admin/auth', authRouter);
  app.use('/api/admin', adminRouter);

  app.use('/api', (_req, res) => res.status(404).json({ ok: false, message: 'API endpoint not found.' }));

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
    app.get('/', (_req, res) => res.status(503).send('Frontend not built. Run `npm run build` or use the Vite development server.'));
  }

  app.use((error, req, res, _next) => {
    console.error('[MAMA TIME] Unhandled error:', error);
    if (res.headersSent) return;
    const message = config.isProduction ? 'Ein unerwarteter Fehler ist aufgetreten.' : error.message;
    res.status(error.status || 500).json({ ok: false, message, requestPath: req.path });
  });

  return app;
}
