const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function run() {
  try {
    console.log('🔄 Renaming column in database...');
    // Rename dpd to payment_received (Data safe)
    await prisma.$executeRawUnsafe('ALTER TABLE "Customer" RENAME COLUMN "dpd" TO "payment_received";');
    
    console.log('🔄 Updating column type to Double Precision...');
    // Change type from Integer to Double Precision (Float)
    await prisma.$executeRawUnsafe('ALTER TABLE "Customer" ALTER COLUMN "payment_received" TYPE DOUBLE PRECISION;');
    
    console.log('✅ Success! Column renamed and type updated without any data loss.');
  } catch (e) {
    if (e.message.includes('already exists')) {
      console.log('ℹ️ payment_received column already exists.');
    } else if (e.message.includes('does not exist')) {
      console.log('⚠️ Column "dpd" not found. It might have been renamed already.');
    } else {
      console.error('❌ Error:', e.message);
    }
  } finally {
    await prisma.$disconnect();
  }
}
run();
