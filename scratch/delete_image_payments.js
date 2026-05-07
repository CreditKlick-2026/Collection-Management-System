const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function run() {
  try {
    const res = await prisma.payment.deleteMany({
      where: {
        ref: 'REF_TEST_123'
      }
    });
    console.log(`Successfully deleted ${res.count} test payments from the image.`);
  } catch (e) {
    console.error(e);
  } finally {
    await prisma.$disconnect();
  }
}

run();
