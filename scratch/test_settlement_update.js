const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  try {
    const s = await prisma.settlement.findFirst();
    if (!s) {
      console.log("No settlement found to test with.");
      return;
    }
    console.log("Testing update on settlement ID:", s.id);
    const updated = await prisma.settlement.update({
      where: { id: s.id },
      data: {
        status: s.status, // just set it to what it already is
      }
    });
    console.log("Update successful:", updated.id);
  } catch (e) {
    console.error("Update failed:", e);
  } finally {
    await prisma.$disconnect();
  }
}

main();
