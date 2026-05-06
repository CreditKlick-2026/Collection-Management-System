const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function run() {
  try {
    // Delete test payments with ref TEST-REF-001
    const deleted = await prisma.payment.deleteMany({
      where: {
        ref: 'TEST-REF-001'
      }
    });
    console.log(`✅ Deleted ${deleted.count} test payment(s) with ref TEST-REF-001`);
  } catch (e) {
    console.error('❌ Error:', e.message);
  } finally {
    await prisma.$disconnect();
  }
}
run();
