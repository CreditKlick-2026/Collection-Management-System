import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { logAudit } from '@/lib/audit';

export const dynamic = 'force-dynamic';

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const status = searchParams.get('status') || 'Raised';
  const customerId = searchParams.get('customerId');
  const date = searchParams.get('date');
  const dateFrom = searchParams.get('dateFrom');
  const dateTo = searchParams.get('dateTo');
  const agent = searchParams.get('agent');
  const account = searchParams.get('account');
  const page = parseInt(searchParams.get('page') || '1');
  const limit = parseInt(searchParams.get('limit') || '50');
  const requesterId = searchParams.get('requesterId');

  try {
    const where: any = {};
    if (status && status !== 'all') where.status = status;
    if (customerId) where.customerId = Number(customerId);
    
    if (dateFrom || dateTo) {
      where.created = {};
      if (dateFrom) where.created.gte = dateFrom;
      if (dateTo)   where.created.lte = dateTo;
    } else if (date) {
      where.created = date; // legacy single date
    }
    
    if (requesterId) {
      const rUser = await prisma.user.findUnique({ where: { id: Number(requesterId) } });
      if (rUser?.role === 'agent') {
        where.agentId = Number(requesterId);
      } else if (agent) {
        where.agent = { name: { contains: agent, mode: 'insensitive' } };
      }
    } else if (agent) {
      where.agent = { name: { contains: agent, mode: 'insensitive' } };
    }
    
    if (account) {
      where.customer = {
        OR: [
          { account_no: { contains: account, mode: 'insensitive' } },
          { name: { contains: account, mode: 'insensitive' } }
        ]
      };
    }

    const [total, settlements, globalAgg] = await prisma.$transaction([
      prisma.settlement.count({ where }),
      prisma.settlement.findMany({
        where,
        include: {
          customer: { select: { id: true, name: true, account_no: true } },
          agent: { select: { id: true, name: true } },
        },
        orderBy: { createdAt: 'desc' },
        skip: (page - 1) * limit,
        take: limit,
      }),
      prisma.settlement.groupBy({
        by: ['status'],
        where,
        _count: { _all: true },
        _sum: { amount: true }
      })
    ]);

    const summaryMap: Record<string, { count: number; amount: number }> = {};
    for (const row of globalAgg) {
      summaryMap[row.status] = { count: row._count._all, amount: row._sum.amount || 0 };
    }
    const summary = {
      total: {
        count: Object.values(summaryMap).reduce((a, b) => a + b.count, 0),
        amount: Object.values(summaryMap).reduce((a, b) => a + b.amount, 0),
      },
      raised:   summaryMap['Raised']   || { count: 0, amount: 0 },
      approved: summaryMap['Approve']  || { count: 0, amount: 0 },
      rejected: summaryMap['Rejected'] || { count: 0, amount: 0 }
    };
    
    return NextResponse.json({
      data: settlements,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
      summary
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
