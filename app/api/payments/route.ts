import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { logAudit } from '@/lib/audit';

export const dynamic = 'force-dynamic';

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const status     = searchParams.get('status') || 'cleared';
  const date       = searchParams.get('date');
  const mode       = searchParams.get('mode');
  const agent      = searchParams.get('agent');
  const account    = searchParams.get('account');
  const customerId = searchParams.get('customerId');
  const page       = Math.max(1, parseInt(searchParams.get('page')  || '1'));
  const limit      = Math.min(100, parseInt(searchParams.get('limit') || '25'));
  const skip       = (page - 1) * limit;

  const where: any = {
    status: (status === 'all' || !status) ? undefined : status,
    date:       date       || undefined,
    mode:       mode       || undefined,
    customerId: customerId ? Number(customerId) : undefined,
    agent:      agent ? { name: { contains: agent, mode: 'insensitive' } } : undefined,
    OR: account
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
          customer: { select: { id: true, name: true, account_no: true, bkt_2: true, eligible_upgrade: true, product: true } },
          agent:    { select: { id: true, name: true, empId: true } },
        },
        orderBy: { date: 'desc' },
        skip,
        take: limit,
      }),
      prisma.payment.count({ where }),
    ]);
    return NextResponse.json({ data: payments, total, page, limit, totalPages: Math.ceil(total / limit) });
  } catch (error) {
    console.error('Error fetching payments', error);
    return NextResponse.json({ message: 'Error fetching payments' }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const data = await request.json();
    
    // Validate required numeric fields
    const customerId = Number(data.customerId);
    const agentId = Number(data.agentId);
    const amount = parseFloat(data.amount);

    if (Number.isNaN(customerId) || Number.isNaN(agentId) || Number.isNaN(amount)) {
      console.error('Validation failed for payment:', { customerId, agentId, amount });
      return NextResponse.json({ message: 'Invalid customer, agent, or amount value' }, { status: 400 });
    }

    const payment = await prisma.payment.create({
      data: {
        customerId,
        amount,
        mode: data.mode || 'Cash',
        ref: data.ref || '',
        date: data.date || new Date().toISOString().split('T')[0],
        agentId,
        status: 'pending_approval',
        remarks: data.remarks || ''
      }
    });

    try {
      await logAudit({
        userId: agentId,
        action: 'PAYMENT_CREATED',
        entityType: 'Payment',
        entityId: String(payment.id),
        details: { amount: payment.amount, mode: payment.mode, status: payment.status }
      });
    } catch (auditErr) {
      console.error('Audit log failed but payment was created:', auditErr);
    }

    return NextResponse.json(payment);
  } catch (error: any) {
    console.error('POST /api/payments error:', error);
    return NextResponse.json({ message: error.message || 'Error creating payment' }, { status: 500 });
  }
}

export async function PUT(request: Request) {
  try {
    const { id, status, flag, flagBy, flagComment, rejectionReason, remarks, customerId, metadata } =
      await request.json();

    // Check if payment is locked (resolved by manager)
    const existing = await prisma.payment.findUnique({ where: { id: Number(id) } });
    if (existing?.resolved) {
      return NextResponse.json({ message: 'LOCKED: This payment has been resolved by a manager and cannot be modified.' }, { status: 403 });
    }

    const payment = await prisma.payment.update({
      where: { id: Number(id) },
      data: {
        status,
        flag,
        flagBy: flagBy ? Number(flagBy) : undefined,
        flagComment,
        rejectionReason,
        remarks,
        customerId: customerId ? Number(customerId) : undefined,
        metadata: metadata || undefined,
      }
    });

    await logAudit({
      userId: Number(flagBy || payment.agentId), // Use flagBy if available, else agent
      action: status === 'rejected' ? 'PAYMENT_REJECTED' : flag === 'flagged' ? 'PAYMENT_FLAGGED' : 'PAYMENT_UPDATED',
      entityType: 'Payment',
      entityId: String(payment.id),
      details: { status, flag, flagComment, rejectionReason }
    });

    return NextResponse.json(payment);
  } catch (error) {
    console.error('Error updating payment', error);
    return NextResponse.json({ message: 'Error updating payment' }, { status: 500 });
  }
}
