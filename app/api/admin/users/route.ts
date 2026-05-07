import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import crypto from 'crypto';

export const dynamic = 'force-dynamic';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const requesterId = searchParams.get('requesterId');
    
    let where: any = {};
    if (requesterId) {
      const requester = await prisma.user.findUnique({
        where: { id: Number(requesterId) },
        include: { portfoliosManaged: { select: { id: true } } }
      });
      if (requester && requester.role === 'manager') {
        const managedPortfolioIds = requester.portfoliosManaged.map(p => p.id);
        
        where = {
          OR: [
            { managerId: Number(requesterId) }, // Direct subordinates
            { id: Number(requesterId) },        // The manager themselves
            { portfoliosAgent: { some: { id: { in: managedPortfolioIds } } } } // Agents in same portfolios
          ]
        };
      }
    }

    const users = await prisma.user.findMany({
      where,
      include: {
        manager: { select: { id: true, name: true, empId: true } },
        portfoliosManaged: { select: { id: true, name: true } },
        portfoliosAgent: { select: { id: true, name: true } }
      },
      orderBy: { name: 'asc' }
    });

    const formattedUsers = users.map(u => {
      const pManaged = u.portfoliosManaged || [];
      const pAgent = u.portfoliosAgent || [];
      const allPortfolios = [...pManaged, ...pAgent].map(p => p.name).filter(Boolean);
      const uniquePortfolios = Array.from(new Set(allPortfolios));
      
      return {
        ...u,
        portfolios: uniquePortfolios.join(', ') || 'None'
      };
    });

    return NextResponse.json(formattedUsers);
  } catch (error: any) {
    console.error("GET USERS ERROR:", error);
    return NextResponse.json({ message: 'Error: ' + error.message, stack: error.stack }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const data = await request.json();

    // Validate required fields
    if (!data.name) return NextResponse.json({ message: 'Name is required' }, { status: 400 });
    if (!data.empId) return NextResponse.json({ message: 'Employee ID is required' }, { status: 400 });
    if (!data.username) return NextResponse.json({ message: 'Username is required' }, { status: 400 });
    if (!data.password) return NextResponse.json({ message: 'Password is required' }, { status: 400 });
    if (!data.role) return NextResponse.json({ message: 'Role is required' }, { status: 400 });

    // Build only valid Prisma User fields
    const createData: any = {
      name: data.name.trim(),
      username: data.username.trim(),
      empId: data.empId.trim(),
      role: data.role,
      email: data.email?.trim() || null,
      contact: data.contact?.trim() || null,
      active: data.active !== undefined ? data.active : true,
      dob: data.dob || null,
      doj: data.doj || null,
      address: data.address || null,
      // Initials auto-generated from name
      initials: data.name.trim().split(' ').map((n: string) => n[0]).join('').toUpperCase().slice(0, 3),
      // Hash password
      password: crypto.createHash('sha256').update(data.password).digest('hex'),
    };

    // Manager assignment
    if (data.managerId) {
      createData.managerId = parseInt(String(data.managerId));
    }

    const user = await prisma.user.create({ data: createData });
    return NextResponse.json(user);
  } catch (error: any) {
    console.error("CREATE USER ERROR:", error);
    // Handle unique constraint violations
    if (error.code === 'P2002') {
      const field = error.meta?.target?.[0];
      if (field === 'username') return NextResponse.json({ message: 'Username already exists. Please choose a different username.' }, { status: 409 });
      if (field === 'empId') return NextResponse.json({ message: 'Employee ID already exists.' }, { status: 409 });
    }
    return NextResponse.json({ message: 'Error creating user: ' + error.message }, { status: 500 });
  }
}

