/**
 * Backfill Old PTPs to Redis Queue
 * 
 * Yeh script sabhi 'pending' PTPs ko database se uthayegi
 * aur unko naye Redis (Upstash) ke job queue mein add kar degi
 * unki promised date ke hisaab se.
 * 
 * Run with: node scratch/backfill_redis.js
 */

const fs = require('fs');
const path = require('path');

// Read .env natively without dotenv
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
const { Queue } = require('bullmq');
const Redis = require('ioredis');

const prisma = new PrismaClient();

// 1. Setup Redis Connection from .env
const redisUrl = process.env.REDIS_URL || process.env.KV_URL;
if (!redisUrl) {
  console.error('❌ REDIS_URL not found in .env');
  process.exit(1);
}
const redisClient = new Redis(redisUrl, {
  maxRetriesPerRequest: null,
});

// 2. Setup BullMQ Queue
const QUEUE_NAME = 'ptp-queue';
const ptpQueue = new Queue(QUEUE_NAME, { connection: redisClient });

function msUntilPTPDate(ptpDateStr) {
  if (!ptpDateStr) return 0;
  const [year, month, day] = ptpDateStr.split('-').map(Number);
  // 12:00 AM IST = 18:30 UTC of the PREVIOUS calendar day
  const fireAtUTC = Date.UTC(year, month - 1, day, 18, 30, 0);
  const delay = fireAtUTC - Date.now();
  return delay > 0 ? delay : 0;
}

async function backfill() {
  console.log('\n=============================================');
  console.log('🔄 Backfilling Old Pending PTPs to Redis...');
  console.log('=============================================\n');

  try {
    // A. Find all pending PTPs in database
    const pendingPtps = await prisma.pTP.findMany({
      where: { status: 'pending' },
      select: { id: true, date: true }
    });

    console.log(`📦 Found ${pendingPtps.length} 'pending' PTPs in database.\n`);

    if (pendingPtps.length === 0) {
      console.log('✨ No pending PTPs to backfill.');
      process.exit(0);
    }

    let queuedCount = 0;

    // B. Add each one to Redis Queue
    for (const ptp of pendingPtps) {
      if (!ptp.date) continue;

      const delayMs = msUntilPTPDate(ptp.date);
      const delayDays = (delayMs / (1000 * 60 * 60 * 24)).toFixed(1);
      
      const jobId = `ptp-${ptp.id}`; // same format as new ones

      await ptpQueue.add(
        'check-single-ptp',
        { ptpId: ptp.id },
        {
          delay: delayMs,
          jobId: jobId, // prevents duplicates if script runs twice
          removeOnComplete: true,
          removeOnFail: { count: 3 }
        }
      );

      // Audit tracking in Redis
      await redisClient.set(
        `ptp:${ptp.id}:scheduled`,
        JSON.stringify({ ptpId: ptp.id, ptpDate: ptp.date, scheduledAt: new Date().toISOString(), delayMs, isBackfill: true }),
        'EX', 30 * 24 * 3600 // 30 days
      );

      console.log(`✅ Queued PTP #${ptp.id} (Date: ${ptp.date}) — Fires in ${delayDays} days`);
      queuedCount++;
    }

    console.log(`\n🎉 Success! Added ${queuedCount} old PTPs to the new Redis Queue.`);

  } catch (error) {
    console.error('\n💥 Backfill Failed:', error.message);
  } finally {
    await prisma.$disconnect();
    await redisClient.quit();
    process.exit(0);
  }
}

backfill();
