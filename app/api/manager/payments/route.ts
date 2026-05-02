import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { logAudit } from '@/lib/audit';

export const dynamic = 'force-dynamic';

// GET - fetch all cleared payments with resolve status (for manager)
export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const date     = searchParams.get('date')     || '';
  const agent    = searchParams.get('agent')    || '';
  const account  = searchParams.get('account')  || '';
  const resolved = searchParams.get('resolved');
  const page     = Math.max(1, parseInt(searchParams.get('page')  || '1'));
  const limit    = Math.min(100, parseInt(searchParams.get('limit') || '25'));
  const skip     = (page - 1) * limit;

  const where: any = {
    status: 'cleared',
    date:     date     || undefined,
    resolved: resolved === 'true' ? true : resolved === 'false' ? false : undefined,
    agent:    agent    ? { name: { contains: agent,   mode: 'insensitive' } } : undefined,
    OR:       account
      ? [
          { customer: { account_no: { contains: account, mode: 'insensitive' } } },
          { customer: { name:       { contains: account, mode: 'insensitive' } } },
        ]
      : undefined,
  };

  try {
    const [payments, total] = await prisma.$transaction([
      prisma.payment.findMany({
        where,
        include: {
          customer: { select: { id: true, name: true, account_no: true } },
          agent:    { select: { id: true, name: true, empId: true } },
        },
        orderBy: { date: 'desc' },
        skip,
        take: limit,
      }),
      prisma.payment.count({ where }),
    ]);

    return NextResponse.json({
      data:       payments,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    });
  } catch (error) {
    return NextResponse.json({ message: 'Error fetching payments' }, { status: 500 });
  }
}

// PUT - resolve or unresolve a payment
export async function PUT(request: Request) {
  try {
    const { id, resolve, managerId } = await request.json();

    // Check if payment exists and is cleared
    const existing = await prisma.payment.findUnique({ where: { id: Number(id) } });
    if (!existing) return NextResponse.json({ message: 'Payment not found' }, { status: 404 });
    if (existing.status !== 'cleared') return NextResponse.json({ message: 'Only cleared payments can be resolved' }, { status: 400 });

    const payment = await prisma.payment.update({
      where: { id: Number(id) },
      data: {
        resolved: resolve,
        resolvedBy: resolve ? Number(managerId) : null,
        resolvedAt: resolve ? new Date() : null,
      },
    });

    await logAudit({
      userId: Number(managerId),
      action: resolve ? 'PAYMENT_RESOLVED' : 'PAYMENT_UNRESOLVED',
      entityType: 'Payment',
      entityId: String(id),
      details: { resolved: resolve, amount: payment.amount },
    });

    return NextResponse.json(payment);
  } catch (error) {
    return NextResponse.json({ message: 'Error updating payment', error: String(error) }, { status: 500 });
  }
}
