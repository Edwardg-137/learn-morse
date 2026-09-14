import { test, expect } from '@playwright/test';

test('guide stays hidden until the hero button and walks one step at a time', async ({ page }) => {
  await page.goto('/');
  await expect(page.getByRole('dialog', { name: 'Cómo entiende esta app el morse' })).toHaveCount(0);
  await expect(page.getByRole('button', { name: 'Transmitir morse con Espacio' })).toHaveCount(0);
  await page.getByRole('button', { name: 'Cómo funciona la tecla' }).click();
  const dialog = page.getByRole('dialog', { name: 'Cómo entiende esta app el morse' });
  await expect(dialog).toBeVisible();
  await expect(dialog.getByRole('heading', { name: 'Un punto' })).toBeVisible();
  await expect(dialog.getByText('La misma letra')).toHaveCount(0);
  await expect(dialog.getByText('Otra palabra')).toHaveCount(0);
  await expect(page.getByRole('button', { name: 'Siguiente' })).toHaveCount(0);
  const key = page.getByRole('button', { name: 'Transmitir morse con Espacio' });
  await expect(key).toBeVisible();
  await expect(key).toBeEnabled();
  await key.focus();
  await page.keyboard.down('Space');
  await page.waitForTimeout(80);
  await page.keyboard.up('Space');
  await expect(page.getByTestId('morse-code')).toHaveText('.');
  await expect(page.getByRole('button', { name: 'Repetir este paso' })).toBeVisible();
  await page.getByRole('button', { name: 'Siguiente' }).click();
  await expect(dialog.getByRole('heading', { name: 'Una raya' })).toBeVisible();
  await expect(dialog.getByRole('heading', { name: 'Un punto' })).toHaveCount(0);
  await page.getByRole('button', { name: 'Cerrar guía' }).click();
  await expect(dialog).toHaveCount(0);
  await expect(key).toHaveCount(0);
});

test('opened morse guide remains usable on a small screen', async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto('/');
  await page.getByRole('button', { name: 'Cómo funciona la tecla' }).click();
  await expect(page.getByRole('dialog', { name: 'Cómo entiende esta app el morse' })).toBeVisible();
  await expect(page.getByRole('button', { name: 'Transmitir morse con Espacio' })).toBeVisible();
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth)).toBe(true);
});
