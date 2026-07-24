import { prisma } from "./prisma";
import { computeNetBalances, pairwiseBalances, simplifyDebts } from "./balances";

export async function getGroupsForUser(userId: string) {
  const memberships = await prisma.member.findMany({
    where: { userId },
    include: { group: true },
  });

  const groups = await Promise.all(
    memberships.map(async (m) => {
      const summary = await getGroupBalanceSummary(m.groupId, m.id);
      return { ...m.group, myMemberId: m.id, myNet: summary.netByMember.get(m.id) ?? 0 };
    })
  );

  return groups.sort((a, b) => a.name.localeCompare(b.name));
}

export async function getGroupBalanceSummary(groupId: string, viewerMemberId?: string) {
  const [members, expenses, settlements] = await Promise.all([
    prisma.member.findMany({ where: { groupId } }),
    prisma.expense.findMany({
      where: { groupId },
      include: { splits: true },
    }),
    prisma.settlement.findMany({ where: { groupId } }),
  ]);

  const netByMember = computeNetBalances(
    members.map((m) => ({ memberId: m.id })),
    expenses.map((e) => ({
      paidByMemberId: e.paidByMemberId,
      convertedAmount: e.convertedAmount,
      splits: e.splits.map((s) => ({ memberId: s.memberId, amount: s.amount })),
    })),
    settlements.map((s) => ({
      fromMemberId: s.fromMemberId,
      toMemberId: s.toMemberId,
      amount: s.amount,
    }))
  );

  const suggestedPayments = simplifyDebts(netByMember);
  const pairwise = pairwiseBalances(
    expenses.map((e) => ({
      paidByMemberId: e.paidByMemberId,
      convertedAmount: e.convertedAmount,
      splits: e.splits.map((s) => ({ memberId: s.memberId, amount: s.amount })),
    })),
    settlements.map((s) => ({
      fromMemberId: s.fromMemberId,
      toMemberId: s.toMemberId,
      amount: s.amount,
    }))
  );

  const totalSpent = expenses.reduce((sum, e) => sum + e.convertedAmount, 0);

  const viewerPaid = viewerMemberId
    ? expenses.filter((e) => e.paidByMemberId === viewerMemberId).reduce((s, e) => s + e.convertedAmount, 0)
    : 0;
  const viewerShare = viewerMemberId
    ? expenses.reduce(
        (s, e) => s + (e.splits.find((sp) => sp.memberId === viewerMemberId)?.amount ?? 0),
        0
      )
    : 0;

  return {
    members,
    expenseCount: expenses.length,
    settlementCount: settlements.length,
    totalSpent,
    netByMember,
    suggestedPayments,
    pairwise,
    viewerPaid,
    viewerShare,
  };
}

export type ActivityItem =
  | {
      kind: "expense";
      id: string;
      description: string;
      date: Date;
      categoryIcon: string | null;
      originalCurrency: string;
      originalAmount: number;
      convertedAmount: number;
      splitType: string;
      paidByMemberId: string;
      paidByName: string;
      splits: { memberId: string; memberName: string; amount: number }[];
    }
  | {
      kind: "settlement";
      id: string;
      date: Date;
      amount: number;
      currency: string;
      fromMemberId: string;
      fromName: string;
      toMemberId: string;
      toName: string;
    };

export async function getGroupActivity(groupId: string): Promise<ActivityItem[]> {
  const [expenses, settlements] = await Promise.all([
    prisma.expense.findMany({
      where: { groupId },
      include: { category: true, paidByMember: true, splits: { include: { member: true } } },
      orderBy: { date: "desc" },
    }),
    prisma.settlement.findMany({
      where: { groupId },
      include: { fromMember: true, toMember: true },
      orderBy: { date: "desc" },
    }),
  ]);

  const items: ActivityItem[] = [
    ...expenses.map((e): ActivityItem => ({
      kind: "expense",
      id: e.id,
      description: e.description,
      date: e.date,
      categoryIcon: e.category?.icon ?? null,
      originalCurrency: e.originalCurrency,
      originalAmount: e.originalAmount,
      convertedAmount: e.convertedAmount,
      splitType: e.splitType,
      paidByMemberId: e.paidByMemberId,
      paidByName: e.paidByMember.name,
      splits: e.splits.map((s) => ({ memberId: s.memberId, memberName: s.member.name, amount: s.amount })),
    })),
    ...settlements.map((s): ActivityItem => ({
      kind: "settlement",
      id: s.id,
      date: s.date,
      amount: s.amount,
      currency: s.currency,
      fromMemberId: s.fromMemberId,
      fromName: s.fromMember.name,
      toMemberId: s.toMemberId,
      toName: s.toMember.name,
    })),
  ];

  items.sort((a, b) => b.date.getTime() - a.date.getTime());
  return items;
}
