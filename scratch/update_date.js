const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  const customerId = 18066;
  const newDate = "2026-05-05";
  
  console.log(`Searching for Payments for Customer ID: ${customerId}...`);
  
  const payments = await prisma.payment.findMany({
    where: {
      customerId: customerId
    }
  });

  if (payments.length === 0) {
    console.log("No payment records found for this customer ID.");
    return;
  }

  console.log(`Found ${payments.length} payment(s). Updating...`);

  for (const p of payments) {
    const updated = await prisma.payment.update({
        where: { id: p.id },
        data: { date: newDate }
    });
    console.log(`Updated Payment ID: ${updated.id} | New Date: ${updated.date}`);
  }

  console.log("Done!");
}

main()
  .catch(e => console.error(e))
  .finally(async () => {
    await prisma.$disconnect();
  });
