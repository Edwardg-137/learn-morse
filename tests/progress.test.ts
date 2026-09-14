import test from 'node:test';
import assert from 'node:assert/strict';
import { readProgress, saveAttempt, lessonPassed } from '../src/lib/progress.ts';

test('corrupt persisted data resets safely and reports lost storage', () => {
  const result = readProgress({ getItem: () => '{broken' });
  assert.deepEqual(result.attempts, []);
  assert.ok(result.warning);
});
test('lesson requires all exercises in both directions, repeats keep history', () => {
  let state = readProgress({ getItem: () => null });
  const first = { id: 'a', lessonId: 'intro', exercise: 0, direction: 'send' as const, accuracy: 100, seconds: 3, date: '2026-09-13' };
  state = saveAttempt(state, first);
  assert.equal(lessonPassed(state, 'intro', 1), false);
  state = saveAttempt(state, { ...first, id: 'b', direction: 'receive', accuracy: 84 });
  assert.equal(lessonPassed(state, 'intro', 1), false);
  state = saveAttempt(state, { ...first, id: 'c', direction: 'receive', accuracy: 85 });
  assert.equal(lessonPassed(state, 'intro', 1), true);
  state = saveAttempt(state, first);
  assert.equal(state.attempts.length, 3);
});
