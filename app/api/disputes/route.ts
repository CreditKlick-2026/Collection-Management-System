import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const date = searchParams.get('date');
  const agent = searchParams.get('agent');
  const account = searchParams.get('account');

  try {
    const disputes = await prisma.dispute.findMany({
      where: {
        raisedDate: date || undefined,
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
      orderBy: { raisedDate: 'desc' }
    });

    const formatted = disputes.map(d => ({
      id: d.id,
      account_no: d.customer.account_no,
      customer_name: d.customer.name,
      type: d.type,
      raised_date: d.raisedDate,
      status: d.status,
      agent_name: d.agent.name,
      description: d.description,
      resolution: d.resolution,
      escalated: d.escalated,
      flag: d.flag,
      flag_comment: d.flagComment
    }));

    return NextResponse.json(formatted);
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const data = await req.json();
    const newDispute = await prisma.dispute.create({
      data: {
        customerId: data.customerId,
        type: data.type,
        raisedDate: new Date().toISOString().split('T')[0],
        status: data.status || 'open',
        agentId: data.agentId,
        description: data.description || '',
        escalated: data.escalated || false
      }
    });
    return NextResponse.json(newDispute);
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
