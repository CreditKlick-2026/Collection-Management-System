const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  const users = await prisma.user.findMany();
  console.log("All users:", users.map(u => ({ id: u.id, name: u.name, role: u.role })));

  const userId = users[0].id;
  
  // What happens when we filter by user
  let where = {};
  where.userId = userId;

  const logs = await prisma.auditLog.findMany({ where });
  console.log(`Logs for user ${userId}:`, logs.length);
}

main().finally(() => prisma.$disconnect());
