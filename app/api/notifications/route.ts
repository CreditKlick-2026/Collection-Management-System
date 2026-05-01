import { NextResponse } from 'next/server';
import redis from '@/lib/redis';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const today = new Date().toISOString().split('T')[0];
    const redisKey = `notifs:ptp:${today}`;
    
    const notifications = await redis.lrange(redisKey, 0, -1);
    const parsed = notifications.map(n => JSON.parse(n));
    
    return NextResponse.json(parsed);
  } catch (error) {
    console.error('[NOTIFICATIONS ERROR]', error);
    return NextResponse.json({ message: 'Error fetching notifications' }, { status: 500 });
  }
}

export async function DELETE() {
    try {
        const today = new Date().toISOString().split('T')[0];
        const redisKey = `notifs:ptp:${today}`;
        await redis.del(redisKey);
        return NextResponse.json({ success: true });
    } catch (error) {
        return NextResponse.json({ message: 'Error clearing notifications' }, { status: 500 });
    }
}
