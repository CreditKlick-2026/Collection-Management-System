import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

export const dynamic = 'force-dynamic';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const requesterId = searchParams.get('requesterId');

    let where: any = {};
    if (requesterId) {
      const requester = await prisma.user.findUnique({
        where: { id: Number(requesterId) }
      });
      if (requester && requester.role === 'manager') {
        where = {
          user: {
            OR: [
              { managerId: Number(requesterId) },
              { id: Number(requesterId) }
            ]
          }
        };
      }
    }

    const logs = await prisma.auditLog.findMany({
      where,
      orderBy: { timestamp: 'desc' },
      include: {
        user: { select: { id: true, name: true, empId: true, role: true } }
      },
      take: 200 // Increased limit slightly
    });

    return NextResponse.json(logs);
  } catch (error) {
    console.error('Error fetching audit logs:', error);
    return NextResponse.json({ error: 'Failed to fetch audit logs' }, { status: 500 });
  }
}
