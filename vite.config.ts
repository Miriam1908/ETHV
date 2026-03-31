import tailwindcss from '@tailwindcss/vite';
import react from '@vitejs/plugin-react';
import path from 'path';
import {defineConfig, loadEnv} from 'vite';

export default defineConfig(({mode}) => {
  const env = loadEnv(mode, '.', '');
  return {
    plugins: [react(), tailwindcss()],
    define: {
      'process.env.GEMINI_API_KEY': JSON.stringify(env.GEMINI_API_KEY),
      'process.env.VITE_SUPABASE_URL': JSON.stringify(env.VITE_SUPABASE_URL),
      'process.env.VITE_SUPABASE_KEY': JSON.stringify(env.VITE_SUPABASE_KEY),
      'process.env.VITE_OPENCLAW_TOKEN': JSON.stringify(env.VITE_OPENCLAW_TOKEN),
      'process.env.VITE_EXTRACTOR_URL': JSON.stringify(env.VITE_EXTRACTOR_URL),
    },
    resolve: {
      alias: {
        '@': path.resolve(__dirname, '.'),
      },
    },
    server: {
      hmr: process.env.DISABLE_HMR !== 'true',
      port: 3000,
      proxy: {
        '/v1': {
          target: 'http://localhost:3003',
          changeOrigin: true
        },
        '/api': {
          target: 'http://localhost:3003',
          changeOrigin: true
        },
        '/hooks': {
          target: 'http://localhost:3003',
          changeOrigin: true
        },
        '/health': {
          target: 'http://localhost:3003',
          changeOrigin: true
        }
      }
    },
    preview: {
      headers: {
        'X-Content-Type-Options': 'nosniff',
        'X-Frame-Options': 'DENY',
        'X-XSS-Protection': '1; mode=block',
        'Referrer-Policy': 'strict-origin-when-cross-origin',
        'Content-Security-Policy': "default-src 'self'; script-src 'self' 'unsafe-inline' 'unsafe-eval'; style-src 'self' 'unsafe-inline'; img-src 'self' data: https:; font-src 'self' data:; connect-src 'self' http://localhost:* http://127.0.0.1:* https://*;"
      },
    },
  };
});
