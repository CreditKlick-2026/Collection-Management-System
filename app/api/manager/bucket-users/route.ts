import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export const dynamic = 'force-dynamic';

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const bkt = searchParams.get('bkt');
  const product = searchParams.get('product');

  if (!bkt) return NextResponse.json({ message: 'BKT is required' }, { status: 400 });

  try {
    const customers = await prisma.customer.findMany({
      where: {
        bkt_2: bkt,
        product: product || undefined,
        status: 'active'
      },
      select: {
        id: true,
        name: true,
        account_no: true,
        eligible_upgrade: true,
        outstanding: true
      },
      take: 50 // Limit for performance
    });
    return NextResponse.json(customers);
  } catch (error) {
    return NextResponse.json({ message: 'Error fetching bucket users' }, { status: 500 });
  }
}
