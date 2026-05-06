import { Worker } from 'bullmq';
import { redisConnection } from '../lib/redis';
import prisma from '../lib/prisma';

console.log('-------------------------------------------');
console.log('[Worker] PTP Background System Active');
console.log('-------------------------------------------');

const worker = new Worker('ptp-queue', async (job) => {
  if (job.name === 'check-overdue-ptps') {
    const todayStr = new Date().toISOString().split('T')[0];
    console.log(`[Job] Running PTP check for date: ${todayStr}`);

    const overduePtps = await prisma.pTP.findMany({
      where: { 
        status: 'pending',
        date: { lt: todayStr } 
      }
    });

    console.log(`[Job] Found ${overduePtps.length} overdue PTPs to process.`);

    for (const ptp of overduePtps) {
      // Logic: Check if payment exists
      const payment = await prisma.payment.findFirst({
        where: { 
            customerId: ptp.customerId, 
            status: 'cleared',
            date: { gte: ptp.date }
        }
      });

      if (payment) {
        await prisma.pTP.update({
          where: { id: ptp.id },
          data: { 
              status: 'paid',
              remarks: (ptp.remarks || '') + `\n[Auto] Verified via Payment ID ${payment.id}`
          }
        });
        console.log(`[Kept] PTP ${ptp.id} - Customer ${ptp.customerId}`);
      } else {
        // Auto-Broken & Auto-Escalate
        await prisma.pTP.update({
          where: { id: ptp.id },
          data: { 
            status: 'broken',
            transferStatus: 'escalated',
            remarks: (ptp.remarks || '') + '\n[Auto-Broken] No payment tracked. Escalated.'
          }
        });
        console.log(`[Broken] PTP ${ptp.id} - Escalated to Manager.`);
      }
    }
  }
}, { 
  connection: redisConnection,
  concurrency: 5 // Process 5 PTPs in parallel
});

worker.on('completed', (job) => {
  console.log(`[Completed] Job ${job.id} finished successfully.`);
});

worker.on('failed', (job, err) => {
  console.error(`[Failed] Job ${job?.id} failed with error: ${err.message}`);
});
