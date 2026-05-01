import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const users = await prisma.user.findMany({
      include: {
        manager: { select: { name: true } },
        portfoliosManaged: { select: { name: true } },
        portfoliosAgent: { select: { name: true } }
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
    const user = await prisma.user.create({ data });
    return NextResponse.json(user);
  } catch (error) {
    return NextResponse.json({ message: 'Error creating user' }, { status: 500 });
  }
}
