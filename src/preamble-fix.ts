/**
 * React Fast Refresh Preamble Safety Guard
 *
 * In Vite development mode with React Fast Refresh enabled, compiled React modules verify:
 *   if (!window.$RefreshReg$) throw new Error("@vitejs/plugin-react can't detect preamble...")
 *
 * When a Service Worker caches index.html or when modules execute in edge-case network conditions,
 * this file guarantees that window.$RefreshReg$ and window.$RefreshSig$ are always defined
 * before any React component files (like AuthContext.tsx) evaluate.
 */

declare global {
  interface Window {
    $RefreshReg$?: (type?: any, id?: string) => void;
    $RefreshSig$?: () => (type?: any) => any;
    __vite_plugin_react_preamble_installed__?: boolean;
  }
}

if (typeof window !== 'undefined') {
  if (!window.$RefreshReg$) {
    window.$RefreshReg$ = () => {};
  }
  if (!window.$RefreshSig$) {
    window.$RefreshSig$ = () => (type: any) => type;
  }
  window.__vite_plugin_react_preamble_installed__ = true;
}

export {};
