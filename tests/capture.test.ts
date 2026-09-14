import test from 'node:test';
import assert from 'node:assert/strict';
import { shouldCaptureMorse } from '../src/lib/capture.ts';

test('capture is active without focusing the button, except in typing fields', () => {
  assert.equal(shouldCaptureMorse({ key: ' ' }, ' ', false), true);
  assert.equal(shouldCaptureMorse({ key: 'j' }, 'j', false), true);
  assert.equal(shouldCaptureMorse({ key: 'J' }, 'j', false), true);
  assert.equal(shouldCaptureMorse({ key: 'Enter' }, 'Enter', false), true);
  assert.equal(shouldCaptureMorse({ key: ' ' }, 'j', false), false);
  assert.equal(shouldCaptureMorse({ key: ' ', repeat: true }, ' ', false), false);
  assert.equal(shouldCaptureMorse({ key: ' ' }, ' ', true), false);
  assert.equal(shouldCaptureMorse({ key: ' ', target: { tagName: 'TEXTAREA' } }, ' ', false), false);
  assert.equal(shouldCaptureMorse({ key: 'j', target: { tagName: 'SELECT' } }, 'j', false), false);
  assert.equal(shouldCaptureMorse({ key: ' ', target: { tagName: 'BUTTON' } }, ' ', false), true);
});
