import { notFound, redirect } from "next/navigation";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { getGroupActivity, getGroupBalanceSummary } from "@/lib/data";
import { AvatarStack } from "@/components/Avatar";
import { AddExpenseModal } from "@/components/AddExpenseModal";
import { SettleUpModal } from "@/components/SettleUpModal";
import { AddMemberModal } from "@/components/AddMemberModal";
import { ActivityRow } from "@/components/ActivityRow";
import { ActivityFilters } from "@/components/ActivityFilters";
import { BalanceSidebar } from "@/components/BalanceSidebar";
import { CategoryBreakdown } from "@/components/CategoryBreakdown";
import { DeleteGroupModal } from "@/components/DeleteGroupModal";
import { formatMoney } from "@/lib/money";
import {
  createExpenseAction,
  recordSettlementAction,
  addMemberAction,
  deleteGroupAction,
  updateExpenseAction,
  deleteExpenseAction,
} from "./actions";

export default async function GroupPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const { id: groupId } = await params;
  const sp = await searchParams;

  const session = await auth();
  if (!session?.user) redirect("/login");

  const group = await prisma.group.findUnique({ where: { id: groupId } });
  if (!group) notFound();

  const myMembership = await prisma.member.findFirst({ where: { groupId, userId: session.user.id } });
  if (!myMembership) notFound();

  const categories = await prisma.category.findMany({ where: { groupId } });
  const [summary, activity] = await Promise.all([
    getGroupBalanceSummary(groupId, myMembership.id),
    getGroupActivity(groupId),
  ]);

  const categoryFilter = typeof sp.category === "string" ? sp.category : "";
  const memberFilter = typeof sp.member === "string" ? sp.member : "";
  const fromFilter = typeof sp.from === "string" && sp.from ? new Date(sp.from) : null;
  const toFilter = typeof sp.to === "string" && sp.to ? new Date(sp.to) : null;

  const expenseCategoryMap = new Map(
    (await prisma.expense.findMany({ where: { groupId }, select: { id: true, categoryId: true } })).map((e) => [
      e.id,
      e.categoryId,
    ])
  );

  const visibleActivity = activity.filter((item) => {
    if (fromFilter && item.date < fromFilter) return false;
    if (toFilter && item.date > new Date(toFilter.getTime() + 86400000 - 1)) return false;
    if (memberFilter) {
      if (item.kind === "expense") {
        if (!item.splits.some((s) => s.memberId === memberFilter) && item.paidByMemberId !== memberFilter) return false;
      } else if (item.fromMemberId !== memberFilter && item.toMemberId !== memberFilter) return false;
    }
    if (categoryFilter && item.kind === "expense" && expenseCategoryMap.get(item.id) !== categoryFilter) return false;
    return true;
  });

  const members = summary.members.map((m) => ({ id: m.id, name: m.name, avatarColor: m.avatarColor }));

  const netByMember = summary.members
    .map((m) => ({ memberId: m.id, name: m.name, avatarColor: m.avatarColor, net: summary.netByMember.get(m.id) ?? 0 }))
    .sort((a, b) => b.net - a.net);

  const memberById = new Map(summary.members.map((m) => [m.id, m]));
  const suggestedPayments = summary.suggestedPayments.map((p) => ({
    fromMemberId: p.fromMemberId,
    fromName: memberById.get(p.fromMemberId)?.name ?? "",
    fromColor: memberById.get(p.fromMemberId)?.avatarColor ?? "#888",
    toMemberId: p.toMemberId,
    toName: memberById.get(p.toMemberId)?.name ?? "",
    toColor: memberById.get(p.toMemberId)?.avatarColor ?? "#888",
    amount: p.amount,
  }));

  // Category spend breakdown (all-time, not affected by activity filters)
  const expensesForBreakdown = await prisma.expense.findMany({
    where: { groupId },
    include: { category: true },
  });
  const breakdownMap = new Map<string, number>();
  for (const e of expensesForBreakdown) {
    const key = e.category?.name ?? "Uncategorized";
    breakdownMap.set(key, (breakdownMap.get(key) ?? 0) + e.convertedAmount);
  }
  const breakdown = Array.from(breakdownMap.entries()).map(([name, amount]) => ({ name, amount }));

  const boundCreateExpense = createExpenseAction.bind(null, groupId);
  const boundRecordSettlement = recordSettlementAction.bind(null, groupId);
  const boundAddMember = addMemberAction.bind(null, groupId);
  const boundDeleteGroup = deleteGroupAction.bind(null, groupId);

  return (
    <div className="mx-auto max-w-6xl px-4 py-6 pt-16 md:px-8 md:pt-8">
      <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <h1 className="text-2xl font-semibold">{group.name}</h1>
          {group.description && <p className="mt-1 text-sm text-[var(--muted)]">{group.description}</p>}
        </div>
        <div className="flex items-center gap-2">
          <SettleUpModal members={members} currency={group.defaultCurrency} action={boundRecordSettlement} />
          <AddExpenseModal
            members={members}
            categories={categories}
            defaultCurrency={group.defaultCurrency}
            action={boundCreateExpense}
          />
          <DeleteGroupModal groupName={group.name} action={boundDeleteGroup} />
        </div>
      </div>

      <div className="card mb-6 flex flex-wrap items-center gap-6 px-5 py-4 text-sm">
        <div>
          <div className="text-xs text-[var(--muted-2)]">Total spent</div>
          <div className="font-semibold">{formatMoney(summary.totalSpent, group.defaultCurrency)}</div>
        </div>
        <div className="h-8 w-px bg-[var(--border)]" />
        <div>
          <div className="text-xs text-[var(--muted-2)]">Expenses</div>
          <div className="font-semibold">{summary.expenseCount}</div>
        </div>
        <div className="h-8 w-px bg-[var(--border)]" />
        <div className="flex items-center gap-2">
          <AvatarStack members={members} />
          <span className="text-[var(--muted)]">{members.length} members</span>
          <AddMemberModal action={boundAddMember} />
        </div>
      </div>

      <div className="flex flex-col gap-6 lg:flex-row">
        <div className="min-w-0 flex-1 space-y-4">
          <div className="flex items-center justify-between">
            <ActivityFilters categories={categories} members={members} />
            <span className="text-xs text-[var(--muted-2)]">{visibleActivity.length} items</span>
          </div>

          <div className="card divide-y divide-[var(--border-subtle)] p-2">
            {visibleActivity.length === 0 ? (
              <div className="p-8 text-center text-sm text-[var(--muted)]">
                No activity yet. Add your first expense to get started.
              </div>
            ) : (
              visibleActivity.map((item) => (
                <ActivityRow
                  key={`${item.kind}-${item.id}`}
                  item={item}
                  defaultCurrency={group.defaultCurrency}
                  members={members}
                  categories={categories}
                  updateAction={updateExpenseAction}
                  deleteAction={deleteExpenseAction}
                />
              ))
            )}
          </div>

          <CategoryBreakdown data={breakdown} currency={group.defaultCurrency} />
        </div>

        <BalanceSidebar
          members={members}
          myMemberId={myMembership.id}
          myNet={summary.netByMember.get(myMembership.id) ?? 0}
          myPaid={summary.viewerPaid}
          myShare={summary.viewerShare}
          currency={group.defaultCurrency}
          suggestedPayments={suggestedPayments}
          netByMember={netByMember}
          settleAction={boundRecordSettlement}
        />
      </div>
    </div>
  );
}
