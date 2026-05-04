import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { logAudit } from '@/lib/audit';

export const dynamic = 'force-dynamic';

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const status = searchParams.get('status') || 'Raised';
  const customerId = searchParams.get('customerId');
  const date = searchParams.get('date');
  const agent = searchParams.get('agent');
  const account = searchParams.get('account');
  const page = parseInt(searchParams.get('page') || '1');
  const limit = parseInt(searchParams.get('limit') || '50');

  try {
    const where: any = {};
    if (status && status !== 'all') where.status = status;
    if (customerId) where.customerId = Number(customerId);
    
    if (date) {
      where.created = date; // date format is YYYY-MM-DD
    }
    
    if (agent) {
      where.agent = {
        name: { contains: agent, mode: 'insensitive' }
      };
    }
    
    if (account) {
      where.customer = {
        OR: [
          { account_no: { contains: account, mode: 'insensitive' } },
          { name: { contains: account, mode: 'insensitive' } }
        ]
      };
    }

    const total = await prisma.settlement.count({ where });
    const settlements = await prisma.settlement.findMany({
      where,
      include: {
        customer: { select: { id: true, name: true, account_no: true } },
        agent: { select: { id: true, name: true } },
      },
      orderBy: { createdAt: 'desc' },
      skip: (page - 1) * limit,
      take: limit,
    });
    
    return NextResponse.json({
      data: settlements,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit)
    });
  } catch (error) {
    return NextResponse.json({ message: 'Error fetching settlements' }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const data = await request.json();
    const settlement = await prisma.settlement.create({
      data: {
        customerId: Number(data.customerId),
        amount: Number(data.amount) || 0,
        agentId: Number(data.agentId),
        reason: data.reason,
        subReason: data.subReason,
        justification: data.justification,
        status: 'Raised',
        created: new Date().toISOString().split('T')[0],
      }
    });

    await logAudit({
      userId: Number(data.agentId),
      action: 'SETTLEMENT_RAISED',
      entityType: 'Settlement',
      entityId: String(settlement.id),
      details: { reason: data.reason }
    });

    return NextResponse.json(settlement);
  } catch (error) {
    console.error("SETTLEMENT POST ERROR:", error);
    return NextResponse.json({ message: 'Error raising settlement', error: String(error) }, { status: 500 });
  }
}

export async function PUT(request: Request) {
  try {
    const data = await request.json();
    console.log("SETTLEMENT PUT DATA:", data);
    const { id, status, remarks, rejectionReason, managerId } = data;
    const mId = managerId ? Number(managerId) : null;

    const settlement = await prisma.settlement.update({
      where: { id: Number(id) },
      data: {
        status,
        remarks,
        rejectionReason,
        managerId: mId
      }
    });

    if (mId) {
      await logAudit({
        userId: mId,
        action: `SETTLEMENT_${status.toUpperCase()}`,
        entityType: 'Settlement',
        entityId: String(id),
        details: { status, remarks }
      });
    }

    return NextResponse.json(settlement);
  } catch (error) {
    console.error("SETTLEMENT PUT ERROR:", error);
    return NextResponse.json({ message: 'Error updating settlement', error: String(error) }, { status: 500 });
  }
}
