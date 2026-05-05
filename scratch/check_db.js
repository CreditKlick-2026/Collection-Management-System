const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function checkMayLeads() {
  const startDate = new Date(Date.UTC(2026, 4, 1));
  const endDate = new Date(Date.UTC(2026, 5, 1));

  console.log(`Checking leads for May 2026 (${startDate.toISOString()} to ${endDate.toISOString()})`);

  const customers = await prisma.customer.findMany({
    where: { createdAt: { gte: startDate, lt: endDate } },
    include: {
      _count: {
        select: { payments: true }
      },
      payments: {
        select: { id: true, status: true }
      }
    }
  });

  console.log(`Found ${customers.length} customers:`);
  customers.forEach(c => {
    console.log(`- ID: ${c.id}, Account: ${c.account_no}, Payments: ${c._count.payments}`);
    if (c._count.payments > 0) {
      c.payments.forEach(p => console.log(`  - Payment ID: ${p.id}, Status: ${p.status}`));
    }
  });

  await prisma.$disconnect();
}

checkMayLeads();
