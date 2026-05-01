import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const columns = await prisma.leadColumn.findMany({
      orderBy: { order: 'asc' }
    });
    return NextResponse.json(columns);
  } catch (error) {
    return NextResponse.json({ message: 'Error fetching columns' }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const data = await request.json();
    const column = await prisma.leadColumn.create({ data });
    return NextResponse.json(column);
  } catch (error) {
    return NextResponse.json({ message: 'Error creating column' }, { status: 500 });
  }
}

export async function PUT(request: Request) {
  try {
    const { id, ...data } = await request.json();
    const column = await prisma.leadColumn.update({
      where: { id },
      data
    });
    return NextResponse.json(column);
  } catch (error) {
    return NextResponse.json({ message: 'Error updating column' }, { status: 500 });
  }
}

export async function DELETE(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');
    if (!id) return NextResponse.json({ message: 'ID required' }, { status: 400 });
    
    await prisma.leadColumn.delete({
      where: { id: Number(id) }
    });
    return NextResponse.json({ message: 'Column deleted' });
  } catch (error) {
    return NextResponse.json({ message: 'Error deleting column' }, { status: 500 });
  }
}
