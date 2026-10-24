import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// Сайт публикуется на GitHub Pages по адресу https://<user>.github.io/bobbin-yarn-catalog/,
// поэтому в production все пути начинаются с /bobbin-yarn-catalog/. Свой домен — BASE_PATH=/
export default defineConfig(({ command }) => ({
  base: command === 'build' ? process.env.BASE_PATH ?? '/bobbin-yarn-catalog/' : '/',
  plugins: [react()],
  build: { target: 'es2020', chunkSizeWarningLimit: 900 },
}));
