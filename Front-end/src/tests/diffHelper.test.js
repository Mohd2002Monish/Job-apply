import test from 'node:test';
import assert from 'node:assert';
import { computeArrayDiff } from '../utils/diffHelper.js';

test('computeArrayDiff - should compute correct additions and removals', () => {
  const oldArr = ['react', 'node', 'mongodb'];
  const newArr = ['react', 'node', 'express', 'postgresql'];

  const result = computeArrayDiff(oldArr, newArr);

  assert.deepStrictEqual(result.added, ['express', 'postgresql']);
  assert.deepStrictEqual(result.removed, ['mongodb']);
  assert.deepStrictEqual(result.unchanged, ['react', 'node']);
  assert.strictEqual(result.hasChanges, true);
});

test('computeArrayDiff - should report hasChanges false for identical arrays', () => {
  const oldArr = ['react', 'node'];
  const newArr = ['react', 'node'];

  const result = computeArrayDiff(oldArr, newArr);

  assert.deepStrictEqual(result.added, []);
  assert.deepStrictEqual(result.removed, []);
  assert.strictEqual(result.hasChanges, false);
});
