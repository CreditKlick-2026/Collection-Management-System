import { Queue } from 'bullmq';
import { redisConnection } from './redis';

export const ptpQueue = new Queue('ptp-queue', {
  connection: redisConnection as any,
});

export const initPtpCron = async () => {
  const repeatableJobs = await ptpQueue.getRepeatableJobs();
  for (const job of repeatableJobs) {
    await ptpQueue.removeRepeatableByKey(job.key);
  }

  await ptpQueue.add('check-overdue-ptps', {}, {
    repeat: {
      pattern: '0 0 * * *', // Daily at midnight
    }
  });
  
  console.log('[Queue] PTP Daily Cron Initialized.');
};
