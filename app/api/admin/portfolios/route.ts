import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET() {
  try {
    const portfolios = await prisma.portfolio.findMany({
      include: {
        agents: { select: { id: true, name: true } },
        managers: { select: { id: true, name: true } }
      }
    });
    return NextResponse.json(portfolios);
  } catch (error) {
    return NextResponse.json({ message: 'Error' }, { status: 500 });
  }
}

export async function PUT(request: Request) {
  try {
    const data = await request.json();
    const { id, userId, role, action } = data;

    const updateData: any = {};
    if (role === 'agent') {
      updateData.agents = { [action]: { id: userId } };
    } else if (role === 'manager') {
      updateData.managers = { [action]: { id: userId } };
    }

    const portfolio = await prisma.portfolio.update({
      where: { id },
      data: updateData,
      include: {
        agents: { select: { id: true, name: true } },
        managers: { select: { id: true, name: true } }
      }
    });
    return NextResponse.json(portfolio);
  } catch (error) {
    console.error(error);
    return NextResponse.json({ message: 'Error updating portfolio' }, { status: 500 });
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
    return NextResponse.json({ message: 'Error creating portfolio' }, { status: 500 });
  }
}
