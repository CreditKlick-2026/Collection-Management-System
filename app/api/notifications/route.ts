import { NextResponse } from 'next/server';
import { redisConnection as redis } from '@/lib/redis';
import prisma from '@/lib/prisma';
export const dynamic = 'force-dynamic';

export async function GET(req: Request) {
  if (!redis) {
    return NextResponse.json([]);
  }
  try {
    const url = new URL(req.url);
    const requesterId = url.searchParams.get('requesterId');
    const today = new Date().toISOString().split('T')[0];
    const redisKey = `notifs:ptp:${today}`;

    const notifications = await redis.lrange(redisKey, 0, -1);
    let parsed = notifications.map(n => JSON.parse(n));

    if (requesterId) {
      const user = await prisma.user.findUnique({ where: { id: parseInt(requesterId) } });
      if (user?.role === 'agent') {
        parsed = parsed.filter(n => n.agentId === parseInt(requesterId));
      }
    }

    return NextResponse.json(parsed);
  } catch (error) {
    return NextResponse.json([]);
  }
}

export async function DELETE(req: Request) {
  if (!redis) {
    return NextResponse.json({ success: true });
  }
  try {
    const url = new URL(req.url);
    const requesterId = url.searchParams.get('requesterId');
    const today = new Date().toISOString().split('T')[0];
    const redisKey = `notifs:ptp:${today}`;

    if (requesterId) {
      const user = await prisma.user.findUnique({ where: { id: parseInt(requesterId) } });
      if (user?.role === 'agent') {
        const notifications = await redis.lrange(redisKey, 0, -1);
        const parsed = notifications.map(n => JSON.parse(n));
        const others = parsed.filter(n => n.agentId !== parseInt(requesterId));
        await redis.del(redisKey);
        if (others.length > 0) {
          await redis.lpush(redisKey, ...others.map(o => JSON.stringify(o)).reverse());
        }
        return NextResponse.json({ success: true });
      }
    }

    await redis.del(redisKey);
    return NextResponse.json({ success: true });
  } catch (error) {
    return NextResponse.json({ message: 'Error clearing notifications' }, { status: 500 });
  }
}
