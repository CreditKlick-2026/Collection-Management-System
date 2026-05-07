const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function forceBroken() {
  const ptpId = 63; // ID from your last command
  console.log(`🔨 Manually marking PTP ${ptpId} as BROKEN...`);

  try {
    const updated = await prisma.pTP.update({
      where: { id: ptpId },
      data: {
        status: 'broken',
        transferStatus: 'escalated',
        recoveryStatus: 'pending',
        lastActionAt: new Date()
      }
    });
    console.log(`✅ Success! PTP ${ptpId} is now BROKEN and PENDING for recovery.`);
  } catch (e) {
    console.log(`❌ Error: ${e.message}`);
  } finally {
    await prisma.$disconnect();
  }
}

forceBroken();
