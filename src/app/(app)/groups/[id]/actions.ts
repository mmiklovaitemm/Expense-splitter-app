"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { computeSplits, toMinorUnits, validateSplitInputs, type SplitType } from "@/lib/money";
import { convertAmount } from "@/lib/exchangeRate";

async function requireMembership(groupId: string) {
  const session = await auth();
  if (!session?.user) throw new Error("Not authenticated");
  const member = await prisma.member.findFirst({ where: { groupId, userId: session.user.id } });
  if (!member) throw new Error("Not a member of this group");
  return { session, member };
}

async function buildExpenseData(groupId: string, formData: FormData) {
  const group = await prisma.group.findUniqueOrThrow({ where: { id: groupId } });

  const description = String(formData.get("description") ?? "").trim();
  const currency = String(formData.get("currency") ?? group.defaultCurrency);
  const amountMajor = parseFloat(String(formData.get("amount") ?? "0"));
  const categoryId = String(formData.get("categoryId") ?? "") || null;
  const dateStr = String(formData.get("date") ?? "");
  const paidByMemberId = String(formData.get("paidByMemberId") ?? "");
  const splitType = String(formData.get("splitType") ?? "EQUAL") as SplitType;
  const participantIds = formData.getAll("participantId").map(String);
  const values = formData.getAll("participantValue").map((v) => parseFloat(String(v)));

  if (!description) throw new Error("Description is required");
  if (!amountMajor || amountMajor <= 0) throw new Error("Enter a valid amount");
  if (!paidByMemberId) throw new Error("Select who paid");

  const originalAmount = toMinorUnits(amountMajor, currency);

  let convertedAmount = originalAmount;
  let rate = 1;
  if (currency !== group.defaultCurrency) {
    const converted = await convertAmount(originalAmount, currency, group.defaultCurrency);
    convertedAmount = converted.convertedMinor;
    rate = converted.rate;
  }

  const participants = participantIds.map((memberId, i) => ({
    memberId,
    value: splitType === "EQUAL" ? undefined : values[i],
  }));

  const validation = validateSplitInputs(
    splitType,
    convertedAmount,
    splitType === "EXACT"
      ? participants.map((p) => ({ ...p, value: p.value != null ? toMinorUnits(p.value, group.defaultCurrency) : 0 }))
      : participants
  );
  if (!validation.valid) throw new Error(validation.error);

  const splits = computeSplits(
    splitType,
    convertedAmount,
    splitType === "EXACT"
      ? participants.map((p) => ({ ...p, value: p.value != null ? toMinorUnits(p.value, group.defaultCurrency) : 0 }))
      : participants
  );

  return {
    description,
    categoryId,
    date: dateStr ? new Date(dateStr) : new Date(),
    originalCurrency: currency,
    originalAmount,
    convertedAmount,
    exchangeRate: rate,
    splitType,
    paidByMemberId,
    splits,
  };
}

export async function createExpenseAction(groupId: string, formData: FormData) {
  await requireMembership(groupId);
  const data = await buildExpenseData(groupId, formData);

  await prisma.expense.create({
    data: {
      groupId,
      description: data.description,
      categoryId: data.categoryId,
      date: data.date,
      originalCurrency: data.originalCurrency,
      originalAmount: data.originalAmount,
      convertedAmount: data.convertedAmount,
      exchangeRate: data.exchangeRate,
      splitType: data.splitType,
      paidByMemberId: data.paidByMemberId,
      splits: {
        create: data.splits.map((s) => ({ memberId: s.memberId, amount: s.amount, percent: s.percent, shares: s.shares })),
      },
    },
  });

  revalidatePath(`/groups/${groupId}`);
}

export async function updateExpenseAction(expenseId: string, formData: FormData) {
  const expense = await prisma.expense.findUniqueOrThrow({ where: { id: expenseId } });
  await requireMembership(expense.groupId);
  const data = await buildExpenseData(expense.groupId, formData);

  await prisma.$transaction([
    prisma.expenseSplit.deleteMany({ where: { expenseId } }),
    prisma.expense.update({
      where: { id: expenseId },
      data: {
        description: data.description,
        categoryId: data.categoryId,
        date: data.date,
        originalCurrency: data.originalCurrency,
        originalAmount: data.originalAmount,
        convertedAmount: data.convertedAmount,
        exchangeRate: data.exchangeRate,
        splitType: data.splitType,
        paidByMemberId: data.paidByMemberId,
        splits: {
          create: data.splits.map((s) => ({ memberId: s.memberId, amount: s.amount, percent: s.percent, shares: s.shares })),
        },
      },
    }),
  ]);

  revalidatePath(`/groups/${expense.groupId}`);
}

export async function deleteExpenseAction(expenseId: string) {
  const expense = await prisma.expense.findUniqueOrThrow({ where: { id: expenseId } });
  await requireMembership(expense.groupId);

  await prisma.expense.delete({ where: { id: expenseId } });
  revalidatePath(`/groups/${expense.groupId}`);
}

