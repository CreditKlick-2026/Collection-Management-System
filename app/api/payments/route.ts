import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

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
    const payment = await prisma.payment.create({
      data: {
        customerId: Number(data.customerId),
        amount: parseFloat(data.amount),
        mode: data.mode,
        ref: data.ref,
        date: data.date,
        agentId: Number(data.agentId),
        status: 'pending_approval',
        remarks: data.remarks
      }
    });
    return NextResponse.json(payment);
  } catch (error) {
    return NextResponse.json({ message: 'Error creating payment' }, { status: 500 });
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
    return NextResponse.json(payment);
  } catch (error) {
    console.error('Error updating payment', error);
    return NextResponse.json({ message: 'Error updating payment' }, { status: 500 });
  }
}
