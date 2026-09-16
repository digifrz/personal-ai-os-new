import express from 'express';
import path from 'path';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';
import { runAutomatedMigrations } from './server/migrations.ts';
import { extractAuth } from './server/middleware/auth.ts';
import { errorHandler } from './server/middleware/errorHandler.ts';
import { assistantRouter } from './server/routes/assistant.router.ts';
import { userRouter } from './server/routes/user.router.ts';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = 3000;

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

// Global Centralized Error Handler (must be after routes)
app.use(errorHandler);

// Automatically run database migrations upon server start
runAutomatedMigrations().catch((err) => {
  console.warn('Startup migration notice:', err);
});

async function startServer() {
  const isProd = process.env.NODE_ENV === 'production';

  if (!isProd) {
    const { createServer: createViteServer } = await import('vite');
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.resolve(__dirname, 'dist');
    app.use(express.static(distPath));
    app.get('*', (_req, res) => {
      res.sendFile(path.resolve(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`Personal AI OS server listening on http://0.0.0.0:${PORT}`);
  });
}

startServer();
