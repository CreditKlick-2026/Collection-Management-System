const { PrismaClient } = require('@prisma/client');
const crypto = require('crypto');
const prisma = new PrismaClient();

async function main() {
  const username = 'billing_admin';
  const password = 'password123';
  const role = 'billing';

  const hashedPassword = crypto.createHash('sha256').update(password).digest('hex');

  const user = await prisma.user.upsert({
    where: { username },
    update: {
      password: hashedPassword,
      role
    },
    create: {
      username,
      password: hashedPassword,
      name: 'Billing Administrator',
      role,
      initials: 'BA',
      empId: 'BILL001',
      dob: '01-Jan-1990',
      doj: '01-Jan-2023',
      email: 'billing@example.com',
      address: 'Billing Dept',
      contact: '9999999999',
      active: true
    }
  });
  console.log('Created billing user successfully!');
  console.log('Username: ' + user.username);
  console.log('Password: password123');
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
