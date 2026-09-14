import test from 'node:test';
import assert from 'node:assert/strict';
import { GUIDE_STEPS, stepOutcome } from '../src/lib/guide.ts';

test('guide has five sequential steps', () => {
  assert.equal(GUIDE_STEPS.length, 5);
  assert.deepEqual(GUIDE_STEPS.map(step => step.id), ['dot', 'dash', 'sameLetter', 'nextLetter', 'nextWord']);
});

test('dot step completes only on a single short signal', () => {
  assert.equal(stepOutcome('dot', '', ''), 'incomplete');
  assert.equal(stepOutcome('dot', '', '.'), 'complete');
  assert.equal(stepOutcome('dot', '.', ''), 'complete');
  assert.equal(stepOutcome('dot', '', '-'), 'mismatch');
  assert.equal(stepOutcome('dot', '-', ''), 'mismatch');
  assert.equal(stepOutcome('dot', '', '..'), 'mismatch');
  assert.equal(stepOutcome('dot', '. -', ''), 'mismatch');
});

test('dash step completes only on a single held signal', () => {
  assert.equal(stepOutcome('dash', '', '-'), 'complete');
  assert.equal(stepOutcome('dash', '-', ''), 'complete');
  assert.equal(stepOutcome('dash', '', '.'), 'mismatch');
  assert.equal(stepOutcome('dash', '.', ''), 'mismatch');
  assert.equal(stepOutcome('dash', '', '.-'), 'mismatch');
});

test('same-letter step requires several signals before a letter gap', () => {
  assert.equal(stepOutcome('sameLetter', '', '.'), 'incomplete');
  assert.equal(stepOutcome('sameLetter', '.', ''), 'incomplete');
  assert.equal(stepOutcome('sameLetter', '', '..'), 'complete');
  assert.equal(stepOutcome('sameLetter', '..', ''), 'complete');
  assert.equal(stepOutcome('sameLetter', '', '.-'), 'complete');
  assert.equal(stepOutcome('sameLetter', '. -', ''), 'mismatch');
  assert.equal(stepOutcome('sameLetter', '. / .', ''), 'mismatch');
});

test('next-letter step requires a letter gap without a word gap', () => {
  assert.equal(stepOutcome('nextLetter', '.', ''), 'incomplete');
  assert.equal(stepOutcome('nextLetter', '. -', ''), 'complete');
  assert.equal(stepOutcome('nextLetter', '.. .', ''), 'complete');
  assert.equal(stepOutcome('nextLetter', '. / .', ''), 'mismatch');
});

test('word step completes only when a word gap appears', () => {
  assert.equal(stepOutcome('nextWord', '. -', ''), 'incomplete');
  assert.equal(stepOutcome('nextWord', '. / .', ''), 'complete');
  assert.equal(stepOutcome('nextWord', '.. / -', ''), 'complete');
});
