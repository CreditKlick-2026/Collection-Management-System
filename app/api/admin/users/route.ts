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

    // Format portfolios for the frontend
    const formattedUsers = users.map(u => ({
      ...u,
      portfolios: [...u.portfoliosManaged, ...u.portfoliosAgent].map(p => p.name).join(', ')
    }));

    return NextResponse.json(formattedUsers);
  } catch (error) {
    return NextResponse.json({ message: 'Error' }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const data = await request.json();
    
    // Clean data for Prisma
    const { confirmPassword, ...prismaData } = data;
    
    if (prismaData.managerId) {
      prismaData.managerId = parseInt(prismaData.managerId);
    }

    // Hash password
    if (prismaData.password) {
      prismaData.password = crypto.createHash('sha256').update(prismaData.password).digest('hex');
    }

    // Initials
    if (prismaData.name) {
      prismaData.initials = prismaData.name.split(' ').map((n: string) => n[0]).join('').toUpperCase();
    }

    const user = await prisma.user.create({ 
      data: prismaData 
    });
    return NextResponse.json(user);
  } catch (error) {
    console.error("CREATE USER ERROR:", error);
    return NextResponse.json({ message: 'Error creating user' }, { status: 500 });
  }
}
