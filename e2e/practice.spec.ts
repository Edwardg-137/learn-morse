import { test, expect } from '@playwright/test';

test('assigned key transmits without clicking the morse button first', async ({ page }) => {
  await page.goto('/');
  await page.getByRole('button', { name: 'Comenzar a aprender' }).click();
  await expect(page.getByRole('button', { name: 'Transmitir morse con Espacio' })).toBeVisible();
  await page.getByRole('button', { name: 'Ver una pista' }).focus();
  await expect(page.getByRole('button', { name: 'Transmitir morse con Espacio' })).not.toBeFocused();
  await page.keyboard.down('Space');
  await page.waitForTimeout(80);
  await page.keyboard.up('Space');
  await expect(page.getByTestId('morse-code')).toHaveText('.');
  await page.getByText('Ajustar mi señal').click();
  await page.getByLabel('Tecla de transmisión').selectOption('j');
  await page.getByRole('button', { name: 'Ver una pista' }).focus();
  await page.keyboard.press('j');
  await expect(page.getByTestId('morse-code')).toHaveText('. .');
});

test('Espacio transmits a dot, holding transmits one dash, and Spanish typing remains normal', async ({ page }) => {
  await page.goto('/');
  await page.getByRole('button', { name: 'Comenzar a aprender' }).click();
  const key = page.getByRole('button', { name: 'Transmitir morse con Espacio' });
  await key.focus();
  await page.keyboard.down('Space');
  await page.waitForTimeout(80);
  await page.keyboard.up('Space');
  await expect(page.getByTestId('morse-code')).toHaveText('.');
  await page.getByRole('button', { name: 'Borrar transmisión' }).click();
  await key.focus();
  await page.keyboard.down('Space');
  await page.keyboard.down('Space');
  await page.waitForTimeout(350);
  await page.keyboard.up('Space');
  await expect(page.getByTestId('morse-code')).toHaveText('-');
  await page.getByRole('button', { name: 'Morse a español', exact: true }).click();
  await page.getByLabel('Tu traducción').fill('HOLA MUNDO');
  await expect(page.getByLabel('Tu traducción')).toHaveValue('HOLA MUNDO');
});

test('infinite drill shows one random letter or number and does not end', async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto('/');
  await page.getByRole('button', { name: /Señales sueltas/ }).click();
  await expect(page.getByRole('heading', { name: 'Señales sueltas' })).toBeVisible();
  await expect(page.getByText('Ampliación · SEÑAL 1 · SIN FIN')).toBeVisible();
  await expect(page.locator('.challenge > p')).toHaveText(/^[A-ZÑ0-9]$/);
  await expect(page.getByRole('button', { name: 'Transmitir morse con Espacio' })).toBeVisible();
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth)).toBe(true);
});

test('mobile layout and lesson feedback remain usable with reduced motion', async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.emulateMedia({ reducedMotion: 'reduce' });
  await page.goto('/');
  await page.getByRole('button', { name: 'Comenzar a aprender' }).click();
  await page.getByRole('button', { name: 'Morse a español', exact: true }).click();
  await page.getByLabel('Tu traducción').fill('Z');
  await page.getByRole('button', { name: 'Comprobar respuesta' }).click();
  await expect(page.getByRole('heading', { name: 'Cada intento te acerca' })).toBeVisible();
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth)).toBe(true);
});
