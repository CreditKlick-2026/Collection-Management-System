import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export const dynamic = 'force-dynamic';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get('page') || '1', 10);
    const limit = parseInt(searchParams.get('limit') || '20', 10);
    const skip = (page - 1) * limit;

    const dateFrom = searchParams.get('dateFrom');
    const dateTo = searchParams.get('dateTo');
    const agentId = searchParams.get('agentId');
    const searchTerm = searchParams.get('search');

    let where: any = {
      action: 'LEAD_DISPOSITION',
      entityType: 'Customer'
    };

    const andConditions: any[] = [];

    if (dateFrom) {
      andConditions.push({ timestamp: { gte: new Date(`${dateFrom}T00:00:00.000Z`) } });
    }
    if (dateTo) {
      andConditions.push({ timestamp: { lte: new Date(`${dateTo}T23:59:59.999Z`) } });
    }
    if (agentId && agentId !== 'all') {
      andConditions.push({ userId: Number(agentId) });
    }

    if (andConditions.length > 0) {
      where.AND = andConditions;
    }

    // Fetch logs
    const [total, logs] = await Promise.all([
      prisma.auditLog.count({ where }),
      prisma.auditLog.findMany({
        where,
        orderBy: { timestamp: 'desc' },
        include: {
          user: { select: { id: true, name: true, empId: true } }
        },
        skip,
        take: limit
      })
    ]);

    // Fetch related customers to get Account No and Name
    const customerIds = Array.from(new Set(logs.map(l => parseInt(l.entityId)).filter(id => !isNaN(id))));
    const customers = await prisma.customer.findMany({
      where: { id: { in: customerIds } },
      select: { id: true, account_no: true, name: true }
    });

    const customerMap = customers.reduce((acc: any, c) => {
      acc[c.id] = c;
      return acc;
    }, {});

    const formattedLogs = logs.map(log => {
      const details = log.details as any;
      const customer = customerMap[log.entityId];
      return {
        id: log.id,
        timestamp: log.timestamp,
        agent: log.user,
        customerName: customer?.name || 'Unknown',
        accountNo: customer?.account_no || 'Unknown',
        connectStatus: details?.connectStatus,
        disposition: details?.disposition,
        subDisposition: details?.subDisposition,
        actionDate: details?.date, // This is the VOC Action Date
        amount: details?.amount,
        remarks: details?.remarks
      };
    });

    return NextResponse.json({
      logs: formattedLogs,
      total,
      totalPages: Math.ceil(total / limit)
    });
  } catch (error: any) {
    console.error('Error fetching call logs:', error);
    return NextResponse.json({ error: 'Failed to fetch call logs' }, { status: 500 });
  }
}
