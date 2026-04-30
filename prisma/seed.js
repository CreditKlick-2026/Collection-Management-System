const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  console.log('Cleaning up database...');
  // Note: Prisma model names in the client are camelCase. 
  // PTP becomes pTP, User becomes user, etc.
  try { await prisma.dispute.deleteMany(); } catch(e) { console.log('dispute table empty or missing'); }
  try { await prisma.pTP.deleteMany(); } catch(e) { console.log('pTP table empty or missing'); }
  try { await prisma.payment.deleteMany(); } catch(e) { console.log('payment table empty or missing'); }
  try { await prisma.customer.deleteMany(); } catch(e) { console.log('customer table empty or missing'); }
  try { await prisma.portfolio.deleteMany(); } catch(e) { console.log('portfolio table empty or missing'); }
  try { await prisma.user.deleteMany(); } catch(e) { console.log('user table empty or missing'); }

  console.log('Seeding users...');
  const users = [
    {username:'admin',   password:'admin',   name:'System Admin', role:'admin',   initials:'SA',empId:'EMP001',managerId:null, dob:'01-Jan-1980',doj:'01-Jan-2020',email:'admin@dr.com',   address:'Head Office',contact:'9800000001',active:true},
    {username:'manager1',password:'manager1',name:'Rahul Sharma',  role:'manager', initials:'RS',empId:'EMP002',managerId:null, dob:'15-Mar-1985',doj:'15-Jun-2021',email:'rahul@dr.com',   address:'Jaipur',contact:'9800000002',active:true},
    {username:'agent1',  password:'agent1',  name:'Jenna Rivera',  role:'agent',   initials:'JR',empId:'EMP003',managerId:null, dob:'22-Jul-1992',doj:'01-Apr-2022',email:'jenna@dr.com',   address:'Jaipur',contact:'9800000003',active:true},
  ];

  for (const u of users) {
    await prisma.user.create({ data: u });
  }

  console.log('Seeding portfolios...');
  const portfolios = [
    {id:'P1',name:'Rajasthan Personal Loans'},
    {id:'P2',name:'Rajasthan Credit Cards'},
    {id:'P3',name:'Rajasthan Home & Auto'},
  ];

  for (const p of portfolios) {
    await prisma.portfolio.create({ data: p });
  }

  console.log('Seeding customers...');
  const customers = [
    {account_no:'LN-2024-001',name:'Rajesh Kumar Sharma',  mobile:'9829004840',outstanding:45000, dpd:127,status:'overdue',city:'Jaipur', portfolioId:'P1'},
    {account_no:'CC-2024-002',name:'Priya Singh Chauhan',  mobile:'9829112244',outstanding:18500, dpd:65, status:'active',  city:'Udaipur', portfolioId:'P2'},
    {account_no:'AL-2024-003',name:'Amit Verma Gupta',     mobile:'9829234567',outstanding:92000, dpd:214,status:'legal',   city:'Kota', portfolioId:'P3'},
    {account_no:'LN-2024-004',name:'Sunita Devi Meena',    mobile:'9829345678',outstanding:12000, dpd:32, status:'overdue',city:'Jaipur', portfolioId:'P1'},
    {account_no:'CC-2024-005',name:'Vikram Singh Rathore', mobile:'9829456789',outstanding:54000, dpd:156,status:'overdue',city:'Jodhpur', portfolioId:'P2'},
  ];

  for (const c of customers) {
    await prisma.customer.create({ data: c });
  }

  console.log('Seeding finished successfully!');
}

main()
  .catch((e) => {
    console.error('Error during seeding:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
