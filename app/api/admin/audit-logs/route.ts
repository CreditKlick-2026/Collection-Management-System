import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

export const dynamic = 'force-dynamic';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const requesterId = searchParams.get('requesterId');
    const dateFrom = searchParams.get('dateFrom');
    const dateTo = searchParams.get('dateTo');
    const action = searchParams.get('action');
    const filterUserId = searchParams.get('userId');

    let where: any = { AND: [] };
    
    if (requesterId) {
      const requester = await prisma.user.findUnique({
        where: { id: Number(requesterId) }
      });
      if (requester) {
        const rRole = requester.role.toLowerCase();
        
        if (rRole === 'agent') {
          where.AND.push({ userId: Number(requesterId) });
        } else if (rRole === 'manager') {
          where.AND.push({
            user: {
              OR: [
                { managerId: Number(requesterId) },
                { id: Number(requesterId) }
              ]
            }
          });
        }
      }
    }

    if (filterUserId && filterUserId !== 'all') {
      where.AND.push({ userId: Number(filterUserId) });
    }

    if (dateFrom) {
      where.AND.push({ timestamp: { gte: new Date(`${dateFrom}T00:00:00.000Z`) } });
    }
    if (dateTo) {
      where.AND.push({ timestamp: { lte: new Date(`${dateTo}T23:59:59.999Z`) } });
    }

    if (action && action !== 'all') {
      where.AND.push({ action: { contains: action, mode: 'insensitive' } });
    }

    if (where.AND.length === 0) {
      where = {};
    }

    const page = parseInt(searchParams.get('page') || '1', 10);
    const limit = parseInt(searchParams.get('limit') || '20', 10);
    const skip = (page - 1) * limit;

    const [total, logs] = await Promise.all([
      prisma.auditLog.count({ where }),
      prisma.auditLog.findMany({
        where,
        orderBy: { timestamp: 'desc' },
        include: {
          user: { select: { id: true, name: true, empId: true, role: true } }
        },
        skip,
        take: limit
      })
    ]);

    return NextResponse.json({
      logs,
      total,
      totalPages: Math.ceil(total / limit),
      currentPage: page
    });
  } catch (error) {
    console.error('Error fetching audit logs:', error);
    return NextResponse.json({ error: 'Failed to fetch audit logs' }, { status: 500 });
  }
}
