const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  try {
    console.log('Testing DB connection...');
    const count = await prisma.masterList.count();
    console.log('MasterList count:', count);
    const lists = await prisma.masterList.findMany();
    console.log('MasterList data:', JSON.stringify(lists, null, 2));
  } catch (e) {
    console.error('DB ERROR:', e);
  } finally {
    await prisma.$disconnect();
  }
}

main();
