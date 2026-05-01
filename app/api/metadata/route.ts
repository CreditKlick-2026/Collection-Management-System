import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET() {
  try {
    const [portfolios, users, leadColumns, distinctStatuses] = await Promise.all([
      prisma.portfolio.findMany(),
      prisma.user.findMany({
        where: { active: true, role: { in: ['agent', 'manager', 'admin'] } },
        select: { id: true, name: true, empId: true, role: true, managerId: true },
      }),
      prisma.leadColumn.findMany({
        orderBy: { order: 'asc' }
      }),
      prisma.customer.findMany({
        select: { status: true },
        distinct: ['status']
      })
    ]);
    const agents = users.filter((u) => u.role === 'agent');
    const managers = users.filter((u) => u.role === 'manager' || u.role === 'admin');
    const leadStatuses = distinctStatuses.map(s => s.status).filter(Boolean);

    return NextResponse.json({
      portfolios,
      users,
      agents,
      managers,
      leadColumns,
      lists: {
        leadStatuses,
        paymentModes: ['NEFT', 'UPI', 'Cash', 'Cheque', 'Card', 'ACH', 'RTGS', 'IMPS'],
        ptpStatuses: ['pending', 'kept', 'broken', 'partial', 'paid'],
        disputeStatuses: ['open', 'reviewing', 'resolved', 'escalated', 'closed'],
        flagOptions: ['flagged', 'approved', 'rejected', 'needs_info', 'escalated'],
      },
    });
  } catch (error) {
    return NextResponse.json({ message: 'Error fetching metadata' }, { status: 500 });
  }
}
