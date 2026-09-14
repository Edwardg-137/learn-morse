import test from 'node:test';
import assert from 'node:assert/strict';
import { INFINITE_SIGNALS, randomSignal } from '../src/lib/infinite.ts';
import { lessons } from '../src/content/lessons.ts';
import { normalize, encode, decode } from '../src/lib/morse.ts';

test('infinite drill draws single letters and digits without immediate repeats', () => {
  assert.equal(INFINITE_SIGNALS, 'ABCDEFGHIJKLMNOPQRSTUVWXYZÑ0123456789');
  assert.equal(randomSignal(() => 0), 'A');
  assert.equal(randomSignal(() => 0.999), '9');
  assert.notEqual(randomSignal(() => 0, 'A'), 'A');
  const seen = new Set(Array.from({ length: 80 }, (_, i) => randomSignal(() => (i * 0.17) % 1)));
  assert.ok([...seen].every(symbol => INFINITE_SIGNALS.includes(symbol)));
  assert.ok(seen.size > 1);
});

test('infinite lesson is intermediate, not a finite catalog of exercises', () => {
  const lesson = lessons.find(item => item.infinite);
  assert.ok(lesson);
  assert.equal(lesson.stage, 'Ampliación');
  assert.equal(lesson.exercises.length, 0);
  assert.ok([...INFINITE_SIGNALS].every(symbol => lesson.symbols.includes(symbol)));
  for (const example of lesson.examples) {
    const normalized = normalize(example);
    assert.equal(normalized.length, 1);
    assert.equal(decode(encode(example)), normalized);
  }
});
