const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  const columns = [
    { key: 'accref', label: 'ACCREF', type: 'text', visible: true, order: 1 },
    { key: 'card_no', label: 'CARD NO', type: 'text', visible: true, order: 2 },
    { key: 'total_outstanding', label: 'TOTAL OUTSTANDING', type: 'amount', visible: true, order: 3 },
    { key: 'principle_outstanding', label: 'PRINCIPLE OUTSTANDING', type: 'amount', visible: true, order: 4 },
    { key: 'min_amt_due', label: 'MIN AMT DUE', type: 'amount', visible: true, order: 5 },
    { key: 'product_npa', label: 'PRODUCT NPA', type: 'text', visible: true, order: 6 },
    { key: 'bkt', label: 'Bkt', type: 'text', visible: true, order: 7 },
    { key: 'bkt2', label: 'Bkt2', type: 'text', visible: true, order: 8 },
    { key: 'product_type', label: 'PRODUCT TYPE', type: 'text', visible: true, order: 9 },
    { key: 'bank_or_npa', label: 'BANK OR NPA', type: 'text', visible: true, order: 10 },
    { key: 'linkage', label: 'LINKAGE', type: 'text', visible: true, order: 11 },
    { key: 'degrade_reason', label: 'Degrade Reason', type: 'text', visible: true, order: 12 },
    { key: 'eligible_for_upgrade', label: 'Eligible for Upgrade', type: 'text', visible: true, order: 13 },
    { key: 'mobile_number', label: 'Mobile Number', type: 'text', visible: true, order: 14 },
    { key: 'alt_num_1', label: 'Alternate Number 1', type: 'text', visible: true, order: 15 },
    { key: 'alt_num_2', label: 'Alternate Number 2', type: 'text', visible: true, order: 16 },
    { key: 'alt_num_3', label: 'Alternate Number 3', type: 'text', visible: true, order: 17 },
    { key: 'alt_num_4', label: 'Alternate Number 4', type: 'text', visible: true, order: 18 },
    { key: 'address', label: 'Address', type: 'text', visible: true, order: 19 },
    { key: 'final_city', label: 'FINAL CITY', type: 'text', visible: true, order: 20 },
    { key: 'final_state', label: 'FINAL STATE', type: 'text', visible: true, order: 21 },
    { key: 'email', label: 'EMAIL', type: 'text', visible: true, order: 22 },
  ];

  console.log('Cleaning existing columns...');
  await prisma.leadColumn.deleteMany();

  console.log('Seeding new columns...');
  for (const col of columns) {
    await prisma.leadColumn.create({ data: col });
  }

  console.log('Seed successful');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
