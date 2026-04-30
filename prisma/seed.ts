const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  // Clear existing data
  await prisma.dispute.deleteMany();
  await prisma.ptp.deleteMany();
  await prisma.payment.deleteMany();
  await prisma.customer.deleteMany();
  await prisma.portfolio.deleteMany();
  await prisma.user.deleteMany();

  // Create Users
  const users = [
    {id:1,username:'admin',   password:'admin',   name:'System Admin', role:'admin',   initials:'SA',empId:'EMP001',managerId:null, dob:'01-Jan-1980',doj:'01-Jan-2020',email:'admin@dr.com',   address:'Head Office',contact:'9800000001',active:true},
    {id:2,username:'manager1',password:'manager1',name:'Rahul Sharma',  role:'manager', initials:'RS',empId:'EMP002',managerId:1,   dob:'15-Mar-1985',doj:'15-Jun-2021',email:'rahul@dr.com',   address:'Jaipur',contact:'9800000002',active:true},
    {id:3,username:'agent1',  password:'agent1',  name:'Jenna Rivera',  role:'agent',   initials:'JR',empId:'EMP003',managerId:2,   dob:'22-Jul-1992',doj:'01-Apr-2022',email:'jenna@dr.com',   address:'Jaipur',contact:'9800000003',active:true},
    {id:4,username:'agent2',  password:'agent2',  name:'Carlos Mendes', role:'agent',   initials:'CM',empId:'EMP004',managerId:2,   dob:'10-Nov-1990',doj:'15-Jun-2022',email:'carlos@dr.com',  address:'Jaipur',contact:'9800000004',active:true},
    {id:5,username:'agent3',  password:'agent3',  name:'Aisha Brown',   role:'agent',   initials:'AB',empId:'EMP005',managerId:2,   dob:'05-May-1994',doj:'01-Sep-2022',email:'aisha@dr.com',   address:'Jaipur',contact:'9800000005',active:true},
  ];

  for (const u of users) {
    await prisma.user.create({ data: u });
  }

  // Create Portfolios
  const portfolios = [
    {id:'P1',name:'Rajasthan Personal Loans'},
    {id:'P2',name:'Rajasthan Credit Cards'},
    {id:'P3',name:'Rajasthan Home & Auto'},
  ];

  for (const p of portfolios) {
    await prisma.portfolio.create({ data: p });
  }

  // Assign Portfolios (Mocking relations)
  // This would typically be a many-to-many update
  // For P1 (Agents 3, 5; Manager 2)
  await prisma.portfolio.update({
    where: { id: 'P1' },
    data: {
      agents: { connect: [{ id: 3 }, { id: 5 }] },
      managers: { connect: [{ id: 2 }] }
    }
  });

  // Create Customers
  const customers = [
    {id:1, account_no:'LN-2024-001',name:'Rajesh Kumar Sharma',  mobile:'9829004840',outstanding:45000, dpd:127,status:'overdue',city:'Jaipur',assignedAgentId:3, portfolioId:'P1'},
    {id:2, account_no:'CC-2024-002',name:'Priya Singh Chauhan',  mobile:'9829112244',outstanding:18500, dpd:65, status:'active',  city:'Udaipur',assignedAgentId:3, portfolioId:'P2'},
    // ... more customers
  ];

  for (const c of customers) {
    await prisma.customer.create({ data: c });
  }

  console.log('Seeding finished.');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
