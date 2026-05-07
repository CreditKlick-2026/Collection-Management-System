const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function check() {
  const ptp = await prisma.pTP.findUnique({
    where: { id: 60 }
  });
  console.log(`PTP ID 60 Status: ${ptp?.status}, Recovery: ${ptp?.recoveryStatus}`);
  await prisma.$disconnect();
}
check();
