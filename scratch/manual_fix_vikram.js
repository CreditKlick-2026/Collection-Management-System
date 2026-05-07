const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function fix() {
  try {
    const accountNo = '100000000075803';
    
    // 1. Find the customer
    const customer = await prisma.customer.findUnique({
      where: { account_no: accountNo }
    });

    if (!customer) {
      console.log('❌ Customer not found!');
      return;
    }

    console.log(`👤 Found Customer: ${customer.name} (ID: ${customer.id})`);

    // 2. Mark all non-paid PTPs as RECOVERED
    const result = await prisma.pTP.updateMany({
      where: {
        customerId: customer.id,
        status: { notIn: ['paid', 'kept'] },
        recoveryStatus: { not: 'recovered' }
      },
      data: {
        recoveryStatus: 'recovered',
        recoveryRemarks: 'Manually recovered via diagnostic fix script.',
        lastActionAt: new Date()
      }
    });

    console.log(`✅ Successfully recovered ${result.count} PTP records!`);

  } catch (e) {
    console.log('❌ Error:', e.message);
  } finally {
    await prisma.$disconnect();
  }
}

fix();
