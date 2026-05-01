import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const date = searchParams.get('date');
  const agent = searchParams.get('agent');
  const account = searchParams.get('account');
  const status = searchParams.get('status');
  const flag = searchParams.get('flag');

  try {
    const ptps = await prisma.pTP.findMany({
      where: {
        date: date || undefined,
        status: status || undefined,
        flag: flag === 'null' ? null : (flag || undefined),
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
        customer: true,
        agent: true
      },
      orderBy: { created: 'desc' }
    });

    const formatted = ptps.map(p => ({
      id: p.id,
      account_no: p.customer.account_no,
      customer_name: p.customer.name,
      ptp_amount: p.amount,
      ptp_date: p.date,
      status: p.status,
      agent_name: p.agent.name,
      created: p.created,
      flag: p.flag,
      flag_comment: p.flagComment,
      rejection_reason: p.rejectionReason,
      voc: p.voc,
      remarks: p.remarks
    }));

    return NextResponse.json(formatted);
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const data = await req.json();
    
    const customerId = Number(data.customerId);
    const agentId = Number(data.agentId);
    const amount = parseFloat(data.amount);

    if (Number.isNaN(customerId) || Number.isNaN(agentId) || Number.isNaN(amount)) {
      return NextResponse.json({ message: 'Invalid customer, agent, or amount' }, { status: 400 });
    }

    const newPtp = await prisma.pTP.create({
      data: {
        customerId,
        amount,
        date: data.date,
        status: data.status || 'pending',
        agentId,
        voc: data.voc || '',
        remarks: data.remarks || '',
        created: new Date().toISOString().split('T')[0]
      }
    });
    return NextResponse.json(newPtp);
  } catch (error: any) {
    console.error('POST /api/ptps error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function PUT(req: NextRequest) {
  try {
    const data = await req.json();
    const { id, amount, date, status, voc, remarks, flag, flag_comment, rejection_reason } = data;

    if (!id) return NextResponse.json({ message: 'ID is required' }, { status: 400 });

    const updated = await prisma.pTP.update({
      where: { id: Number(id) },
      data: {
        amount: amount ? parseFloat(amount) : undefined,
        date: date || undefined,
        status: status || undefined,
        voc: voc || undefined,
        remarks: remarks || undefined,
        flag: flag || undefined,
        flagComment: flag_comment || undefined,
        rejectionReason: rejection_reason || undefined
      }
    });

    return NextResponse.json(updated);
  } catch (error: any) {
    console.error('PUT /api/ptps error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}