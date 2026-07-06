export type Expense = {
  id: string;
  payer: string;          // nametag, e.g. "@alice"
  amount: string;         // base units (string, e.g. "300")
  coinId: string;         // "UCT"
  participants: string[]; // everyone who shares the cost, including payer if applicable
  memo: string;
  sourceMessageId: string;
  timestamp: number;
};

export type Balance = Record<string, number>; // nametag -> net balance (positive = gets paid, negative = owes)

export type SettlementInstruction = {
  from: string;
  to: string;
  amount: string;
  status: "pending" | "requested" | "reminded" | "paid";
};

/**
 * Calculates net balances for all participants based on a list of expenses.
 */
export function calculateNetBalances(expenses: Expense[]): Balance {
  const balance: Balance = {};

  for (const exp of expenses) {
    const amount = parseFloat(exp.amount);
    if (isNaN(amount) || amount <= 0) continue;
    
    const count = exp.participants.length;
    if (count === 0) continue;

    const splitAmount = amount / count;

    if (!balance[exp.payer]) balance[exp.payer] = 0;
    balance[exp.payer] += amount;

    for (const p of exp.participants) {
      if (!balance[p]) balance[p] = 0;
      balance[p] -= splitAmount;
    }
  }

  // Clean up floating point artifacts
  for (const key in balance) {
    balance[key] = Math.round(balance[key] * 1e6) / 1e6;
    if (Math.abs(balance[key]) < 1e-6) {
      delete balance[key];
    }
  }

  return balance;
}

/**
 * Uses a greedy min-cash-flow algorithm to determine the minimum number
 * of settlement transactions to clear all debts.
 */
export function computeSettlements(balance: Balance, minThreshold = 0.01): SettlementInstruction[] {
  const debtors: { p: string; amt: number }[] = [];
  const creditors: { p: string; amt: number }[] = [];

  for (const [p, bal] of Object.entries(balance)) {
    if (bal < -1e-6) debtors.push({ p, amt: -bal });
    else if (bal > 1e-6) creditors.push({ p, amt: bal });
  }

  // Sort descending to match largest debtor with largest creditor
  debtors.sort((a, b) => b.amt - a.amt);
  creditors.sort((a, b) => b.amt - a.amt);

  let i = 0;
  let j = 0;
  const settlements: SettlementInstruction[] = [];

  while (i < debtors.length && j < creditors.length) {
    const debtor = debtors[i];
    const creditor = creditors[j];

    const amountToSettle = Math.min(debtor.amt, creditor.amt);

    if (amountToSettle >= minThreshold) {
      // Format number to string, removing trailing zeroes after decimal
      let amtStr = amountToSettle.toFixed(6);
      if (amtStr.includes('.')) {
        amtStr = amtStr.replace(/0+$/, '').replace(/\.$/, '');
      }
      
      settlements.push({
        from: debtor.p,
        to: creditor.p,
        amount: amtStr,
        status: "pending",
      });
    }

    debtor.amt -= amountToSettle;
    creditor.amt -= amountToSettle;

    // Clean up floating points
    debtor.amt = Math.round(debtor.amt * 1e6) / 1e6;
    creditor.amt = Math.round(creditor.amt * 1e6) / 1e6;

    if (debtor.amt <= 1e-6) i++;
    if (creditor.amt <= 1e-6) j++;
  }

  return settlements;
}
