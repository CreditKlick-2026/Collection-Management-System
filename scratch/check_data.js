const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  console.log("Searching for any payments related to 'Sandeep' or account part '3805610'...");
  
  const payments = await prisma.payment.findMany({
    where: {
      OR: [
        { customer_name: { contains: 'Sandeep', mode: 'insensitive' } },
        { account_no: { contains: '3805610' } }
      ]
    },
    include: {
      customer: true
    }
  });

  if (payments.length === 0) {
    console.log("No matching payments found in DB.");
    // Try searching customer table first
    const customers = await prisma.customer.findMany({
        where: {
            OR: [
                { name: { contains: 'Sandeep', mode: 'insensitive' } },
                { account_no: { contains: '3805610' } }
            ]
        }
    });
    console.log("Found matching customers:", customers.map(c => ({ id: c.id, name: c.name, acc: c.account_no })));
    return;
  }

  console.log("Matches found in Payment table:");
  payments.forEach(p => {
    console.log(`ID: ${p.id} | Name: ${p.customer_name} | Acc: ${p.account_no} | Date: ${p.date} | CustomerID: ${p.customerId}`);
    if (p.customer) {
        console.log(`  -> Linked Customer: ${p.customer.name} (${p.customer.account_no})`);
    }
  });
}

main()
  .catch(e => console.error(e))
  .finally(async () => {
    await prisma.$disconnect();
  });
