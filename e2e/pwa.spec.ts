import { test, expect } from '@playwright/test';

test('production installs a complete public cache and can practice offline after reload', async ({ page, context }) => {
  const errors: string[] = [];
  page.on('pageerror', error => errors.push(error.message));
  await page.goto('/');
  const manifest = await (await page.request.get('/manifest.webmanifest')).json();
  for (const icon of manifest.icons) {
    const response = await page.request.get(icon.src);
    expect(response.headers()['content-type']).toContain('image/png');
    expect((await response.body()).length).toBeGreaterThan(100);
  }
  await page.evaluate(async () => { await navigator.serviceWorker.ready; });
  await page.reload();
  await expect.poll(() => page.evaluate(() => !!navigator.serviceWorker.controller)).toBe(true);
  const cached = await page.evaluate(async () => {
    const name = (await caches.keys()).find(key => key.startsWith('learn-morse-'))!;
    return (await (await caches.open(name)).keys()).map(request => new URL(request.url).pathname);
  });
  expect(cached).toContain('/index.html');
  expect(cached.some(path => path.endsWith('.js'))).toBe(true);
  expect(cached.every(path => path.startsWith('/assets/') || ['/index.html', '/icon.svg', '/icon-192.png', '/icon-512.png', '/manifest.webmanifest'].includes(path))).toBe(true);
  await context.setOffline(true);
  await page.reload();
  await expect(page.getByText(/Sin conexión · Puedes aprender/)).toBeVisible();
  await page.getByRole('button', { name: 'Comenzar a aprender' }).click();
  await page.getByRole('button', { name: 'Morse a español', exact: true }).click();
  await page.getByLabel('Tu traducción').fill('E');
  await page.getByRole('button', { name: 'Comprobar respuesta' }).click();
  await expect(page.getByRole('heading', { name: '¡Señal recibida!' })).toBeVisible();
  expect(errors).toEqual([]);
});
