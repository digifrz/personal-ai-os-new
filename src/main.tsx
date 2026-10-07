import {StrictMode} from 'react';
import {createRoot} from 'react-dom/client';
import App from './App.tsx';
import './index.css';
import { ErrorBoundary } from './components/common/ErrorBoundary';
import { registerSW } from 'virtual:pwa-register';

// Register PWA service worker with auto-update
registerSW({
  immediate: true,
  onNeedRefresh() {
    console.log('New Personal AI OS content available; updating service worker.');
  },
  onOfflineReady() {
    console.log('Personal AI OS is cached and ready for offline use.');
  },
});

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <ErrorBoundary fallbackTitle="Personal AI OS Workspace Encountered an Issue">
      <App />
    </ErrorBoundary>
  </StrictMode>,
);
