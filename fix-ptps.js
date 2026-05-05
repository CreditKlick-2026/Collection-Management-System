const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  console.log("Fetching PTPs...");
  const ptps = await prisma.pTP.findMany({
    where: { 
      OR: [
        { voc: '' },
        { voc: null }
      ]
    }
  });

  console.log(`Found ${ptps.length} PTP records with empty VOC. Processing...`);
  let updatedCount = 0;

  for (const ptp of ptps) {
    const audit = await prisma.auditLog.findFirst({
      where: {
        entityId: String(ptp.customerId),
        action: 'LEAD_DISPOSITION',
      },
      orderBy: { timestamp: 'desc' }
    });

    if (audit && audit.details) {
      const details = audit.details;
      if (details.subDisposition) {
        await prisma.pTP.update({
          where: { id: ptp.id },
          data: { voc: details.subDisposition }
        });
        updatedCount++;
      }
    }
  }

  console.log(`Successfully updated ${updatedCount} PTP records with subDisposition!`);
}

main()
  .catch(e => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
