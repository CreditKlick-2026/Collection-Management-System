import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export const dynamic = 'force-dynamic';

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: idStr } = await params;
    const customerId = parseInt(idStr);

    const payments = await prisma.payment.findMany({
      where: { customerId },
      include: {
        agent: { select: { id: true, name: true, initials: true } },
      },
      orderBy: { date: 'desc' },
    });

    // Compute aggregates
    const total = payments.reduce((sum, p) => sum + p.amount, 0);
    const cleared = payments.filter(p => p.status === 'cleared').reduce((sum, p) => sum + p.amount, 0);
    const pending = payments.filter(p => p.status === 'pending_approval').reduce((sum, p) => sum + p.amount, 0);
    const rejected = payments.filter(p => p.status === 'rejected').reduce((sum, p) => sum + p.amount, 0);

    return NextResponse.json({
      payments,
      summary: {
        count: payments.length,
        total,
        cleared,
        pending,
        rejected,
        clearedCount: payments.filter(p => p.status === 'cleared').length,
        pendingCount: payments.filter(p => p.status === 'pending_approval').length,
        rejectedCount: payments.filter(p => p.status === 'rejected').length,
      }
    });
  } catch (error) {
    console.error('Error fetching customer payments:', error);
    return NextResponse.json({ message: 'Error fetching payments' }, { status: 500 });
  }
}
