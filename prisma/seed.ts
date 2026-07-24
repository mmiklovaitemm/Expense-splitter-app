import { prisma } from "../src/lib/prisma";
import { createDemoDataForUser } from "../src/lib/seedData";

async function main() {
  await prisma.expenseSplit.deleteMany();
  await prisma.settlement.deleteMany();
  await prisma.expense.deleteMany();
  await prisma.category.deleteMany();
  await prisma.member.deleteMany();
  await prisma.group.deleteMany();
  await prisma.user.deleteMany();

  const demoUser = await prisma.user.create({
    data: { name: "Alex Chen", email: "demo@example.com", isGuest: false },
  });

  await createDemoDataForUser(demoUser.id, demoUser.name);

  console.log(`Seeded demo data for user ${demoUser.id} (${demoUser.email})`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
