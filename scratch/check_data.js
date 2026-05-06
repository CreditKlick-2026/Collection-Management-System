const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function run() {
  const count = await prisma.customer.count();
  console.log('Total customers:', count);
  
  if (count > 0) {
    const sample = await prisma.customer.findMany({ take: 5, select: { id: true, dpd: true } });
    console.log('Sample DPD data:', JSON.stringify(sample));
  }
  await prisma.$disconnect();
}
run();
