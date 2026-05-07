/**
 * Manual PTP Worker Debugger
 * Yeh script worker ko manual start karegi taaki hum live logs dekh sakein.
 */

const fs = require('fs');
const path = require('path');

// 1. Manually load .env
const envPath = path.resolve(process.cwd(), '.env');
if (fs.existsSync(envPath)) {
  const envConfig = fs.readFileSync(envPath, 'utf8');
  envConfig.split('\n').forEach(line => {
    const match = line.match(/^([^=]+)=(.*)$/);
    if (match) {
      const key = match[1].trim();
      let value = match[2].trim();
      if (value.startsWith('"') && value.endsWith('"')) value = value.slice(1, -1);
      process.env[key] = value;
    }
  });
}

const { PrismaClient } = require('@prisma/client');
const { Worker, Queue } = require('bullmq');
const Redis = require('ioredis');

const prisma = new PrismaClient();
const redisUrl = process.env.REDIS_URL;
const redisClient = new Redis(redisUrl, { maxRetriesPerRequest: null });

async function debugWorker() {
  console.log('\n🚀 Starting Manual PTP Worker Debugger...');
  console.log(`📡 Connected to Redis: ${redisUrl.split('@')[1]}`);

  const worker = new Worker('ptp-queue', async (job) => {
    const { ptpId } = job.data;
    console.log(`\n📦 [Job ${job.id}] Processing PTP ID: ${ptpId}...`);

    try {
      const ptp = await prisma.pTP.findUnique({ where: { id: ptpId } });
      if (!ptp || ptp.status !== 'pending') {
        console.log(`⚠️  PTP ${ptpId} is not pending or not found. Skipping.`);
        return;
      }

      console.log(`🔍 Checking payments for Customer ${ptp.customerId} around ${ptp.date}...`);
      
      const payment = await prisma.payment.findFirst({
        where: {
          customerId: ptp.customerId,
          status: 'cleared',
          amount: { gte: ptp.amount - 1, lte: ptp.amount + 1 }, // Flexible match
          date: ptp.date
        }
      });

      if (payment) {
        console.log(`✅ Payment found (ID: ${payment.id}). Marking as PAID.`);
        await prisma.pTP.update({
          where: { id: ptpId },
          data: { status: 'paid', remarks: `${ptp.remarks}\n[Auto] Marked paid via Payment #${payment.id}` }
        });
      } else {
        console.log(`❌ No payment found. Marking as BROKEN.`);
        await prisma.pTP.update({
          where: { id: ptpId },
          data: { 
            status: 'broken', 
            transferStatus: 'escalated',
            remarks: `${ptp.remarks}\n[Auto-Broken] No matching payment found on ${ptp.date}` 
          }
        });
      }
      console.log(`🎯 PTP ${ptpId} processed successfully.`);

    } catch (err) {
      console.error(`💥 Error processing PTP ${ptpId}:`, err.message);
      throw err;
    }
  }, { connection: redisClient });

  worker.on('completed', (job) => console.log(`✨ Job ${job.id} completed!`));
  worker.on('failed', (job, err) => console.error(`❌ Job ${job.id} failed:`, err.message));

  console.log('\n👀 Listening for jobs... (Press Ctrl+C to stop)');

  // Also trigger a quick check for the specific ID 50 by adding it manually to the queue
  const queue = new Queue('ptp-queue', { connection: redisClient });
  console.log('\n➕ Manually adding PTP ID 50 to queue for immediate test...');
  await queue.add('debug-ptp-50', { ptpId: 50 }, { jobId: `debug-ptp-50-${Date.now()}` });
}

debugWorker();
