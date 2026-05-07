const { PrismaClient } = require('@prisma/client');
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

const redis = new Redis(redisUrl);

async function cleanup() {
  const accountNo = '100000000075803';
  
  try {
    console.log(`🧹 Starting cleanup for Account: ${accountNo}`);

    // 1. Find Customer
    const customer = await prisma.customer.findFirst({
      where: { account_no: accountNo }
    });

    if (!customer) {
      console.log('❌ Customer not found. Nothing to clean.');
      return;
    }

    const customerId = customer.id;
    console.log(`👤 Found Customer: ${customer.name} (ID: ${customerId})`);

    // 2. Delete PTPs
    const deletedPtps = await prisma.pTP.deleteMany({
      where: { customerId }
    });
    console.log(`✅ Deleted ${deletedPtps.count} PTP records from Database.`);

    // 3. Clear Redis Data
    // Clear call logs cache
    const callLogKeys = await redis.keys(`call-logs:${customerId}*`);
    if (callLogKeys.length > 0) {
      await redis.del(...callLogKeys);
      console.log(`✅ Cleared ${callLogKeys.length} call-log keys from Redis.`);
    }

    // Clear PTP notifications for today
    const today = new Date().toISOString().split('T')[0];
    await redis.del(`notifs:ptp:${today}`);
    console.log(`✅ Cleared PTP notifications for today (${today}).`);

    console.log('\n✨ Cleanup complete! You can now start a fresh test.');

  } catch (error) {
    console.error('❌ Cleanup failed:', error.message);
  } finally {
    await prisma.$disconnect();
    await redis.disconnect();
  }
}

cleanup();
