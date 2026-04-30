import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

export async function GET(req: NextRequest) {
  try {
    const ptps = await prisma.pTP.findMany({
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
    const newPtp = await prisma.pTP.create({
      data: {
        customerId: data.customerId,
        amount: data.amount,
        date: data.date,
        status: data.status || 'pending',
        agentId: data.agentId,
        voc: data.voc || '',
        remarks: data.remarks || '',
        created: new Date().toISOString().split('T')[0]
      }
    });
    return NextResponse.json(newPtp);
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}