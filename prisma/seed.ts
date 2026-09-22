import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

const SEED_USERS = [
  { name: "Alice", email: "alice@ajaia.test" },
  { name: "Bob", email: "bob@ajaia.test" },
  { name: "Carol", email: "carol@ajaia.test" },
];

async function main() {
  for (const user of SEED_USERS) {
    await prisma.user.upsert({
      where: { email: user.email },
      update: { name: user.name },
      create: user,
    });
  }

  const total = await prisma.user.count();
  console.log(`Seeded ${SEED_USERS.length} users. Total users: ${total}.`);
}

main()
  .catch((error) => {
    console.error(error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
