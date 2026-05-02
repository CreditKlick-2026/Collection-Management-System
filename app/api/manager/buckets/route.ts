import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const buckets = await prisma.customer.findMany({
      distinct: ['bkt_2'],
      select: { bkt_2: true },
      where: { bkt_2: { not: null } },
      orderBy: { bkt_2: 'asc' }
    });
    
    return NextResponse.json(buckets.map(b => b.bkt_2).filter(Boolean));
  } catch (error) {
    return NextResponse.json({ message: 'Error fetching buckets' }, { status: 500 });
  }
}
