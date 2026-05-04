const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function wipeDatabase() {
  console.log("⚠️ Starting database wipe (keeping Users, Portfolios, LeadColumns, MasterLists)...");

  try {
    // 1. Delete dependent records first (to prevent foreign key constraint errors)
    console.log("Deleting Payments...");
    await prisma.payment.deleteMany({});
    
    console.log("Deleting PTPs...");
    await prisma.pTP.deleteMany({});
    
    console.log("Deleting Disputes...");
    await prisma.dispute.deleteMany({});
    
    console.log("Deleting Settlements...");
    await prisma.settlement.deleteMany({});
    
    console.log("Deleting Audit Logs...");
    await prisma.auditLog.deleteMany({});

    // 2. Delete main customer records
    console.log("Deleting Customers...");
    const customerDeleteResult = await prisma.customer.deleteMany({});
    console.log(`  -> Deleted ${customerDeleteResult.count} customers`);

    // 3. Delete bulk upload job history
    console.log("Deleting Bulk Upload Jobs...");
    await prisma.bulkUploadJob.deleteMany({});

    console.log("\n✅ Database wipe complete! The database is now fresh and ready for testing.");
  } catch (error) {
    console.error("❌ Error wiping database:", error);
  } finally {
    await prisma.$disconnect();
  }
}

wipeDatabase();
