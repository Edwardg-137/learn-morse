export const INFINITE_SIGNALS = 'ABCDEFGHIJKLMNOPQRSTUVWXYZÑ0123456789';

export function randomSignal(random: () => number = Math.random, previous = '') {
  const pool = previous && INFINITE_SIGNALS.length > 1
    ? [...INFINITE_SIGNALS].filter(symbol => symbol !== previous)
    : [...INFINITE_SIGNALS];
  const index = Math.min(pool.length - 1, Math.max(0, Math.floor(random() * pool.length)));
  return pool[index]!;
}
