const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function checkLatestPTP() {
  console.log('\n====================================');
  console.log('🔍 Checking Latest PTP Status');
  console.log('====================================\n');

  try {
    const latestPtp = await prisma.pTP.findFirst({
      orderBy: { id: 'desc' },
      include: { customer: { select: { name: true, account_no: true } } }
    });

    if (!latestPtp) {
      console.log('❌ Koi PTP nahi mila.');
      return;
    }

    console.log(`📌 PTP ID: ${latestPtp.id}`);
    console.log(`👤 Customer: ${latestPtp.customer?.name} (${latestPtp.customer?.account_no})`);
    console.log(`💰 Amount: ₹${latestPtp.amount}`);
    console.log(`📅 Promised Date: ${latestPtp.date}`);
    console.log(`\n🚦 CURRENT STATUS:  ${latestPtp.status.toUpperCase()}`);
    console.log(`📝 Remarks / Log:   ${latestPtp.remarks}`);
    console.log(`🔥 Transfer Status: ${latestPtp.transfer_status || 'None'}`);

    if (latestPtp.status === 'broken') {
      console.log('\n✅ BACKGROUND WORKER NE ISKO SUCCESSFULLY "BROKEN" MARK KAR DIYA HAI!');
    } else if (latestPtp.status === 'paid') {
      console.log('\n✅ BACKGROUND WORKER NE ISKO SUCCESSFULLY "PAID" MARK KAR DIYA HAI!');
    } else {
      console.log('\n⏳ Yeh abhi bhi "Pending" hai. (Redis queue me wait kar raha hai)');
    }

  } catch (err) {
    console.error('Error:', err);
  } finally {
    await prisma.$disconnect();
  }
}

checkLatestPTP();
