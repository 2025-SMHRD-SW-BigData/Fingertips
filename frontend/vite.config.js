import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '');
  const target = env.VITE_API_TARGET || 'http://localhost:3000';
  const stripApi = env.VITE_PROXY_STRIP_API === '1';

  const apiProxy = {
    target,
    changeOrigin: true,
    secure: false,
  };
  if (stripApi) {
    apiProxy.rewrite = (path) => path.replace(/^\/api/, '');
  }

  return {
    plugins: [react()],
    server: {
      proxy: {
        '/api': apiProxy,
      },
    },
  };
});
