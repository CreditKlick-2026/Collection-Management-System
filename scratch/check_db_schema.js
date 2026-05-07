const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function check() {
  try {
    const ptp = await prisma.pTP.findFirst();
    console.log('Columns in PTP table:', Object.keys(ptp || {}));
    if (ptp && 'recoveryStatus' in ptp) {
      console.log('✅ recoveryStatus column exists.');
    } else {
      console.log('❌ recoveryStatus column is MISSING! Please run npx prisma db push');
    }
  } catch (e) {
    console.error('Error checking DB:', e.message);
  } finally {
    await prisma.$disconnect();
  }
}

check();
