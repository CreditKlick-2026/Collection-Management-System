import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { logAudit } from '@/lib/audit';
import crypto from 'crypto';

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { password, userId, action, month, year } = body;

    // 1. Verify admin user and password
    const admin = await prisma.user.findUnique({
      where: { id: Number(userId) }
    });

    const hashedPassword = crypto.createHash('sha256').update(password).digest('hex');
    const isCorrect = admin?.password === hashedPassword || admin?.password === password;

    if (!admin || admin.role !== 'admin' || !isCorrect) {
      return NextResponse.json({ message: 'Unauthorized: Invalid admin password' }, { status: 401 });
    }

    // 2. Perform Cleanup
    if (action === 'all') {
      await prisma.$transaction([
        prisma.auditLog.deleteMany(),
        prisma.settlement.deleteMany(),
        prisma.dispute.deleteMany(),
        prisma.pTP.deleteMany(),
        prisma.payment.deleteMany(),
        prisma.customer.deleteMany(),
      ]);
    } else if (action === 'audit') {
      await prisma.auditLog.deleteMany();
    } else if (action === 'selective') {
      if (!month || !year) return NextResponse.json({ message: 'Month and Year required' }, { status: 400 });

      const startDate = new Date(Number(year), Number(month) - 1, 1);
      const endDate = new Date(Number(year), Number(month), 1);
      const startStr = startDate.toISOString().split('T')[0];
      const endStr = endDate.toISOString().split('T')[0];

      // 1. Find all related IDs from different tables for that period
      const [customers, payments, ptps] = await Promise.all([
        prisma.customer.findMany({ where: { createdAt: { gte: startDate, lt: endDate } }, select: { id: true } }),
        prisma.payment.findMany({ where: { date: { gte: startStr, lt: endStr } }, select: { customerId: true } }),
        prisma.pTP.findMany({ where: { date: { gte: startStr, lt: endStr } }, select: { customerId: true } })
      ]);

      const allCustomerIds = new Set([
        ...customers.map(c => c.id),
        ...payments.map(p => p.customerId),
        ...ptps.map(p => p.customerId)
      ]);

      // Filter out nulls since customerId is now optional
      const allIds = Array.from(allCustomerIds).filter((id): id is number => id !== null);
      const totalFound = allIds.length;
      
      if (totalFound === 0) return NextResponse.json({ message: 'No data found for this period', totalFound: 0, deletedCount: 0 });

      // 2. Preserve Payments by copying Customer Data into them before deletion
      const customersToWipe = await prisma.customer.findMany({
        where: { id: { in: allIds } },
        select: { id: true, account_no: true, name: true }
      });

      for (const cust of customersToWipe) {
        await prisma.payment.updateMany({
          where: { customerId: cust.id },
          data: {
            account_no: cust.account_no,
            customer_name: cust.name
          }
        });
      }

      // 3. WIPE EVERYTHING EXCEPT PAYMENTS
      await prisma.$transaction([
        prisma.settlement.deleteMany({ where: { customerId: { in: allIds } } }),
        prisma.dispute.deleteMany({ where: { customerId: { in: allIds } } }),
        prisma.pTP.deleteMany({ where: { customerId: { in: allIds } } }),
        prisma.auditLog.deleteMany({ where: { entityType: 'Customer', entityId: { in: allIds.map(String) } } }),
        prisma.customer.deleteMany({ where: { id: { in: allIds } } }),
      ]);

      await logAudit({
        userId: Number(userId),
        action: 'SELECTIVE_DATABASE_WIPE',
        entityType: 'System',
        entityId: '0',
        details: { month, year, totalFound, message: `TOTAL WIPE for ${month}/${year}. Deleted ${totalFound} leads and all related payments/history.` }
      });

      return NextResponse.json({ 
        message: `Total wipe completed for ${month}/${year}.`, 
        totalFound, 
        deletedCount: totalFound 
      });
    } else {
      // For 'audit' or other actions that didn't return early
      await logAudit({
        userId: Number(userId),
        action: action === 'all' ? 'DATABASE_FLUSH' : 'AUDIT_LOG_CLEANUP',
        entityType: 'System',
        entityId: '0',
        details: { message: action === 'all' ? 'Full database data flush performed' : 'Audit logs cleared' }
      });
    }

    return NextResponse.json({ message: 'Action completed successfully' });
  } catch (error) {
    console.error("FLUSH DB ERROR:", error);
    return NextResponse.json({ message: 'Error flushing database', error: String(error) }, { status: 500 });
  }
}
