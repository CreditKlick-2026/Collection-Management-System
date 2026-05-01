import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const today = new Date().toISOString().split('T')[0];
    const [totalCollected, ptpTotal, pendingPayments, totalPayments] =
      await Promise.all([
        prisma.payment.aggregate({
          _sum: { amount: true },
          where: { status: 'cleared', date: today },
        }),
        prisma.pTP.aggregate({
          _sum: { amount: true },
          where: { status: { in: ['pending', 'partial'] } },
        }),
        prisma.payment.count({
          where: { status: 'pending_approval' },
        }),
        prisma.payment.count(),
      ]);

    const callsMade = 312;
    const rightParty = Math.min(148, callsMade);
    const contactRate = callsMade ? Math.round((rightParty / callsMade) * 100) : 0;

    return NextResponse.json({
      collectedToday: totalCollected._sum.amount || 0,
      callsMade,
      contactRate,
      ptpTotal: ptpTotal._sum.amount || 0,
      pendingPayments,
      totalPayments,
      outcomes: {
        rightPartyContact: 148,
        noAnswer: 96,
        wrongParty: 42,
      },
    });
  } catch (error) {
    console.error('Stats error:', error);
    return NextResponse.json({ message: 'Error fetching stats' }, { status: 500 });
  }
}
