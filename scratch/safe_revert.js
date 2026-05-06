const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function run() {
  try {
    console.log('🔄 Reverting column name in database...');
    // Rename payment_received back to dpd (Data safe)
    await prisma.$executeRawUnsafe('ALTER TABLE "Customer" RENAME COLUMN "payment_received" TO "dpd";');
    
    console.log('🔄 Reverting column type to Integer...');
    // Change type from Double Precision back to Integer
    await prisma.$executeRawUnsafe('ALTER TABLE "Customer" ALTER COLUMN "dpd" TYPE INTEGER;');
    
    // Update LeadColumn entry back to dpd
    const existing = await prisma.leadColumn.findUnique({ where: { key: 'payment_received' } });
    if (existing) {
      await prisma.leadColumn.update({
        where: { key: 'payment_received' },
        data: { key: 'dpd', label: 'DPD', type: 'text' }
      });
      console.log('✅ LeadColumn table record reverted.');
    }

    console.log('✅ Success! System reverted to DPD safely without data loss.');
  } catch (e) {
    if (e.message.includes('does not exist')) {
      console.log('ℹ️ Column already reverted or not found.');
    } else {
      console.error('❌ Error:', e.message);
    }
  } finally {
    await prisma.$disconnect();
  }
}
run();
