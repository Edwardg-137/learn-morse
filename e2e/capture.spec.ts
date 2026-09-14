import { test, expect, type Page } from '@playwright/test';
import { lessons } from '../src/content/lessons';

async function begin(page: Page) {
  await page.goto('/');
  await page.getByRole('button', { name: 'Comenzar a aprender' }).click();
}

async function deferredAudio(page: Page) {
  await page.addInitScript(() => {
    const pending: (() => void)[] = [];
    const audio = { started: 0, stopped: 0, resumes: 0, release: () => pending.splice(0).forEach(resolve => resolve()) };
    (window as any).__audio = audio;
    class Context {
      state = 'suspended'; currentTime = 0; destination = {};
      resume() { audio.resumes++; return new Promise<void>(resolve => pending.push(() => { this.state = 'running'; resolve(); })); }
      createOscillator() { return { frequency: { value: 0 }, onended: null, connect: (gain: unknown) => gain, disconnect() {}, start() { audio.started++; }, stop() { audio.stopped++; } }; }
      createGain() { return { gain: { setValueAtTime() {}, linearRampToValueAtTime() {}, cancelScheduledValues() {}, setTargetAtTime() {} }, connect() { return this; }, disconnect() {} }; }
    }
    (window as any).AudioContext = Context;
  });
}

test('pending letter blocks submission and survives moving focus to check', async ({ page }) => {
  await begin(page);
  const key = page.getByRole('button', { name: 'Transmitir morse con Espacio' });
  const check = page.getByRole('button', { name: 'Comprobar respuesta' });
  await key.focus();
  await page.keyboard.press('Space');
  await expect(page.getByTestId('morse-code')).toHaveText('.');
  await page.keyboard.down('Space');
  expect(await check.isDisabled()).toBe(true);
  await page.keyboard.up('Space');
  expect(await check.isDisabled()).toBe(true);
  await page.getByRole('button', { name: 'Ver una pista' }).focus();
  await expect(page.getByTestId('morse-code')).toHaveText('. .');
  await expect(check).toBeEnabled();
});

test('confirmed transmission is restored after reload', async ({ page }) => {
  await begin(page);
  await page.getByRole('button', { name: 'Transmitir morse con Espacio' }).focus();
  await page.keyboard.press('Space');
  await expect(page.getByTestId('morse-code')).toHaveText('.');
  await page.reload();
  await page.getByRole('button', { name: 'Retomar práctica' }).click();
  await expect(page.getByTestId('morse-code')).toHaveText('.');
  await page.getByRole('button', { name: 'Reanudar práctica' }).click();
  await page.getByRole('button', { name: 'Comprobar respuesta' }).click();
  await expect(page.getByRole('heading', { name: '¡Señal recibida!' })).toBeVisible();
});

test('reviewed completion survives reload and requires explicit repeat for another award', async ({ page }) => {
  await begin(page);
  await page.getByRole('button', { name: 'Morse a español', exact: true }).click();
  await page.getByLabel('Tu traducción').fill('E');
  await page.getByRole('button', { name: 'Comprobar respuesta' }).click();
  await expect(page.getByRole('button', { name: 'Repetir ejercicio' })).toBeVisible();
  const before = await page.evaluate(() => JSON.parse(localStorage.getItem('learn-morse-progress')!).attempts);
  expect(before).toHaveLength(1);
  await page.reload();
  await page.getByRole('button', { name: 'Retomar práctica' }).click();
  await expect(page.getByRole('button', { name: 'Repetir ejercicio' })).toBeVisible();
  await expect(page.getByRole('button', { name: 'Comprobar respuesta' })).toHaveCount(0);
  expect(await page.evaluate(() => JSON.parse(localStorage.getItem('learn-morse-progress')!).attempts)).toEqual(before);
  await page.getByRole('button', { name: 'Repetir ejercicio' }).click();
  await page.getByLabel('Tu traducción').fill('E');
  await page.getByRole('button', { name: 'Comprobar respuesta' }).click();
  await expect.poll(() => page.evaluate(() => JSON.parse(localStorage.getItem('learn-morse-progress')!).attempts.length)).toBe(2);
});

test('segment retries preserve errors and reviewed state across reload', async ({ page }) => {
  const lesson = lessons.find(lesson => lesson.id === 'parrafos')!;
  const first = lesson.exercises[0].split('.')[0] + '.';
  await page.goto('/');
  await page.getByRole('button', { name: /Una historia en señales/ }).click();
  await page.getByRole('button', { name: 'Morse a español', exact: true }).click();
  await page.getByLabel('Tu traducción').fill('Z');
  await page.getByRole('button', { name: 'Comprobar respuesta' }).click();
  await page.getByRole('button', { name: 'Repetir segmento' }).click();
  await page.getByLabel('Tu traducción').fill(first);
  await page.getByRole('button', { name: 'Comprobar respuesta' }).click();
  await expect(page.getByTestId('segment-history').getByRole('listitem')).toHaveCount(2);
  await page.reload();
  await page.getByRole('button', { name: 'Retomar práctica' }).click();
  await expect(page.getByTestId('segment-history').getByRole('listitem')).toHaveCount(2);
  await expect(page.getByRole('button', { name: 'Siguiente segmento' })).toBeVisible();
  await page.getByRole('button', { name: 'Siguiente segmento' }).click();
  await expect(page.getByText('Segmento 2 / 4', { exact: true })).toBeVisible();
  await expect(page.getByLabel('Tu traducción')).toHaveValue('');
  expect(await page.evaluate(() => JSON.parse(localStorage.getItem('learn-morse-draft')!).answers.length)).toBe(1);
});

