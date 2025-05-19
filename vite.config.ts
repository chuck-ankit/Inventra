import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';
import { VitePWA } from 'vite-plugin-pwa';

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '');
  const apiUrl = env.VITE_API_URL || 'http://localhost:5000/api';
  const baseUrl = apiUrl.replace('/api', '');

  return {
    plugins: [
      react(),
      VitePWA({
        registerType: 'autoUpdate',
        includeAssets: ['favicon.ico', 'robots.txt'],
        manifest: {
          name: 'StockManager',
          short_name: 'StockManager',
          description: 'Stock and Inventory Management System',
          theme_color: '#3B82F6',
          icons: [
            {
              src: 'favicon.ico',
              sizes: '64x64',
              type: 'image/x-icon'
            }
          ]
        },
        workbox: {
          globPatterns: ['**/*.{js,css,html,ico,png,svg}']
        }
      })
    ],
    optimizeDeps: {
      exclude: ['lucide-react'],
    },
    server: {
      port: 5174,
      proxy: {
        '/api': {
          target: baseUrl,
          changeOrigin: true,
          secure: false
        }
      }
    }
  };
});