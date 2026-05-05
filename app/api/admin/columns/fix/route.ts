import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export const dynamic = 'force-dynamic';

export async function GET() {
  await prisma.leadColumn.upsert({
    where: { key: 'portfolio' },
    update: {},
    create: {
      key: 'portfolio',
      label: 'Portfolio',
      order: 23,
      type: 'text',
      visible: true,
      showInProfile: true
    }
  });

  await prisma.leadColumn.upsert({
    where: { key: 'settlement' },
    update: {},
    create: {
      key: 'settlement',
      label: 'Settlement',
      order: 24,
      type: 'badge',
      visible: true,
      showInProfile: true
    }
  });

  return NextResponse.json({ success: true });
}
