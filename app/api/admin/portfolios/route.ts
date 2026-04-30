import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET() {
  try {
    const portfolios = await prisma.portfolio.findMany({
      include: {
        agents: { select: { name: true } },
        managers: { select: { name: true } }
      }
    });
    return NextResponse.json(portfolios);
  } catch (error) {
    return NextResponse.json({ message: 'Error' }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const data = await request.json();
    const portfolio = await prisma.portfolio.create({
      data: {
        id: data.id,
        name: data.name
      }
    });
    return NextResponse.json(portfolio);
  } catch (error) {
    return NextResponse.json({ message: 'Error' }, { status: 500 });
  }
}
