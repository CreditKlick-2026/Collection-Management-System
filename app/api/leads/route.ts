import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const q = searchParams.get('q') || '';
  const status = searchParams.get('status') || '';
  const portfolio = searchParams.get('portfolio') || '';
  const searchType = searchParams.get('searchType') || 'all';
  const dpdMin = searchParams.get('dpdMin');
  const dpdMax = searchParams.get('dpdMax');
  const outMin = searchParams.get('outMin');
  const outMax = searchParams.get('outMax');

  try {
    const orFilters: any[] = [];
    if (q) {
      if (searchType === 'name') {
        orFilters.push({ name: { contains: q, mode: 'insensitive' } });
      } else if (searchType === 'mobile') {
        orFilters.push({ mobile: { contains: q } }, { alt_mobile: { contains: q } });
      } else if (searchType === 'account') {
        orFilters.push({ account_no: { contains: q, mode: 'insensitive' } });
      } else if (searchType === 'pan') {
        orFilters.push({ pan: { contains: q, mode: 'insensitive' } });
      } else {
        orFilters.push(
          { name: { contains: q, mode: 'insensitive' } },
          { account_no: { contains: q, mode: 'insensitive' } },
          { mobile: { contains: q } },
          { alt_mobile: { contains: q } },
          { pan: { contains: q, mode: 'insensitive' } },
          { city: { contains: q, mode: 'insensitive' } }
        );
      }
    }
    const leads = await prisma.customer.findMany({
      where: {
        AND: [
          q ? { OR: orFilters } : {},
          status ? { status } : {},
          portfolio ? { portfolioId: portfolio } : {},
          dpdMin ? { dpd: { gte: Number(dpdMin) } } : {},
          dpdMax ? { dpd: { lte: Number(dpdMax) } } : {},
          outMin ? { outstanding: { gte: Number(outMin) } } : {},
          outMax ? { outstanding: { lte: Number(outMax) } } : {},
        ]
      },
      include: {
        assignedAgent: {
          select: { id: true, name: true, empId: true }
        },
        portfolio: true
      },
      orderBy: { dpd: 'desc' }
    });

    return NextResponse.json(leads);
  } catch (error) {
    console.error('Fetch leads error:', error);
    return NextResponse.json({ message: 'Error fetching leads' }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const data = await request.json();
    const lead = await prisma.customer.create({ data });
    return NextResponse.json(lead);
  } catch (error) {
    console.error('Create lead error:', error);
    return NextResponse.json({ message: 'Error creating lead' }, { status: 500 });
  }
}
