import test from 'node:test';
import assert from 'node:assert';
import { parseSplitCommand } from '../lib/parser';

test('parser - parseSplitCommand with memo', () => {
  const result = parseSplitCommand('/split 300.50 UCT @alice,@bob memo:"team lunch"');
  assert.ok(result);
  assert.strictEqual(result.amount, '300.50');
  assert.strictEqual(result.coinId, 'UCT');
  assert.deepStrictEqual(result.participants, ['@alice', '@bob']);
  assert.strictEqual(result.memo, 'team lunch');
});

test('parser - parseSplitCommand without memo', () => {
  const result = parseSplitCommand('/split 100 USDT @charlie,@dan');
  assert.ok(result);
  assert.strictEqual(result.amount, '100');
  assert.strictEqual(result.coinId, 'USDT');
  assert.deepStrictEqual(result.participants, ['@charlie', '@dan']);
  assert.strictEqual(result.memo, '');
});

test('parser - parseSplitCommand invalid formats', () => {
  assert.strictEqual(parseSplitCommand('hello world'), null);
  assert.strictEqual(parseSplitCommand('/split 300 @alice'), null); // missing coinId
});
