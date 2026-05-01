import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import redis from '@/lib/redis';

export const dynamic = 'force-dynamic';

const CACHE_TTL = 60; // 60 seconds

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '25');
    const skip = (page - 1) * limit;

    const statusFilter = searchParams.get('status');
    const searchStr = searchParams.get('search')?.toLowerCase() || '';

    const cacheKey = `call-logs:${id}:page:${page}:limit:${limit}:status:${statusFilter || 'all'}:search:${searchStr || 'none'}`;

    // Try Redis cache first
    try {
      const cached = await redis.get(cacheKey);
      if (cached) {
        return NextResponse.json(JSON.parse(cached), {
          headers: { 'X-Cache': 'HIT' }
        });
      }
    } catch (redisErr) {
      console.warn('[REDIS] Cache read failed:', redisErr);
    }

    const whereCondition = {
      entityType: 'Customer',
      entityId: id,
      action: 'LEAD_DISPOSITION'
    };

    // Fetch all logs for this customer (usually <1000, very fast)
    let allLogs = await prisma.auditLog.findMany({
      where: whereCondition,
      include: {
        user: { select: { id: true, name: true, empId: true, role: true } }
      },
      orderBy: { timestamp: 'desc' },
    });

    // Calculate overall stats before filtering
    let rpcCount = 0;
    let ptpCount = 0;
    let ncCount = 0;

    allLogs.forEach(log => {
      const d = log.details as any;
      if (d?.connectStatus === 'Right Party Connect') rpcCount++;
      if (d?.disposition === 'Promised to Pay') ptpCount++;
      if (d?.connectStatus === 'Not Connected') ncCount++;
    });

    // Apply filters
    if (statusFilter || searchStr) {
      allLogs = allLogs.filter(l => {
        const d = l.details as any;
        if (statusFilter && d?.connectStatus !== statusFilter) return false;
        if (searchStr) {
          return (
            d?.disposition?.toLowerCase().includes(searchStr) ||
            d?.subDisposition?.toLowerCase().includes(searchStr) ||
            d?.remarks?.toLowerCase().includes(searchStr) ||
            l.user?.name?.toLowerCase().includes(searchStr)
          );
        }
        return true;
      });
    }

    const totalCount = allLogs.length;
    const paginatedLogs = allLogs.slice(skip, skip + limit);

    const responseData = {
      logs: paginatedLogs,
      totalCount,
      stats: { rpcCount, ptpCount, ncCount }
    };

    // Write to Redis cache
    try {
      await redis.setex(cacheKey, CACHE_TTL, JSON.stringify(responseData));
    } catch (redisErr) {
      console.warn('[REDIS] Cache write failed:', redisErr);
    }

    return NextResponse.json(responseData, {
      headers: { 'X-Cache': 'MISS' }
    });
  } catch (error: any) {
    console.error('[CALL LOGS ERROR]', error);
    return NextResponse.json({ message: 'Error fetching call logs: ' + error.message }, { status: 500 });
  }
}

// Invalidate cache after a new disposition is saved
export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    await redis.del(`call-logs:${id}`);
    return NextResponse.json({ success: true });
  } catch (error: any) {
    return NextResponse.json({ message: error.message }, { status: 500 });
  }
}
