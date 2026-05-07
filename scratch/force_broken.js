const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function forceBroken() {
  try {
    // 1. Find the PTP for Vikram Singh Rathore
    const ptp = await prisma.pTP.findFirst({
      where: {
        customer: { account_no: '100000000075803' },
        status: { not: 'paid' }
      },
      orderBy: { createdAt: 'desc' }
    });

    if (!ptp) {
      console.log('❌ No active PTP found for this customer.');
      return;
    }

    console.log(`🎯 Found PTP (ID: ${ptp.id}). Forcing to BROKEN...`);

    // 2. Update to Broken and set recoveryStatus to pending
    await prisma.pTP.update({
      where: { id: ptp.id },
      data: { 
        status: 'broken',
        transferStatus: 'escalated',
        recoveryStatus: 'pending', // Ensure this is set
        remarks: ptp.remarks + '\n[Manual-Force] Marked broken for testing.'
      }
    });

    console.log(`✅ Success! PTP #${ptp.id} is now BROKEN and Recovery is PENDING.`);
    console.log('Refresh your dashboard now.');

  } catch (error) {
    console.error('❌ Error:', error.message);
  } finally {
    await prisma.$disconnect();
  }
}

forceBroken();
