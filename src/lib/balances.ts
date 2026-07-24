// Net-balance and debt-simplification math. All amounts are integer minor
// units in the group's default currency.

export interface BalanceInput {
  memberId: string;
}

export interface ExpenseForBalance {
  paidByMemberId: string;
  convertedAmount: number;
  splits: { memberId: string; amount: number }[];
}

export interface SettlementForBalance {
  fromMemberId: string;
  toMemberId: string;
  amount: number;
}

/**
 * Net balance per member: positive = they are owed money, negative = they owe.
 * Computed by replaying every expense (payer credited, each split debited)
 * and every settlement (payer's debt reduced, payee's credit reduced) rather
 * than storing a running total, so it can never drift out of sync.
 */
export function computeNetBalances(
  members: BalanceInput[],
  expenses: ExpenseForBalance[],
  settlements: SettlementForBalance[]
): Map<string, number> {
  const balances = new Map<string, number>();
  for (const m of members) balances.set(m.memberId, 0);

  for (const expense of expenses) {
    balances.set(
      expense.paidByMemberId,
      (balances.get(expense.paidByMemberId) ?? 0) + expense.convertedAmount
    );
    for (const split of expense.splits) {
      balances.set(split.memberId, (balances.get(split.memberId) ?? 0) - split.amount);
    }
  }

  for (const s of settlements) {
    // Payer (fromMember) reduces their debt; payee (toMember) reduces their credit.
    balances.set(s.fromMemberId, (balances.get(s.fromMemberId) ?? 0) + s.amount);
    balances.set(s.toMemberId, (balances.get(s.toMemberId) ?? 0) - s.amount);
  }

  return balances;
}

export interface SuggestedPayment {
  fromMemberId: string;
  toMemberId: string;
  amount: number;
}

/**
 * Greedy debt simplification: repeatedly match the largest debtor with the
 * largest creditor. This does not always find the mathematically minimal
 * number of transactions in every edge case, but it's optimal for the
 * common case and runs in O(n log n) with no exponential search.
 */
export function simplifyDebts(netBalances: Map<string, number>): SuggestedPayment[] {
  const creditors: { memberId: string; amount: number }[] = [];
  const debtors: { memberId: string; amount: number }[] = [];

  for (const [memberId, balance] of netBalances) {
    const rounded = Math.round(balance);
    if (rounded > 0) creditors.push({ memberId, amount: rounded });
    else if (rounded < 0) debtors.push({ memberId, amount: -rounded });
  }

  creditors.sort((a, b) => b.amount - a.amount);
  debtors.sort((a, b) => b.amount - a.amount);

  const payments: SuggestedPayment[] = [];
  let ci = 0;
  let di = 0;

  while (ci < creditors.length && di < debtors.length) {
    const creditor = creditors[ci];
    const debtor = debtors[di];
    const amount = Math.min(creditor.amount, debtor.amount);

    if (amount > 0) {
      payments.push({ fromMemberId: debtor.memberId, toMemberId: creditor.memberId, amount });
    }

    creditor.amount -= amount;
    debtor.amount -= amount;

    if (creditor.amount === 0) ci++;
    if (debtor.amount === 0) di++;
  }

  return payments;
}

/** All pairwise net amounts (not simplified), for a "who owes whom" detail view. */
export function pairwiseBalances(
  expenses: ExpenseForBalance[],
  settlements: SettlementForBalance[]
): Map<string, number> {
  // key: `${owesMemberId}->${owedMemberId}`
  const pair = new Map<string, number>();
  const add = (from: string, to: string, amount: number) => {
    if (from === to || amount === 0) return;
    pair.set(`${from}->${to}`, (pair.get(`${from}->${to}`) ?? 0) + amount);
  };

  for (const expense of expenses) {
    for (const split of expense.splits) {
      if (split.memberId === expense.paidByMemberId) continue;
      add(split.memberId, expense.paidByMemberId, split.amount);
    }
  }

  for (const s of settlements) {
    add(s.toMemberId, s.fromMemberId, s.amount);
  }

  // Net out reciprocal pairs (A owes B and B owes A simultaneously).
  const netted = new Map<string, number>();
  const seen = new Set<string>();
  for (const [key, amount] of pair) {
    if (seen.has(key)) continue;
    const [from, to] = key.split("->");
    const reverseKey = `${to}->${from}`;
    const reverseAmount = pair.get(reverseKey) ?? 0;
    seen.add(key);
    seen.add(reverseKey);
    const net = amount - reverseAmount;
    if (net > 0) netted.set(key, net);
    else if (net < 0) netted.set(reverseKey, -net);
  }

  return netted;
}
