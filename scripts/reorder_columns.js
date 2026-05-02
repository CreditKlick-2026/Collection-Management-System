const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

const updates = [
  { key: 'account_no',            label: 'Account Number',        order: 1  },
  { key: 'name',                  label: 'Customer Name',         order: 2  },
  { key: 'mobile',                label: 'Mobile Number',         order: 3  },
  { key: 'dpd',                   label: 'DPD',                   order: 4  },
  { key: 'product',               label: 'Product Type',          order: 5  },
  { key: 'bank',                  label: 'Bank / Lender',         order: 6  },
  { key: 'status',                label: 'Status',                order: 7  },
  { key: 'portfolio',             label: 'Portfolio',             order: 8  },
  { key: 'city',                  label: 'City',                  order: 9  },
  { key: 'state',                 label: 'State',                 order: 10 },
  { key: 'email',                 label: 'Email',                 order: 11 },
  { key: 'alt_mobile',            label: 'Alt Mobile',            order: 12 },
  { key: 'address',               label: 'Address',               order: 13 },
  { key: 'min_amt_due',           label: 'Min Amount Due',        order: 14 },
  { key: 'principle_outstanding', label: 'Principle Outstanding', order: 15 },
  { key: 'outstanding',           label: 'Total Outstanding',     order: 16 },
  { key: 'pan',                   label: 'PAN Number',            order: 17 },
  { key: 'bkt_2',                 label: 'Bucket',                order: 18 },
  { key: 'createdAt',             label: 'Allocation Date',       order: 19 },
  { key: 'assignedAgent',         label: 'Assigned Agent',        order: 20 },
];

async function run() {
  for (const u of updates) {
    try {
      await prisma.leadColumn.update({ where: { key: u.key }, data: { order: u.order, label: u.label } });
      console.log('✅ Updated:', u.key, '->', u.label, '(order', u.order + ')');
    } catch (e) {
      console.log('⚠️  Skipped (not found):', u.key);
    }
  }
  await prisma.$disconnect();
  console.log('\nDone!');
}

run().catch(e => { console.error(e); process.exit(1); });