export async function recordSettlementAction(groupId: string, formData: FormData) {
  await requireMembership(groupId);
  const group = await prisma.group.findUniqueOrThrow({ where: { id: groupId } });

  const fromMemberId = String(formData.get("fromMemberId") ?? "");
  const toMemberId = String(formData.get("toMemberId") ?? "");
  const amountMajor = parseFloat(String(formData.get("amount") ?? "0"));
  const note = String(formData.get("note") ?? "") || null;

  if (!fromMemberId || !toMemberId || fromMemberId === toMemberId) {
    throw new Error("Select two different people");
  }
  if (!amountMajor || amountMajor <= 0) throw new Error("Enter a valid amount");

  await prisma.settlement.create({
    data: {
      groupId,
      fromMemberId,
      toMemberId,
      amount: toMinorUnits(amountMajor, group.defaultCurrency),
      currency: group.defaultCurrency,
      note,
    },
  });

  revalidatePath(`/groups/${groupId}`);
}

export async function addMemberAction(groupId: string, formData: FormData) {
  await requireMembership(groupId);
  const name = String(formData.get("name") ?? "").trim();
  const includeInPastExpenses = formData.get("includeInPastExpenses") === "true";
  if (!name) throw new Error("Name is required");

  const colors = ["#a855f7", "#f97316", "#ec4899", "#14b8a6", "#3b82f6", "#eab308", "#ef4444", "#22c55e"];
  const color = colors[Math.floor(Math.random() * colors.length)];

  const existingMembers = await prisma.member.findMany({ where: { groupId }, select: { id: true } });
  const existingMemberIds = new Set(existingMembers.map((m) => m.id));

  const newMember = await prisma.member.create({ data: { groupId, name, avatarColor: color } });

  if (includeInPastExpenses) {
    const equalExpenses = await prisma.expense.findMany({
      where: { groupId, splitType: "EQUAL" },
      include: { splits: true },
    });

    // Only touch expenses that were split across every member who existed at
    // the time (i.e. "split with everyone"), not ones deliberately split
    // with just a subset — those stay exactly as they were entered.
    for (const expense of equalExpenses) {
      const splitMemberIds = new Set(expense.splits.map((s) => s.memberId));
      const coversEveryone =
        splitMemberIds.size === existingMemberIds.size && [...existingMemberIds].every((id) => splitMemberIds.has(id));
      if (!coversEveryone) continue;

      const newSplits = computeSplits("EQUAL", expense.convertedAmount, [
        ...expense.splits.map((s) => ({ memberId: s.memberId })),
        { memberId: newMember.id },
      ]);

      await prisma.$transaction([
        prisma.expenseSplit.deleteMany({ where: { expenseId: expense.id } }),
        prisma.expenseSplit.createMany({
          data: newSplits.map((s) => ({ expenseId: expense.id, memberId: s.memberId, amount: s.amount })),
        }),
      ]);
    }
  }

  revalidatePath(`/groups/${groupId}`);
}

export async function createGroupAction(formData: FormData) {
  const session = await auth();
  if (!session?.user) throw new Error("Not authenticated");

  const name = String(formData.get("name") ?? "").trim();
  const defaultCurrency = String(formData.get("defaultCurrency") ?? "USD");
  const memberNames = String(formData.get("memberNames") ?? "")
    .split(",")
    .map((s) => s.trim())
    .filter(Boolean);

  if (!name) throw new Error("Group name is required");

  const colors = ["#a855f7", "#f97316", "#ec4899", "#14b8a6", "#3b82f6", "#eab308"];

  const group = await prisma.group.create({
    data: {
      name,
      defaultCurrency,
      members: {
        create: [
          { userId: session.user.id, name: session.user.name ?? "You", avatarColor: colors[0] },
          ...memberNames.map((n, i) => ({ name: n, avatarColor: colors[(i + 1) % colors.length] })),
        ],
      },
      categories: {
        create: [
          { name: "Food & Drink", icon: "utensils" },
          { name: "Transport", icon: "train" },
          { name: "Lodging", icon: "bed" },
          { name: "Activities", icon: "ticket" },
          { name: "Shopping", icon: "shopping-bag" },
          { name: "Utilities", icon: "zap" },
        ],
      },
    },
  });

  redirect(`/groups/${group.id}`);
}

export async function deleteGroupAction(groupId: string) {
  const { session } = await requireMembership(groupId);

  // Member is referenced by Expense.paidByMemberId, ExpenseSplit.memberId,
  // and Settlement.from/toMemberId with ON DELETE RESTRICT, so members can't
  // be removed while any of those still point at them. Delete everything in
  // dependency order ourselves rather than relying on Group's cascade to
  // sort it out.
  await prisma.$transaction([
    prisma.expenseSplit.deleteMany({ where: { expense: { groupId } } }),
    prisma.expense.deleteMany({ where: { groupId } }),
    prisma.settlement.deleteMany({ where: { groupId } }),
    prisma.member.deleteMany({ where: { groupId } }),
    prisma.category.deleteMany({ where: { groupId } }),
    prisma.group.delete({ where: { id: groupId } }),
  ]);

  const nextGroup = await prisma.member.findFirst({
    where: { userId: session.user.id },
    orderBy: { createdAt: "asc" },
  });

  redirect(nextGroup ? `/groups/${nextGroup.groupId}` : "/groups/new");
}
