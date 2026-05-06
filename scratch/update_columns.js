const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function run() {
  try {
    console.log('🔄 Updating LeadColumn table...');
    
    // 1. Check if 'dpd' exists and rename it
    const dpdCol = await prisma.leadColumn.findUnique({ where: { key: 'dpd' } });
    if (dpdCol) {
      await prisma.leadColumn.update({
        where: { key: 'dpd' },
        data: { key: 'payment_received', label: 'Payment Received', type: 'amount' }
      });
      console.log('✅ Updated "dpd" to "payment_received" in LeadColumn table.');
    } else {
      console.log('ℹ️ Column "dpd" not found (already renamed?).');
    }

    // 2. Double check if 'payment_received' exists
    const payCol = await prisma.leadColumn.findUnique({ where: { key: 'payment_received' } });
    if (payCol && (payCol.label !== 'Payment Received' || payCol.type !== 'amount')) {
      await prisma.leadColumn.update({
        where: { key: 'payment_received' },
        data: { label: 'Payment Received', type: 'amount' }
      });
      console.log('✅ Updated label/type for "payment_received".');
    }

  } catch (e) {
    console.error('❌ Error:', e.message);
  } finally {
    await prisma.$disconnect();
  }
}
run();
