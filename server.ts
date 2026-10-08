import express from 'express';
import http from 'http';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';
import { runAutomatedMigrations } from './server/migrations.ts';
import { extractAuth } from './server/middleware/auth.ts';
import { errorHandler } from './server/middleware/errorHandler.ts';
import { assistantRouter } from './server/routes/assistant.router.ts';
import { userRouter } from './server/routes/user.router.ts';
import { integrationsRouter } from './server/routes/integrations.router.ts';

dotenv.config();

// Determine directory safely in both ESM and CJS bundle
const getDirname = () => {
  if (typeof __dirname !== 'undefined') {
    return __dirname;
  }
  try {
    if (typeof import.meta !== 'undefined' && import.meta.url) {
      return path.dirname(fileURLToPath(import.meta.url));
    }
  } catch {
    // Fall back to process.cwd()
  }
  return process.cwd();
};

const currentDir = getDirname();

const app = express();
const PORT = process.env.PORT ? parseInt(process.env.PORT, 10) : 3000;

app.use(express.json({ limit: '25mb' }));
app.use(express.urlencoded({ extended: true, limit: '25mb' }));

// Global authentication context extractor
app.use(extractAuth);

// Health check endpoint
app.get('/api/health', (_req, res) => {
  res.json({
    status: 'healthy',
    uptimeSeconds: Math.floor(process.uptime()),
    timestamp: new Date().toISOString(),
  });
});

// Run or trigger schema migrations
app.post('/api/migrations/run', async (_req, res) => {
  try {
    const result = await runAutomatedMigrations();
    res.json(result);
  } catch (error: any) {
    res.status(500).json({ error: error?.message || 'Migration failed' });
  }
});

// Dedicated API Routers
app.use('/api/assistant', assistantRouter);
app.use('/api/user', userRouter);
app.use('/api/integrations', integrationsRouter);

// Global Centralized Error Handler (must be after routes)
app.use(errorHandler);

// Automatically run database migrations upon server start
runAutomatedMigrations().catch((err) => {
  console.warn('Startup migration notice:', err);
});

async function startServer() {
  const isProd = process.env.NODE_ENV === 'production';
  const httpServer = http.createServer(app);

  if (!isProd) {
    const { createServer: createViteServer } = await import('vite');
    const vite = await createViteServer({
      server: {
        middlewareMode: true,
        hmr: {
          server: httpServer,
        },
      },
      appType: 'spa',
    });
    app.use(vite.middlewares);

    // Ensure all dev SPA navigations reliably serve transformed index.html
    app.use('*', async (req, res, next) => {
      const url = req.originalUrl;
      if (url.startsWith('/api')) {
        return next();
      }
      try {
        const indexPath = path.resolve(process.cwd(), 'index.html');
        let template = fs.readFileSync(indexPath, 'utf-8');
        template = await vite.transformIndexHtml(url, template);
        res.status(200).set({ 'Content-Type': 'text/html' }).end(template);
      } catch (err) {
        return next(err);
      }
    });
  } else {
    const candidates = [
      path.resolve(process.cwd(), 'dist'),
      currentDir,
      path.resolve(currentDir, '..', 'dist'),
    ];
    const distPath = candidates.find((dir) => fs.existsSync(path.join(dir, 'index.html'))) || candidates[0];
    app.use(express.static(distPath));
    app.get('*', (_req, res) => {
      res.sendFile(path.resolve(distPath, 'index.html'));
    });
  }

  httpServer.listen(PORT, '0.0.0.0', () => {
    console.log(`Personal AI OS server listening on http://0.0.0.0:${PORT}`);
  });
}

startServer();
