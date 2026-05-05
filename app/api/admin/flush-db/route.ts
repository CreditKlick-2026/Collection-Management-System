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
      await prisma.auditLog.deleteMany();
      await prisma.bulkUploadJob.deleteMany();
      await prisma.settlement.deleteMany();
      await prisma.dispute.deleteMany();
      await prisma.pTP.deleteMany();
      await prisma.payment.deleteMany();
      await prisma.customer.deleteMany();
    } else if (action === 'audit') {
      await prisma.auditLog.deleteMany();
    } else if (action === 'selective') {
      if (!month || !year) return NextResponse.json({ message: 'Month and Year required' }, { status: 400 });

      // Use UTC dates to match database storage behavior
      const startDate = new Date(Date.UTC(Number(year), Number(month) - 1, 1));
      const endDate = new Date(Date.UTC(Number(year), Number(month), 1));
      
      const startStr = startDate.toISOString().split('T')[0];
      const endStr = endDate.toISOString().split('T')[0];

      console.log(`[Selective Cleanup] Target: ${month}/${year} | UTC Range: ${startDate.toISOString()} to ${endDate.toISOString()}`);

      // 1. Find all candidate IDs
      const [customers, jobs, ptps, disputes, settlements] = await Promise.all([
        prisma.customer.findMany({ 
          where: { createdAt: { gte: startDate, lt: endDate } }, 
          select: { id: true, account_no: true } 
        }),
        prisma.bulkUploadJob.findMany({
          where: { createdAt: { gte: startDate, lt: endDate } },
          select: { id: true }
        }),
        prisma.pTP.findMany({ where: { date: { gte: startStr, lt: endStr } }, select: { customerId: true } }),
        prisma.dispute.findMany({ where: { raisedDate: { gte: startStr, lt: endStr } }, select: { customerId: true } }),
        prisma.settlement.findMany({ where: { created: { gte: startStr, lt: endStr } }, select: { customerId: true } })
      ]);

      console.log(`  - Found ${customers.length} customers by createdAt`);
      console.log(`  - Found ${jobs.length} bulk upload jobs in range`);

      const jobCustomerIds = jobs.length > 0 ? await prisma.customer.findMany({
        where: { bulkUploadJobId: { in: jobs.map(j => j.id) } },
        select: { id: true }
      }) : [];
      
      if (jobs.length > 0) console.log(`  - Found ${jobCustomerIds.length} customers linked to those jobs`);

      const allCandidateIds = new Set([
        ...customers.map(c => c.id),
        ...jobCustomerIds.map(c => c.id),
        ...ptps.map(p => p.customerId),
        ...disputes.map(d => d.customerId),
        ...settlements.map(s => s.customerId)
      ]);

      const candidateIds = Array.from(allCandidateIds).filter((id): id is number => id !== null);
      console.log(`  - Total unique candidate IDs: ${candidateIds.length}`);
      
      if (candidateIds.length === 0) {
        return NextResponse.json({ message: 'No data found for this period', deletedCount: 0, skippedCount: 0 });
      }

      // 2. Identify customers who have ANY VALID payments (cleared or pending)
      const protectedPayments = await prisma.payment.findMany({
        where: { 
          customerId: { in: candidateIds },
          status: { in: ['cleared', 'pending_approval'] }
        },
        select: { customerId: true },
        distinct: ['customerId']
      });
      const protectedIds = new Set(protectedPayments.map(p => p.customerId).filter((id): id is number => id !== null));
      
      // If force is true, we delete everything regardless of payments
      const force = body.force === true;
      const targetIds = force ? candidateIds : candidateIds.filter(id => !protectedIds.has(id));
      
      const skippedCount = force ? 0 : protectedIds.size;
      const deletedCount = targetIds.length;

      console.log(`  - Force Mode: ${force}`);
      console.log(`  - Protected (with payments): ${protectedIds.size}`);
      console.log(`  - Skipped (protected): ${skippedCount}`);
      console.log(`  - Targets for deletion: ${deletedCount}`);

      if (targetIds.length > 0) {
        await prisma.$transaction([
          prisma.payment.deleteMany({ where: { customerId: { in: targetIds } } }),
          prisma.settlement.deleteMany({ where: { customerId: { in: targetIds } } }),
          prisma.dispute.deleteMany({ where: { customerId: { in: targetIds } } }),
          prisma.pTP.deleteMany({ where: { customerId: { in: targetIds } } }),
          prisma.auditLog.deleteMany({ where: { entityType: 'Customer', entityId: { in: targetIds.map(String) } } }),
          prisma.customer.deleteMany({ where: { id: { in: targetIds } } }),
        ]);
      }

      await logAudit({
        userId: Number(userId),
        action: 'SELECTIVE_LEAD_CLEANUP',
        entityType: 'System',
        entityId: '0',
        details: { month, year, deletedCount, skippedCount, message: `Selective cleanup for ${month}/${year}. Deleted ${deletedCount} leads, skipped ${skippedCount} with payments.` }
      });

      return NextResponse.json({ 
        message: `Cleanup completed for ${month}/${year}.`, 
        deletedCount, 
        skippedCount 
      });
    }

    await logAudit({
      userId: Number(userId),
      action: action === 'all' ? 'DATABASE_FLUSH' : 'AUDIT_LOG_CLEANUP',
      entityType: 'System',
      entityId: '0',
      details: { message: action === 'all' ? 'Full database data flush performed' : 'Audit logs cleared' }
    });

    return NextResponse.json({ message: 'Action completed successfully' });
  } catch (error) {
    console.error("FLUSH DB ERROR:", error);
    return NextResponse.json({ message: 'Error flushing database', error: String(error) }, { status: 500 });
  }
}