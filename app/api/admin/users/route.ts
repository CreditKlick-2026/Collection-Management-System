import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const users = await prisma.user.findMany({
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

    const user = await prisma.user.create({ 
      data: prismaData 
    });
    return NextResponse.json(user);
  } catch (error) {
    console.error("CREATE USER ERROR:", error);
    return NextResponse.json({ message: 'Error creating user' }, { status: 500 });
  }
}
