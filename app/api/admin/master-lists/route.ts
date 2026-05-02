import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const type = searchParams.get('type');

    const where = type ? { type } : {};
    const lists = await prisma.masterList.findMany({
      where,
      orderBy: { value: 'asc' }
    });
    return NextResponse.json(lists);
  } catch (error: any) {
    console.error('API Error: /api/admin/master-lists', error);
    return NextResponse.json({ message: error.message }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { type, value } = body;

    if (!type || !value) {
      return NextResponse.json({ message: 'Type and Value are required' }, { status: 400 });
    }

    const newItem = await prisma.masterList.create({
      data: { type, value }
    });
    return NextResponse.json(newItem);
  } catch (error: any) {
    return NextResponse.json({ message: error.message }, { status: 500 });
  }
}

export async function DELETE(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');

    if (!id) {
      return NextResponse.json({ message: 'ID is required' }, { status: 400 });
    }

    await prisma.masterList.delete({
      where: { id: parseInt(id) }
    });
    return NextResponse.json({ success: true });
  } catch (error: any) {
    return NextResponse.json({ message: error.message }, { status: 500 });
  }
}
