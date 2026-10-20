import { defineConfig } from 'vite';
import { audioStudioPlugin } from './tools/audio-studio-plugin.ts';

export default defineConfig({
  // 相对路径使 dist 可放在仓库子路径或静态服务器目录中。
  base: './',
  plugins: [audioStudioPlugin()],
  build: { rollupOptions: { input: { game: 'index.html', studio: 'audio-studio.html' } } },
});
