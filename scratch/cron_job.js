const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  try {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const todayStr = today.toISOString().split('T')[0];

    console.log(`[Cron] Starting PTP check for dates before ${todayStr}...`);

    const pendingPtps = await prisma.pTP.findMany({
      where: { status: 'pending' }
    });

    console.log(`[Cron] Found ${pendingPtps.length} pending PTPs to verify.`);

    let brokenCount = 0;
    let paidCount = 0;

    for (const ptp of pendingPtps) {
      const ptpDate = new Date(ptp.date);
      
      if (ptpDate < today) {
        // Check for payment
        const payment = await prisma.payment.findFirst({
          where: {
            customerId: ptp.customerId,
            status: 'cleared',
            date: { gte: ptp.date }
          }
        });

        if (!payment) {
          await prisma.pTP.update({
            where: { id: ptp.id },
            data: { 
              status: 'broken',
              remarks: (ptp.remarks || '') + ' [System: Auto-marked as broken]'
            }
          });
          brokenCount++;
        } else {
          await prisma.pTP.update({
            where: { id: ptp.id },
            data: { 
              status: 'paid',
              remarks: (ptp.remarks || '') + ` [System: Auto-marked as paid via Payment ID ${payment.id}]`
            }
          });
          paidCount++;
        }
      }
    }

    console.log(`[Cron Finished]`);
    console.log(`- Marked Broken: ${brokenCount}`);
    console.log(`- Marked Paid: ${paidCount}`);

  } catch (error) {
    console.error('[Cron Error]', error);
  } finally {
    await prisma.$disconnect();
  }
}

main();
