const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function checkSpecificAccount() {
  const accountNo = '100000000075803';
  console.log(`\n🔍 Searching for PTPs related to Account: ${accountNo}...\n`);

  try {
    const ptps = await prisma.pTP.findMany({
      where: {
        customer: {
          account_no: accountNo
        }
      },
      orderBy: { id: 'desc' },
      include: { customer: { select: { name: true, account_no: true } } }
    });

    if (ptps.length === 0) {
      console.log('❌ Is account ka koi PTP nahi mila.');
      return;
    }

    ptps.forEach(ptp => {
      console.log(`📌 ID: ${ptp.id} | Date: ${ptp.date} | Status: ${ptp.status.toUpperCase()} | Remarks: ${ptp.remarks}`);
    });

    const pending = ptps.filter(p => p.status === 'pending');
    if (pending.length > 0) {
      console.log('\n⏳ Is account ke PTPs abhi bhi PENDING hain.');
      console.log('Iska matlab background worker unhe pick nahi kar raha hai.');
    }

  } catch (err) {
    console.error('Error:', err);
  } finally {
    await prisma.$disconnect();
  }
}

checkSpecificAccount();
