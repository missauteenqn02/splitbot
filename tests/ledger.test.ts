import test from 'node:test';
import assert from 'node:assert';
import { calculateNetBalances, computeSettlements, Expense } from '../lib/ledger';

test('ledger - calculateNetBalances', () => {
  const expenses: Expense[] = [
    {
      id: '1',
      payer: '@alice',
      amount: '300',
      coinId: 'UCT',
      participants: ['@alice', '@bob', '@charlie'],
      memo: 'lunch',
      sourceMessageId: 'm1',
      timestamp: 1,
    },
    {
      id: '2',
      payer: '@bob',
      amount: '150',
      coinId: 'UCT',
      participants: ['@alice', '@bob'],
      memo: 'drinks',
      sourceMessageId: 'm2',
      timestamp: 2,
    }
  ];

  const balance = calculateNetBalances(expenses);
  
  // exp 1: Alice +300. Alice -100, Bob -100, Charlie -100 => A: 200, B: -100, C: -100
  // exp 2: Bob +150. Alice -75, Bob -75 => A: -75, B: 75
  // Total: Alice: 125, Bob: -25, Charlie: -100
  assert.strictEqual(balance['@alice'], 125);
  assert.strictEqual(balance['@bob'], -25);
  assert.strictEqual(balance['@charlie'], -100);
});

test('ledger - computeSettlements', () => {
  const balance = {
    '@alice': 125,
    '@bob': -25,
    '@charlie': -100
  };

  const settlements = computeSettlements(balance);
  
  // Bob owes 25, Charlie owes 100. Alice is owed 125.
  // Debtors: Charlie (100), Bob (25)
  // Creditors: Alice (125)
  assert.strictEqual(settlements.length, 2);
  
  // They should be matched with Alice
  assert.deepStrictEqual(settlements[0], {
    from: '@charlie',
    to: '@alice',
    amount: '100',
    status: 'pending'
  });
  
  assert.deepStrictEqual(settlements[1], {
    from: '@bob',
    to: '@alice',
    amount: '25',
    status: 'pending'
  });
});
