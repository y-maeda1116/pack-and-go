import { defineConfig } from 'vitest/config';
import tailwindcss from '@tailwindcss/vite';

// base: './' で相対パス化し、ユーザー Pages (user.github.io) と
// リポジトリ Pages (user.github.io/pack-and-go) のどちらでも動作する。
export default defineConfig({
  base: './',
  plugins: [tailwindcss()],
  test: {
    environment: 'node',
    include: ['test/**/*.test.ts'],
  },
});