test('pausing cancels audio waiting for permission', async ({ page }) => {
  await deferredAudio(page);
  await begin(page);
  await page.getByRole('button', { name: 'Escuchar señal' }).click();
  await expect.poll(() => page.evaluate(() => (window as any).__audio.resumes)).toBe(1);
  await page.getByRole('button', { name: 'Pausar práctica' }).click();
  await page.evaluate(() => (window as any).__audio.release());
  expect(await page.evaluate(() => (window as any).__audio.started)).toBe(0);
  await expect(page.getByRole('button', { name: 'Detener audio' })).toHaveCount(0);
});

test('unmounting a held key cancels its pending audio startup', async ({ page }) => {
  await deferredAudio(page);
  await begin(page);
  await page.getByRole('button', { name: 'Transmitir morse con Espacio' }).focus();
  await page.keyboard.down('Space');
  await expect.poll(() => page.evaluate(() => (window as any).__audio.resumes)).toBe(1);
  await page.getByRole('button', { name: 'Volver al recorrido' }).dispatchEvent('click');
  await page.evaluate(() => (window as any).__audio.release());
  expect(await page.evaluate(() => (window as any).__audio.started)).toBe(0);
});

test('a stale audio promise cannot start a second voice for the next press', async ({ page }) => {
  await deferredAudio(page);
  await begin(page);
  await page.getByRole('button', { name: 'Transmitir morse con Espacio' }).focus();
  await page.keyboard.press('Space');
  await page.keyboard.down('Space');
  await expect.poll(() => page.evaluate(() => (window as any).__audio.resumes)).toBe(2);
  await page.evaluate(() => (window as any).__audio.release());
  expect(await page.evaluate(() => (window as any).__audio.started)).toBe(1);
  await page.keyboard.up('Space');
  expect(await page.evaluate(() => (window as any).__audio.stopped)).toBe(1);
});

test('requesting a visual hint explicitly leaves audio-only presentation', async ({ page }) => {
  await begin(page);
  await page.getByRole('button', { name: 'Morse a español', exact: true }).click();
  await page.getByLabel('Presentación').selectOption('audio');
  await page.getByRole('button', { name: 'Ver una pista' }).click();
  await expect(page.getByLabel('Presentación')).toHaveValue('both');
  await expect(page.getByRole('status').filter({ hasText: 'Visual y audio' })).toBeVisible();
});

test('letter and word pauses separate confirmed signals', async ({ page }) => {
  await page.addInitScript(() => {
    localStorage.setItem('learn-morse-settings', JSON.stringify({ key: ' ', dashMs: 250, letterMs: 400, wordMs: 2000, volume: 0 }));
  });
  await begin(page);
  const key = page.getByRole('button', { name: 'Transmitir morse con Espacio' });
  await key.focus();
  await page.keyboard.press('Space');
  await expect(page.getByTestId('morse-code')).toHaveText('.');
  await key.focus();
  await page.keyboard.press('Space');
  await expect(page.getByTestId('morse-code')).toHaveText('. .');
  await page.waitForTimeout(1700);
  await key.focus();
  await page.keyboard.press('Space');
  await expect(page.getByTestId('morse-code')).toHaveText('. . / .');
});

test('losing window focus pauses practice and discards an unfinished press', async ({ page }) => {
  await begin(page);
  const key = page.getByRole('button', { name: 'Transmitir morse con Espacio' });
  await key.focus();
  await page.keyboard.down('Space');
  await page.evaluate(() => window.dispatchEvent(new Event('blur')));
  await expect(page.getByText('Práctica en pausa', { exact: false })).toBeVisible();
  await expect(page.getByTestId('morse-code')).toHaveText('—');
  await page.keyboard.up('Space');
  await expect(page.getByTestId('morse-code')).toHaveText('—');
});

test('hiding the tab pauses practice', async ({ page }) => {
  await begin(page);
  await page.evaluate(() => {
    Object.defineProperty(document, 'hidden', { configurable: true, get: () => true });
    document.dispatchEvent(new Event('visibilitychange'));
  });
  await expect(page.getByText('Práctica en pausa', { exact: false })).toBeVisible();
});

test('pointer cancel discards an unfinished touch signal', async ({ page }) => {
  await begin(page);
  const key = page.getByRole('button', { name: 'Transmitir morse con Espacio' });
  await key.scrollIntoViewIfNeeded();
  await expect(key).toBeInViewport();
  await key.hover();
  await page.mouse.down();
  await expect(key).toHaveAttribute('aria-pressed', 'true');
  await page.evaluate(() => {
    document.querySelector('.morse-key')!.dispatchEvent(new PointerEvent('pointercancel', {
      bubbles: true, cancelable: true, composed: true, pointerId: 1, pointerType: 'mouse', isPrimary: true,
    }));
  });
  await expect(key).toHaveAttribute('aria-pressed', 'false');
  await expect(page.getByTestId('morse-code')).toHaveText('—');
  await page.mouse.up();
});

test('changing the capture key keeps confirmed signals and uses the new key', async ({ page }) => {
  await begin(page);
  await page.getByRole('button', { name: 'Transmitir morse con Espacio' }).focus();
  await page.keyboard.press('Space');
  await expect(page.getByTestId('morse-code')).toHaveText('.');
  await page.getByText('Ajustar mi señal').click();
  await page.getByLabel('Tecla de transmisión').selectOption('j');
  const key = page.getByRole('button', { name: 'Transmitir morse con J' });
  await expect(key).toBeVisible();
  await expect(page.getByTestId('morse-code')).toHaveText('.');
  await key.focus();
  await page.keyboard.press('Space');
  await expect(page.getByTestId('morse-code')).toHaveText('.');
  await page.keyboard.press('j');
  await expect(page.getByTestId('morse-code')).toHaveText('. .');
});
