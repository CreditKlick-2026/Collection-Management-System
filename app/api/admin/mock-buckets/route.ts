import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const customers = await prisma.customer.findMany({ select: { id: true } });
    
    const buckets = ['BKT-1', 'BKT-2', 'BKT-3', 'BKT-4', 'BKT-5'];
    let updated = 0;

    for (const cust of customers) {
      const randomBkt = buckets[Math.floor(Math.random() * buckets.length)];
      await prisma.customer.update({
        where: { id: cust.id },
        data: { bkt_2: randomBkt }
      });
      updated++;
    }

    return NextResponse.json({ success: true, message: `Successfully updated ${updated} customers with random buckets.` });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
