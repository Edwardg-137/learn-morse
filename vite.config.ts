import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { readFileSync } from 'node:fs';
import { createHash } from 'node:crypto';
export default defineConfig({ build: { rollupOptions: { output: { manualChunks: { supabase: ['@supabase/supabase-js'] } } } }, plugins: [react(), {
  name: 'offline-lesson-cache',
  generateBundle(_, bundle) {
    const assets = [...new Set(['/index.html', '/icon.svg', '/icon-192.png', '/icon-512.png', '/manifest.webmanifest', ...Object.keys(bundle).map(name => `/${name}`)])];
    const template = readFileSync('src/service-worker.js', 'utf8');
    const digest = createHash('sha256').update(JSON.stringify(assets)).update(template).update(readFileSync('index.html'));
    for (const file of ['icon.svg', 'icon-192.png', 'icon-512.png', 'manifest.webmanifest']) digest.update(readFileSync(`public/${file}`));
    const hash = digest.digest('hex').slice(0, 12);
    const worker = template.replace('__PRECACHE__', JSON.stringify(assets)).replace('__CACHE_NAME__', JSON.stringify(`learn-morse-${hash}`));
    this.emitFile({ type: 'asset', fileName: 'sw.js', source: worker });
  },
}] });
