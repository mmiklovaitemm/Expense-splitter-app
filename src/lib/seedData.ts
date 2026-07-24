import { prisma } from "./prisma";
import { computeSplits, toMinorUnits, isZeroDecimal } from "./money";

const AVATAR_COLORS = {
  purple: "#a855f7",
  orange: "#f97316",
  pink: "#ec4899",
  teal: "#14b8a6",
  blue: "#3b82f6",
  yellow: "#eab308",
};

const DAY = 24 * 60 * 60 * 1000;
function daysAgo(n: number) {
  return new Date(Date.now() - n * DAY);
}

/**
 * Populates demo groups/expenses for a given user, who is inserted as a real
 * member ("Alex Chen") alongside three shadow members with no account. Used
 * both for `prisma db seed` and for provisioning a fresh guest session.
 */
export async function createDemoDataForUser(userId: string, userName: string) {
  // --- Trip to Japan -------------------------------------------------
  const japan = await prisma.group.create({
    data: {
      name: "Trip to Japan",
      description: "Two weeks in Tokyo, Kyoto, and Osaka. Cherry blossom season.",
      defaultCurrency: "USD",
      icon: "plane",
    },
  });

  const [you, jordan, sam, taylor] = await Promise.all([
    prisma.member.create({
      data: { groupId: japan.id, userId, name: userName, avatarColor: AVATAR_COLORS.purple },
    }),
    prisma.member.create({
      data: { groupId: japan.id, name: "Jordan Park", avatarColor: AVATAR_COLORS.orange },
    }),
    prisma.member.create({
      data: { groupId: japan.id, name: "Sam Rivera", avatarColor: AVATAR_COLORS.pink },
    }),
    prisma.member.create({
      data: { groupId: japan.id, name: "Taylor Kim", avatarColor: AVATAR_COLORS.teal },
    }),
  ]);

  const [food, transport, lodging, activities, shopping] = await Promise.all(
    [
      { name: "Food & Drink", icon: "utensils" },
      { name: "Transport", icon: "train" },
      { name: "Lodging", icon: "bed" },
      { name: "Activities", icon: "ticket" },
      { name: "Shopping", icon: "shopping-bag" },
    ].map((c) => prisma.category.create({ data: { groupId: japan.id, ...c } }))
  );

  const all = [you, jordan, sam, taylor];

  async function addExpense(opts: {
    description: string;
    categoryId: string;
    currency: string;
    amountMajor: number;
    paidBy: (typeof all)[number];
    splitType: "EQUAL" | "EXACT" | "PERCENT" | "SHARES";
    participants: { member: (typeof all)[number]; value?: number }[];
    daysAgoNum: number;
  }) {
    const originalAmount = toMinorUnits(opts.amountMajor, opts.currency);
    // Demo data stays in USD or has a fixed illustrative rate so seeding never
    // depends on a live network call.
    const rate = opts.currency === "USD" ? 1 : opts.currency === "JPY" ? 0.0067 : 1.08;
    const fromScale = isZeroDecimal(opts.currency) ? 1 : 100;
    const toScale = isZeroDecimal(japan.defaultCurrency) ? 1 : 100;
    const convertedAmount =
      opts.currency === japan.defaultCurrency
        ? originalAmount
        : Math.round((originalAmount / fromScale) * rate * toScale);

    const splits = computeSplits(
      opts.splitType,
      convertedAmount,
      opts.participants.map((p) => ({ memberId: p.member.id, value: p.value }))
    );

    await prisma.expense.create({
      data: {
        groupId: japan.id,
        description: opts.description,
        categoryId: opts.categoryId,
        date: daysAgo(opts.daysAgoNum),
        originalCurrency: opts.currency,
        originalAmount,
        convertedAmount,
        exchangeRate: rate,
        splitType: opts.splitType,
        paidByMemberId: opts.paidBy.id,
        paidByUserId: opts.paidBy.id === you.id ? userId : null,
        splits: {
          create: splits.map((s) => ({
            memberId: s.memberId,
            amount: s.amount,
            percent: s.percent,
            shares: s.shares,
          })),
        },
      },
    });
  }

  await addExpense({
    description: "Shinkansen Kyoto to Osaka",
    categoryId: transport.id,
    currency: "JPY",
    amountMajor: 5700,
    paidBy: you,
    splitType: "EQUAL",
    participants: all.map((m) => ({ member: m })),
    daysAgoNum: 1,
  });
  await addExpense({
    description: "Don Quijote shopping haul",
    categoryId: shopping.id,
    currency: "JPY",
    amountMajor: 18750,
    paidBy: sam,
    splitType: "EXACT",
    participants: [
      { member: you, value: toMinorUnits(6000, "JPY") },
      { member: jordan, value: toMinorUnits(4250, "JPY") },
      { member: sam, value: toMinorUnits(3500, "JPY") },
      { member: taylor, value: toMinorUnits(5000, "JPY") },
    ],
    daysAgoNum: 2,
  });
  await addExpense({
    description: "Osaka street food tour",
    categoryId: food.id,
    currency: "JPY",
    amountMajor: 28000,
    paidBy: taylor,
    splitType: "EQUAL",
    participants: all.map((m) => ({ member: m })),
    daysAgoNum: 2,
  });
  await addExpense({
    description: "Izakaya dinner in Dotonbori",
    categoryId: food.id,
    currency: "JPY",
    amountMajor: 42600,
    paidBy: jordan,
    splitType: "SHARES",
    participants: [
      { member: you, value: 2 },
      { member: jordan, value: 1 },
      { member: sam, value: 1 },
      { member: taylor, value: 2 },
    ],
    daysAgoNum: 3,
  });
  await addExpense({
    description: "Osaka Castle entry",
    categoryId: activities.id,
    currency: "JPY",
    amountMajor: 2400,
    paidBy: jordan,
    splitType: "EQUAL",
    participants: all.map((m) => ({ member: m })),
    daysAgoNum: 3,
  });
  await addExpense({
    description: "Convenience store runs (accumulated)",
    categoryId: food.id,
    currency: "JPY",
    amountMajor: 8340,
    paidBy: sam,
    splitType: "EQUAL",
    participants: all.map((m) => ({ member: m })),
    daysAgoNum: 4,
  });
  await addExpense({
    description: "Ryokan stay in Kyoto",
    categoryId: lodging.id,
    currency: "USD",
    amountMajor: 640,
    paidBy: you,
    splitType: "EQUAL",
    participants: all.map((m) => ({ member: m })),
    daysAgoNum: 6,
  });
  await addExpense({
    description: "Fushimi Inari + lunch",
    categoryId: activities.id,
    currency: "JPY",
    amountMajor: 6200,
    paidBy: taylor,
    splitType: "PERCENT",
    participants: [
      { member: you, value: 25 },
      { member: jordan, value: 25 },
      { member: sam, value: 25 },
      { member: taylor, value: 25 },
    ],
    daysAgoNum: 7,
  });
  await addExpense({
    description: "JR Pass (7-day)",
    categoryId: transport.id,
    currency: "USD",
    amountMajor: 900,
    paidBy: jordan,
    splitType: "EQUAL",
    participants: all.map((m) => ({ member: m })),
    daysAgoNum: 9,
  });
  await addExpense({
    description: "Tokyo Airbnb (4 nights)",
    categoryId: lodging.id,
    currency: "USD",
    amountMajor: 1120,
    paidBy: you,
    splitType: "EQUAL",
    participants: all.map((m) => ({ member: m })),
    daysAgoNum: 12,
  });
  await addExpense({
    description: "Ramen at Ichiran",
    categoryId: food.id,
    currency: "JPY",
    amountMajor: 5700,
    paidBy: sam,
    splitType: "EQUAL",
    participants: all.map((m) => ({ member: m })),
    daysAgoNum: 13,
  });
  await addExpense({
    description: "teamLab Planets tickets",
    categoryId: activities.id,
    currency: "JPY",
    amountMajor: 15600,
    paidBy: you,
    splitType: "EQUAL",
    participants: all.map((m) => ({ member: m })),
    daysAgoNum: 13,
  });
  await addExpense({
    description: "Airport limousine bus",
    categoryId: transport.id,
    currency: "JPY",
    amountMajor: 3600,
    paidBy: taylor,
    splitType: "EQUAL",
    participants: all.map((m) => ({ member: m })),
    daysAgoNum: 14,
  });

  await prisma.settlement.create({
    data: {
      groupId: japan.id,
      fromMemberId: sam.id,
      toMemberId: taylor.id,
      amount: toMinorUnits(56.4, "USD"),
      currency: "USD",
      date: daysAgo(0.5),
    },
  });
  await prisma.settlement.create({
    data: {
      groupId: japan.id,
      fromMemberId: jordan.id,
      toMemberId: you.id,
      fromUserId: null,
      toUserId: userId,
      amount: toMinorUnits(150, "USD"),
      currency: "USD",
      date: daysAgo(2),
    },
  });

  // --- Apartment 4B ----------------------------------------------------
  const apt = await prisma.group.create({
    data: { name: "Apartment 4B", defaultCurrency: "USD", icon: "home" },
  });
  const [aptYou, riley, morgan] = await Promise.all([
    prisma.member.create({ data: { groupId: apt.id, userId, name: userName, avatarColor: AVATAR_COLORS.purple } }),
    prisma.member.create({ data: { groupId: apt.id, name: "Riley Nguyen", avatarColor: AVATAR_COLORS.blue } }),
    prisma.member.create({ data: { groupId: apt.id, name: "Morgan Lee", avatarColor: AVATAR_COLORS.yellow } }),
  ]);
  const aptUtilities = await prisma.category.create({ data: { groupId: apt.id, name: "Utilities", icon: "zap" } });
  const aptRent = await prisma.category.create({ data: { groupId: apt.id, name: "Rent", icon: "home" } });

  for (const [desc, amount, catId, payer, daysBack] of [
    ["March rent", 2400, aptRent.id, aptYou, 20],
    ["Electric bill", 118.5, aptUtilities.id, riley, 15],
    ["Internet", 65, aptUtilities.id, morgan, 15],
    ["Water bill", 42.3, aptUtilities.id, aptYou, 10],
  ] as const) {
    const originalAmount = toMinorUnits(amount as number, "USD");
    const splits = computeSplits("EQUAL", originalAmount, [aptYou, riley, morgan].map((m) => ({ memberId: m.id })));
    await prisma.expense.create({
      data: {
        groupId: apt.id,
        description: desc as string,
        categoryId: catId as string,
        date: daysAgo(daysBack as number),
        originalCurrency: "USD",
        originalAmount,
        convertedAmount: originalAmount,
        exchangeRate: 1,
        splitType: "EQUAL",
        paidByMemberId: (payer as typeof aptYou).id,
        paidByUserId: (payer as typeof aptYou).id === aptYou.id ? userId : null,
        splits: { create: splits.map((s) => ({ memberId: s.memberId, amount: s.amount })) },
      },
    });
  }

  // --- Office Lunch Crew -------------------------------------------------
  const lunch = await prisma.group.create({
    data: { name: "Office Lunch Crew", defaultCurrency: "USD", icon: "utensils" },
  });
  const [lunchYou, priya, dev] = await Promise.all([
    prisma.member.create({ data: { groupId: lunch.id, userId, name: userName, avatarColor: AVATAR_COLORS.purple } }),
    prisma.member.create({ data: { groupId: lunch.id, name: "Priya Patel", avatarColor: AVATAR_COLORS.pink } }),
    prisma.member.create({ data: { groupId: lunch.id, name: "Dev Osei", avatarColor: AVATAR_COLORS.teal } }),
  ]);
  const lunchCat = await prisma.category.create({ data: { groupId: lunch.id, name: "Food & Drink", icon: "utensils" } });
  const lunchAmount = toMinorUnits(58.5, "USD");
  const lunchSplits = computeSplits("EQUAL", lunchAmount, [lunchYou, priya, dev].map((m) => ({ memberId: m.id })));
  await prisma.expense.create({
    data: {
      groupId: lunch.id,
      description: "Thai food Friday",
      categoryId: lunchCat.id,
      date: daysAgo(1),
      originalCurrency: "USD",
      originalAmount: lunchAmount,
      convertedAmount: lunchAmount,
      exchangeRate: 1,
      splitType: "EQUAL",
      paidByMemberId: priya.id,
      splits: { create: lunchSplits.map((s) => ({ memberId: s.memberId, amount: s.amount })) },
    },
  });

  // --- Sarah's Birthday Present (empty/settled group) ----------------
  const bday = await prisma.group.create({
    data: { name: "Sarah's Birthday Present", defaultCurrency: "USD", icon: "gift" },
  });
  await Promise.all([
    prisma.member.create({ data: { groupId: bday.id, userId, name: userName, avatarColor: AVATAR_COLORS.purple } }),
    prisma.member.create({ data: { groupId: bday.id, name: "Casey Brooks", avatarColor: AVATAR_COLORS.orange } }),
  ]);

  // --- Camping Weekend ----------------------------------------------
  const camp = await prisma.group.create({
    data: { name: "Camping Weekend", defaultCurrency: "USD", icon: "tent" },
  });
  const [campYou, jamie] = await Promise.all([
    prisma.member.create({ data: { groupId: camp.id, userId, name: userName, avatarColor: AVATAR_COLORS.purple } }),
    prisma.member.create({ data: { groupId: camp.id, name: "Jamie Fox", avatarColor: AVATAR_COLORS.blue } }),
  ]);
  const campCat = await prisma.category.create({ data: { groupId: camp.id, name: "Supplies", icon: "shopping-bag" } });
  const campAmount = toMinorUnits(355.58, "USD");
  const campSplits = computeSplits("EQUAL", campAmount, [campYou, jamie].map((m) => ({ memberId: m.id })));
  await prisma.expense.create({
    data: {
      groupId: camp.id,
      description: "Campsite + gear rental",
      categoryId: campCat.id,
      date: daysAgo(5),
      originalCurrency: "USD",
      originalAmount: campAmount,
      convertedAmount: campAmount,
      exchangeRate: 1,
      splitType: "EQUAL",
      paidByMemberId: campYou.id,
      paidByUserId: userId,
      splits: { create: campSplits.map((s) => ({ memberId: s.memberId, amount: s.amount })) },
    },
  });

  return { groupIds: [japan.id, apt.id, lunch.id, bday.id, camp.id] };
}
