import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export const dynamic = 'force-dynamic';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const requesterId = searchParams.get('requesterId');

    let where: any = {};
    if (requesterId) {
      const requester = await prisma.user.findUnique({
        where: { id: Number(requesterId) }
      });
      if (requester && requester.role === 'manager') {
        where = { managers: { some: { id: Number(requesterId) } } };
      }
    }

    const portfolios = await prisma.portfolio.findMany({
      where,
      include: {
        agents: { select: { id: true, name: true } },
        managers: { select: { id: true, name: true } }
      }
    });
    return NextResponse.json(portfolios);
  } catch (error: any) {
    console.error('PORTFOLIO GET ERROR:', error);
    return NextResponse.json({ message: 'Error fetching portfolios', error: error.message }, { status: 500 });
  }
}

export async function PUT(request: Request) {
  try {
    const data = await request.json();
    const { id, userId, role, action, agentIds, managerIds } = data;

    const updateData: any = {};
    if (action === 'bulk') {
      if (agentIds !== undefined) updateData.agents = { set: agentIds.map((aid: number) => ({ id: aid })) };
      if (managerIds !== undefined) updateData.managers = { set: managerIds.map((mid: number) => ({ id: mid })) };
    } else {
      if (role === 'agent') {
        updateData.agents = { [action]: { id: userId } };
      } else if (role === 'manager') {
        updateData.managers = { [action]: { id: userId } };
      }
    }

    const portfolio = await prisma.portfolio.update({
      where: { id: Number(id) },
      data: updateData,
      include: {
        agents: { select: { id: true, name: true } },
        managers: { select: { id: true, name: true } }
      }
    });
    return NextResponse.json(portfolio);
  } catch (error: any) {
    console.error('PORTFOLIO UPDATE ERROR:', error);
    return NextResponse.json({ message: 'Error updating portfolio', error: error.message }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const data = await request.json();
    const portfolio = await prisma.portfolio.create({
      data: {
        name: data.name,
        bank: data.bank || null
      }
    });
    return NextResponse.json(portfolio);
  } catch (error: any) {
    console.error('PORTFOLIO CREATE ERROR:', error);
    return NextResponse.json({ message: 'Error creating portfolio', error: error.message }, { status: 500 });
  }
}

export async function DELETE(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');

    if (!id) {
      return NextResponse.json({ message: 'Portfolio ID is required' }, { status: 400 });
    }

    // Check if portfolio exists
    const portfolio = await prisma.portfolio.findUnique({
      where: { id: Number(id) },
      include: {
        agents: { select: { id: true } },
        managers: { select: { id: true } },
        _count: { select: { customers: true } }
      }
    });

    if (!portfolio) {
      return NextResponse.json({ message: 'Portfolio not found' }, { status: 404 });
    }

    // Step 1: Disconnect all agents from this portfolio
    if (portfolio.agents.length > 0) {
      await prisma.portfolio.update({
        where: { id: Number(id) },
        data: {
          agents: { set: [] }
        }
      });
    }

    // Step 2: Disconnect all managers from this portfolio
    if (portfolio.managers.length > 0) {
      await prisma.portfolio.update({
        where: { id: Number(id) },
        data: {
          managers: { set: [] }
        }
      });
    }

    // Step 3: Nullify portfolioId on all customers belonging to this portfolio
    // (Customers are NOT deleted — they become unassigned)
    await prisma.customer.updateMany({
      where: { portfolioId: Number(id) },
      data: { portfolioId: null }
    });

    // Step 4: Delete the portfolio itself
    await prisma.portfolio.delete({ where: { id: Number(id) } });

    return NextResponse.json({ 
      message: 'Portfolio deleted successfully',
      stats: {
        agentsDisconnected: portfolio.agents.length,
        managersDisconnected: portfolio.managers.length,
        customersUnassigned: portfolio._count.customers
      }
    });
  } catch (error: any) {
    console.error('DELETE PORTFOLIO ERROR:', error);
    return NextResponse.json({ message: 'Error deleting portfolio', error: error.message }, { status: 500 });
  }
}
