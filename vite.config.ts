import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '');
  const serverPort = Number(env.VITE_DEV_SERVER_PORT || '5173');
  const proxyTarget = env.VITE_DEV_PROXY_TARGET || env.VITE_PROD_API_BASE_URL || 'http://localhost:8080';

  return {
    plugins: [react()],
    server: {
      port: serverPort,
      proxy: {
        '/api': {
          target: proxyTarget,
          changeOrigin: true
        }
      }
    }
  };
});
