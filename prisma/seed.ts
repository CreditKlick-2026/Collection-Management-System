const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  console.log('Clearing old data...');

  try { await prisma.auditLog.deleteMany(); } catch {}
  try { await prisma.dispute.deleteMany(); } catch {}
  try { await prisma.pTP.deleteMany(); } catch {}
  try { await prisma.payment.deleteMany(); } catch {}
  try { await prisma.customer.deleteMany(); } catch {}
  try { await prisma.portfolio.deleteMany(); } catch {}
  try { await prisma.user.deleteMany(); } catch {}
  try { await prisma.leadColumn.deleteMany(); } catch {}

  console.log('Creating users...');

  const admin = await prisma.user.create({
    data: { username: 'admin', password: 'admin', name: 'System Admin', role: 'admin', initials: 'SA', empId: 'EMP001', dob: '01-Jan-1980', doj: '01-Jan-2020', email: 'admin@dr.com', address: 'Head Office', contact: '9800000001', active: true }
  });
  const manager = await prisma.user.create({
    data: { username: 'manager1', password: 'manager1', name: 'Rahul Sharma', role: 'manager', initials: 'RS', empId: 'EMP002', managerId: admin.id, dob: '15-Mar-1985', doj: '15-Jun-2021', email: 'rahul@dr.com', address: 'Jaipur', contact: '9800000002', active: true }
  });
  await prisma.user.create({
    data: { username: 'agent1', password: 'agent1', name: 'Jenna Rivera', role: 'agent', initials: 'JR', empId: 'EMP003', managerId: manager.id, dob: '22-Jul-1992', doj: '01-Apr-2022', email: 'jenna@dr.com', address: 'Jaipur', contact: '9800000003', active: true }
  });
  await prisma.user.create({
    data: { username: 'agent2', password: 'agent2', name: 'Carlos Mendes', role: 'agent', initials: 'CM', empId: 'EMP004', managerId: manager.id, dob: '10-Nov-1990', doj: '15-Jun-2022', email: 'carlos@dr.com', address: 'Jaipur', contact: '9800000004', active: true }
  });
  await prisma.user.create({
    data: { username: 'agent3', password: 'agent3', name: 'Aisha Brown', role: 'agent', initials: 'AB', empId: 'EMP005', managerId: manager.id, dob: '05-May-1994', doj: '01-Sep-2022', email: 'aisha@dr.com', address: 'Jaipur', contact: '9800000005', active: true }
  });

  console.log('Creating portfolios...');

  await prisma.portfolio.create({ data: { id: 'P1', name: 'Rajasthan Personal Loans' } });
  await prisma.portfolio.create({ data: { id: 'P2', name: 'Rajasthan Credit Cards' } });
  await prisma.portfolio.create({ data: { id: 'P3', name: 'Rajasthan Home & Auto' } });

  const agent1 = await prisma.user.findUnique({ where: { username: 'agent1' } });
  const agent3 = await prisma.user.findUnique({ where: { username: 'agent3' } });
  const manager1 = await prisma.user.findUnique({ where: { username: 'manager1' } });

  await prisma.portfolio.update({
    where: { id: 'P1' },
    data: {
      agents: { connect: [{ id: agent1.id }, { id: agent3.id }] },
      managers: { connect: [{ id: manager1.id }] }
    }
  });

  console.log('Creating lead columns...');

  const leadColumns = [
    { key: 'account_no',           label: 'Account Number',        order: 1,  type: 'text' },
    { key: 'name',                 label: 'Customer Name',         order: 2,  type: 'text' },
    { key: 'mobile',               label: 'Mobile Number',         order: 3,  type: 'text' },
    { key: 'outstanding',          label: 'Total Outstanding',     order: 4,  type: 'amount' },
    { key: 'principle_outstanding',label: 'Principle Outstanding', order: 5,  type: 'amount' },
    { key: 'min_amt_due',          label: 'Min Amount Due',        order: 6,  type: 'amount' },
    { key: 'dpd',                  label: 'DPD',                   order: 7,  type: 'text' },
    { key: 'product',              label: 'Product Type',          order: 8,  type: 'text' },
    { key: 'bank',                 label: 'Bank / Lender',         order: 9,  type: 'text' },
    { key: 'pan',                  label: 'PAN Number',            order: 10, type: 'text' },
    { key: 'status',               label: 'Status',                order: 11, type: 'badge' },
    { key: 'portfolio',            label: 'Portfolio',             order: 12, type: 'text' },
    { key: 'assignedAgent',        label: 'Assigned Agent',        order: 13, type: 'text' },
    { key: 'city',                 label: 'City',                  order: 14, type: 'text' },
    { key: 'state',                label: 'State',                 order: 15, type: 'text' },
    { key: 'email',                label: 'Email',                 order: 16, type: 'text' },
    { key: 'alt_mobile',           label: 'Alt Mobile',            order: 17, type: 'text' },
    { key: 'address',              label: 'Address',               order: 18, type: 'text' },
    { key: 'bkt_2',                label: 'Bucket',                order: 19, type: 'text' },
    { key: 'createdAt',            label: 'Created Date',          order: 20, type: 'date' },
  ];

  for (const col of leadColumns) {
    await prisma.leadColumn.upsert({
      where: { key: col.key },
      update: col,
      create: col,
    });
  }

  console.log('Creating customers...');

  // Only fields that exist in schema.prisma Customer model
  const customers = [
    {
      account_no: 'LN-2024-001', name: 'Rajesh Kumar Sharma', mobile: '9829004840',
      alt_mobile: '9829004841', email: 'rajesh@example.com', pan: 'ABCPK1234D',
      outstanding: 45000, principle_outstanding: 40000, min_amt_due: 5000,
      dpd: 127, status: 'overdue', product: 'Personal Loan', bank: 'HDFC Bank',
      city: 'Jaipur', state: 'Rajasthan', address: '123, Vaishali Nagar, Jaipur',
      agentUsername: 'agent1', portfolioId: 'P1'
    },
    {
      account_no: 'CC-2024-002', name: 'Priya Singh Chauhan', mobile: '9829112244',
      alt_mobile: null, email: 'priya@example.com', pan: 'BCDPK5678E',
      outstanding: 18500, principle_outstanding: 15000, min_amt_due: 2000,
      dpd: 65, status: 'active', product: 'Credit Card', bank: 'ICICI Bank',
      city: 'Udaipur', state: 'Rajasthan', address: '456, Lake View Road, Udaipur',
      agentUsername: 'agent1', portfolioId: 'P2'
    },
    {
      account_no: 'PL-2024-003', name: 'Amit Verma', mobile: '9784561230',
      alt_mobile: '9784561231', email: 'amit.v@example.com', pan: 'CDEPK9012F',
      outstanding: 72000, principle_outstanding: 65000, min_amt_due: 8000,
      dpd: 210, status: 'overdue', product: 'Personal Loan', bank: 'SBI',
      city: 'Jodhpur', state: 'Rajasthan', address: '789, Sardarpura, Jodhpur',
      agentUsername: 'agent2', portfolioId: 'P1'
    },
    {
      account_no: 'CC-2024-004', name: 'Sunita Devi Agarwal', mobile: '9351234567',
      alt_mobile: null, email: 'sunita.a@example.com', pan: 'DEFPK3456G',
      outstanding: 9800, principle_outstanding: 8000, min_amt_due: 1500,
      dpd: 30, status: 'ptp', product: 'Credit Card', bank: 'Axis Bank',
      city: 'Kota', state: 'Rajasthan', address: '12, Talwandi, Kota',
      agentUsername: 'agent3', portfolioId: 'P2'
    },
    {
      account_no: 'HL-2024-005', name: 'Vikram Singh Rathore', mobile: '9414567890',
      alt_mobile: '9414567891', email: 'vikram.r@example.com', pan: 'EFGPK7890H',
      outstanding: 320000, principle_outstanding: 300000, min_amt_due: 25000,
      dpd: 45, status: 'active', product: 'Home Loan', bank: 'LIC Housing',
      city: 'Bikaner', state: 'Rajasthan', address: '34, Lalgarh Palace Rd, Bikaner',
      agentUsername: 'agent2', portfolioId: 'P3'
    },
    {
      account_no: 'PL-2024-006', name: 'Meera Kumari Joshi', mobile: '9460012345',
      alt_mobile: null, email: 'meera.j@example.com', pan: 'FGHPK2345I',
      outstanding: 55000, principle_outstanding: 50000, min_amt_due: 6000,
      dpd: 95, status: 'overdue', product: 'Personal Loan', bank: 'Kotak Bank',
      city: 'Ajmer', state: 'Rajasthan', address: '56, Pushkar Road, Ajmer',
      agentUsername: 'agent3', portfolioId: 'P1'
    },
    {
      account_no: 'AL-2024-007', name: 'Deepak Gupta', mobile: '9928765432',
      alt_mobile: '9928765433', email: 'deepak.g@example.com', pan: 'GHIPK6789J',
      outstanding: 480000, principle_outstanding: 450000, min_amt_due: 35000,
      dpd: 15, status: 'active', product: 'Auto Loan', bank: 'HDFC Bank',
      city: 'Jaipur', state: 'Rajasthan', address: '90, Malviya Nagar, Jaipur',
      agentUsername: 'agent1', portfolioId: 'P3'
    },
    {
      account_no: 'PL-2024-008', name: 'Kavita Sharma', mobile: '9772345678',
      alt_mobile: null, email: 'kavita.s@example.com', pan: null,
      outstanding: 28000, principle_outstanding: 25000, min_amt_due: 3500,
      dpd: 155, status: 'overdue', product: 'Personal Loan', bank: 'Yes Bank',
      city: 'Sikar', state: 'Rajasthan', address: '22, Nehru Colony, Sikar',
      agentUsername: 'agent2', portfolioId: 'P1'
    },
  ];

  for (const c of customers) {
    const { agentUsername, portfolioId, ...customerData } = c;
    const agent = await prisma.user.findUnique({ where: { username: agentUsername } });

    await prisma.customer.upsert({
      where: { account_no: customerData.account_no },
      update: {
        ...customerData,
        portfolioId,
        assignedAgentId: agent?.id ?? null,
      },
      create: {
        ...customerData,
        portfolioId,
        assignedAgentId: agent?.id ?? null,
      },
    });
  }

  console.log('Creating payments, PTPs, and disputes...');

  const dbCustomers = await prisma.customer.findMany();
  const dbAgents = await prisma.user.findMany({ where: { role: 'agent' } });

  if (dbCustomers.length > 0 && dbAgents.length > 0) {
    // Create a Payment
    await prisma.payment.create({
      data: {
        customerId: dbCustomers[0].id,
        amount: 5000,
        mode: 'UPI',
        ref: 'PAY-123456',
        date: new Date().toISOString().split('T')[0],
        agentId: dbAgents[0].id,
        status: 'cleared',
        remarks: 'Initial payment received via UPI',
      }
    });

    // Create a PTP
    await prisma.pTP.create({
      data: {
        customerId: dbCustomers[1].id,
        amount: 2000,
        date: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0], // 7 days from now
        status: 'pending',
        agentId: dbAgents[0].id,
        remarks: 'Customer promised to pay next week',
        created: new Date().toISOString(),
      }
    });

    // Create a Dispute
    await prisma.dispute.create({
      data: {
        customerId: dbCustomers[2].id,
        type: 'Amount Mismatch',
        raisedDate: new Date().toISOString().split('T')[0],
        status: 'open',
        agentId: dbAgents[1].id,
        description: 'Customer claims the outstanding amount is incorrect.',
      }
    });

    // Create an Audit Log
    await prisma.auditLog.create({
      data: {
        userId: admin.id,
        action: 'SYSTEM_SEED',
        entityType: 'System',
        entityId: '0',
        details: { message: 'Database seeded with sample data' },
      }
    });
  }

  console.log('');
  console.log('✅ Seeding finished successfully!');
  console.log('   Admin:   admin / admin');
  console.log('   Manager: manager1 / manager1');
  console.log('   Agent:   agent1 / agent1');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
