import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export const dynamic = 'force-dynamic';

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
  const month = searchParams.get('month');
  const year = searchParams.get('year');
  const userId = searchParams.get('userId');

  try {
    let portfolioIds: number[] = [];
    let subordinateIds: number[] = [];
    let isAdmin = false;
    let isManager = false;

    if (userId) {
      const user = await prisma.user.findUnique({
        where: { id: Number(userId) },
        include: {
          portfoliosManaged: { select: { id: true } },
          portfoliosAgent: { select: { id: true } },
          subordinates: { select: { id: true } }
        }
      });
      if (user) {
        isAdmin = user.role === 'admin';
        isManager = user.role === 'manager';
        if (isManager) {
          subordinateIds = user.subordinates.map(s => s.id);
        }
        if (!isAdmin) {
          portfolioIds = [
            ...user.portfoliosManaged.map(p => p.id),
            ...user.portfoliosAgent.map(p => p.id)
          ];
        }
      }
    }

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

    let dateFilter: any = {};
    if (year) {
      const yearInt = parseInt(year);
      if (month) {
        const monthInt = parseInt(month) - 1; // 0-indexed
        const startDate = new Date(yearInt, monthInt, 1);
        const endDate = new Date(yearInt, monthInt + 1, 1);
        dateFilter = { createdAt: { gte: startDate, lt: endDate } };
      } else {
        const startDate = new Date(yearInt, 0, 1);
        const endDate = new Date(yearInt + 1, 0, 1);
        dateFilter = { createdAt: { gte: startDate, lt: endDate } };
      }
    }

    const where: any = {
      AND: [
        q ? { OR: orFilters } : {},
        status ? { status } : { status: { not: 'archived' } },
        dpdMin ? { dpd: { gte: Number(dpdMin) } } : {},
        dpdMax ? { dpd: { lte: Number(dpdMax) } } : {},
        outMin ? { outstanding: { gte: Number(outMin) } } : {},
        outMax ? { outstanding: { lte: Number(outMax) } } : {},
        dateFilter
      ]
    };

    // Access control: Portfolios + Manager/Agent scoping
    if (!isAdmin) {
      // 1. Portfolio Filter
      if (portfolio) {
        const pId = Number(portfolio);
        if (portfolioIds.includes(pId)) {
          where.AND.push({ portfolioId: pId });
        } else {
          where.AND.push({ id: -1 }); // No access
        }
      } else {
        where.AND.push({ portfolioId: { in: portfolioIds } });
      }

      // 2. Role-based scoping (Manager see subordinates + portfolio leads, Agent see self)
      if (isManager) {
        where.AND.push({
          OR: [
            { assignedAgentId: { in: [...subordinateIds, Number(userId)] } },
            { portfolioId: { in: portfolioIds } }
          ]
        });
      } else {
        // Assume Agent or other role — see only self
        where.AND.push({ assignedAgentId: Number(userId) });
      }
    } else if (portfolio) {
      // Admin filtering by specific portfolio
      where.AND.push({ portfolioId: Number(portfolio) });
    }

    const paginate = searchParams.get('paginate') === 'true';
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '25');

    const queryOptions: any = {
      where,
      include: {
        assignedAgent: {
          select: { id: true, name: true, empId: true }
        },
        portfolio: true,
        settlements: {
          take: 1,
          orderBy: { createdAt: 'desc' },
          select: { status: true, amount: true, reason: true }
        }
      },
      orderBy: { dpd: 'desc' }
    };

    if (paginate) {
      const skip = (page - 1) * limit;
      const [leads, total] = await Promise.all([
        prisma.customer.findMany({
          ...queryOptions,
          skip,
          take: limit
        }),
        prisma.customer.count({ where })
      ]);
      return NextResponse.json({ leads, total });
    } else {
      const leads = await prisma.customer.findMany(queryOptions);
      return NextResponse.json(leads);
    }
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
