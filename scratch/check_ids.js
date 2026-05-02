const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  try {
    const users = await prisma.user.findMany({ select: { id: true, name: true, role: true } });
    console.log("USERS:", JSON.stringify(users, null, 2));

    const settlements = await prisma.settlement.findMany({ 
      take: 5,
      include: { customer: true, agent: true }
    });
    console.log("RECENT SETTLEMENTS:", JSON.stringify(settlements, null, 2));
  } catch (e) {
    console.error("DEBUG ERROR:", e);
  } finally {
    await prisma.$disconnect();
  }
}

main();
