import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { logAudit } from '@/lib/audit';

export const dynamic = 'force-dynamic';

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const status = searchParams.get('status') || 'cleared';
  const date = searchParams.get('date');
  const mode = searchParams.get('mode');
  const agent = searchParams.get('agent');
  const account = searchParams.get('account');
  const customerId = searchParams.get('customerId');

  try {
    const payments = await prisma.payment.findMany({
      where: {
        status: status === 'all' ? undefined : status,
        date: date || undefined,
        mode: mode || undefined,
        customerId: customerId ? Number(customerId) : undefined,
        agent: agent
          ? {
              name: { contains: agent, mode: 'insensitive' },
            }
          : undefined,
        OR: account
          ? [
              { customer: { account_no: { contains: account, mode: 'insensitive' } } },
              { customer: { name: { contains: account, mode: 'insensitive' } } },
            ]
          : undefined,
      },
      include: {
        customer: { select: { id: true, name: true, account_no: true } },
        agent: { select: { id: true, name: true } }
      },
      orderBy: { date: 'desc' }
    });
    return NextResponse.json(payments);
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
    const { id, status, flag, flagBy, flagComment, rejectionReason, remarks } =
      await request.json();
    const payment = await prisma.payment.update({
      where: { id: Number(id) },
      data: {
        status,
        flag,
        flagBy: flagBy ? Number(flagBy) : undefined,
        flagComment,
        rejectionReason,
        remarks,
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
