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
import { paymentsRouter } from './server/routes/payments.router.ts';

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

// Third-Party OAuth Popup Callback Handler (Spotify & 3P integrations)
app.get(['/auth/spotify/callback', '/auth/spotify/callback/'], (_req, res) => {
  res.send(`<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <title>Spotify Connected</title>
  <style>
    body {
      background: #090D16;
      color: #F8FAFC;
      font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
      display: flex;
      align-items: center;
      justify-content: center;
      height: 100vh;
      margin: 0;
      text-align: center;
    }
    .box {
      background: #111827;
      border: 1px solid rgba(29, 185, 84, 0.4);
      border-radius: 20px;
      padding: 32px;
      box-shadow: 0 10px 30px rgba(0,0,0,0.6);
      max-width: 360px;
    }
    .icon {
      width: 48px;
      height: 48px;
      margin: 0 auto 16px;
      background: #1DB954;
      border-radius: 50%;
      display: flex;
      align-items: center;
      justify-content: center;
      color: #000;
      font-size: 24px;
      font-weight: bold;
    }
    h2 { font-size: 18px; margin: 0 0 8px; }
    p { color: #94A3B8; font-size: 13px; margin: 0; line-height: 1.5; }
  </style>
</head>
<body>
  <div class="box">
    <div class="icon">✓</div>
    <h2>Spotify Account Connected!</h2>
    <p id="msg">Syncing your personal playlists into Personal AI OS...</p>
  </div>
  <script>
    (function() {
      try {
        var hash = window.location.hash.substring(1);
        var params = new URLSearchParams(hash);
        var token = params.get('access_token');
        var error = params.get('error') || new URLSearchParams(window.location.search).get('error');

        if (token) {
          if (window.opener) {
            window.opener.postMessage({ type: 'SPOTIFY_AUTH_SUCCESS', token: token }, '*');
            setTimeout(function() { window.close(); }, 600);
          } else {
            localStorage.setItem('paio_spotify_web_token', token);
            window.location.href = '/';
          }
          return;
        }

        var searchParams = new URLSearchParams(window.location.search);
        var code = searchParams.get('code');
        if (code) {
          if (window.opener) {
            window.opener.postMessage({ type: 'SPOTIFY_AUTH_CODE', code: code }, '*');
            setTimeout(function() { window.close(); }, 600);
          } else {
            window.location.href = '/';
          }
          return;
        }

        if (error) {
          document.getElementById('msg').innerText = 'Connection error: ' + error;
          if (window.opener) {
            window.opener.postMessage({ type: 'SPOTIFY_AUTH_ERROR', error: error }, '*');
            setTimeout(function() { window.close(); }, 2500);
          }
        }
      } catch (e) {
        console.error(e);
      }
    })();
  </script>
</body>
</html>`);
});

// Dedicated API Routers
app.use('/api/assistant', assistantRouter);
app.use('/api/user', userRouter);
app.use('/api/integrations', integrationsRouter);
app.use('/api/payments', paymentsRouter);

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
