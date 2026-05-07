const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function check() {
  try {
    const ptps = await prisma.pTP.findMany({
      where: {
        customer: { account_no: '100000000075803' }
      },
      orderBy: { createdAt: 'desc' }
    });

    console.log(`Found ${ptps.length} PTPs for Vikram Singh Rathore:`);
    ptps.forEach(p => {
      console.log(`- ID: ${p.id}, CustomerID: ${p.customerId}, Status: ${p.status}, RecoveryStatus: ${p.recoveryStatus}`);
    });

  } catch (e) {
    console.log('Error:', e.message);
  } finally {
    await prisma.$disconnect();
  }
}

check();
