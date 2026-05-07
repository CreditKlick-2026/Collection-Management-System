const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function debug() {
  try {
    // 1. Find customer by account number
    const customer = await prisma.customer.findFirst({
      where: { account_no: '100000000075803' }
    });

    if (!customer) {
      console.log('❌ Customer not found');
      return;
    }

    console.log(`Found Customer: ${customer.name} (ID: ${customer.id})`);

    // 2. Find all PTPs for this customer
    const ptps = await prisma.pTP.findMany({
      where: { customerId: customer.id },
      orderBy: { createdAt: 'desc' }
    });

    console.log(`Total PTPs found: ${ptps.length}`);
    ptps.forEach(p => {
      console.log(`ID: ${p.id}, Status: ${p.status}, RecoveryStatus: ${p.recoveryStatus}, Created: ${p.createdAt}`);
    });

  } catch (e) {
    console.error('Debug failed:', e.message);
  } finally {
    await prisma.$disconnect();
  }
}

debug();
