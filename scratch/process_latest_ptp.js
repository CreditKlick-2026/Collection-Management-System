const { PrismaClient } = require('@prisma/client');
const { Queue } = require('bullmq');
const Redis = require('ioredis');
const prisma = new PrismaClient();

// Load REDIS_URL from .env
const fs = require('fs');
const path = require('path');
const envPath = path.resolve(process.cwd(), '.env');
let redisUrl = 'redis://localhost:6379';
if (fs.existsSync(envPath)) {
  const envConfig = fs.readFileSync(envPath, 'utf8');
  envConfig.split('\n').forEach(line => {
    const match = line.match(/^REDIS_URL=(.*)$/);
    if (match) redisUrl = match[1].trim().replace(/^"|"$/g, '');
  });
}

const redisConnection = new Redis(redisUrl, { maxRetriesPerRequest: null });

async function processLatest() {
  try {
    // 1. Find the latest PTP for Vikram Singh Rathore
    const ptp = await prisma.pTP.findFirst({
      where: {
        customer: { account_no: '100000000075803' }
      },
      orderBy: { createdAt: 'desc' }
    });

    if (!ptp) {
      console.log('❌ No PTP found for this customer.');
      return;
    }

    console.log(`🎯 Found Latest PTP (ID: ${ptp.id}) with Date: ${ptp.date}`);

    // 2. Add to BullMQ queue
    const ptpQueue = new Queue('ptp-queue', { connection: redisConnection });
    await ptpQueue.add('check-ptp', { ptpId: ptp.id }, { 
      jobId: `test-check-${ptp.id}-${Date.now()}` 
    });

    console.log(`✅ PTP #${ptp.id} added to 'ptp-queue' for processing.`);
    console.log('⏳ Worker will now check it and mark it BROKEN since the date is in the past.');

  } catch (error) {
    console.error('❌ Error:', error.message);
  } finally {
    await prisma.$disconnect();
    await redisConnection.disconnect();
  }
}

processLatest();
