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
    
    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '10');
    const skip = (page - 1) * limit;

    // Fetch all for summary
    const allPayments = await prisma.payment.findMany({
      where: { customerId },
      orderBy: { date: 'desc' },
    });

    // Fetch paginated slice
    const payments = await prisma.payment.findMany({
      where: { customerId },
      include: {
        agent: { select: { id: true, name: true, initials: true } },
      },
      orderBy: { date: 'desc' },
      skip,
      take: limit,
    });

    // Compute aggregates from allPayments
    const total = allPayments.reduce((sum, p) => sum + p.amount, 0);
    const cleared = allPayments.filter(p => p.status === 'cleared').reduce((sum, p) => sum + p.amount, 0);
    const pending = allPayments.filter(p => p.status === 'pending_approval').reduce((sum, p) => sum + p.amount, 0);
    const rejected = allPayments.filter(p => p.status === 'rejected').reduce((sum, p) => sum + p.amount, 0);

    return NextResponse.json({
      payments,
      total: allPayments.length,
      page,
      limit,
      totalPages: Math.ceil(allPayments.length / limit),
      summary: {
        count: allPayments.length,
        total,
        cleared,
        pending,
        rejected,
        clearedCount: allPayments.filter(p => p.status === 'cleared').length,
        pendingCount: allPayments.filter(p => p.status === 'pending_approval').length,
        rejectedCount: allPayments.filter(p => p.status === 'rejected').length,
      }
    });
  } catch (error) {
    console.error('Error fetching customer payments:', error);
    return NextResponse.json({ message: 'Error fetching payments' }, { status: 500 });
  }
}
