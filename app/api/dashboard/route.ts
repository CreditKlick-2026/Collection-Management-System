import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export const dynamic = 'force-dynamic';

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const month = searchParams.get('month');
  const year = searchParams.get('year');

  if (!month || !year) {
    return NextResponse.json({ message: 'Month and year required' }, { status: 400 });
  }

  try {
    // We filter by checking if the date string starts with or contains the year-month.
    // Assuming dates are stored as YYYY-MM-DD or DD-MM-YYYY or ISO.
    // For simplicity, we can fetch and filter in memory if the table is small,
    // or use prisma filters. If date is stored as "YYYY-MM-DD":
    const yearMonthStr = `${year}-${month.padStart(2, '0')}`;
    
    // Fetch Payments for the selected month
    const payments = await prisma.payment.findMany({
      where: {
        date: {
          contains: yearMonthStr
        }
      }
    });

    // Fetch PTPs for the selected month
    const ptps = await prisma.pTP.findMany({
      where: {
        date: {
          contains: yearMonthStr
        }
      }
    });

    // Fetch AuditLogs (for calls/dispositions)
    // Audit logs use DateTime so we can query properly
    const startDate = new Date(`${year}-${month.padStart(2, '0')}-01T00:00:00Z`);
    const endDate = new Date(startDate);
    endDate.setMonth(endDate.getMonth() + 1);

    const callLogs = await prisma.auditLog.findMany({
      where: {
        action: 'LEAD_DISPOSITION',
        timestamp: {
          gte: startDate,
          lt: endDate,
        }
      }
    });

    // Calculate metrics
    const collected = payments.filter(p => p.status === 'cleared' || p.status === 'pending_approval').reduce((acc, p) => acc + p.amount, 0);
    const promiseToPay = ptps.reduce((acc, p) => acc + p.amount, 0);
    const callsMade = callLogs.length;
    
    // Call Outcomes
    let rpc = 0, noAnswer = 0, wrongParty = 0;
    callLogs.forEach(log => {
      const details = log.details as any;
      const status = details?.newStatus || '';
      if (status === 'Right Party Connect' || status === 'PTP' || status.includes('Promise')) rpc++;
      else if (status === 'No Answer' || status === 'Busy' || status === 'Switched Off') noAnswer++;
      else if (status === 'Wrong Party Connect' || status === 'Does Not Exist') wrongParty++;
    });

    // Contact Rate
    const contactRate = callsMade > 0 ? Math.round(((rpc + wrongParty) / callsMade) * 100) : 0;

    // Portfolio Performance (Mocked aggregation based on fetched data or just dummy for structure if no data)
    // For a real app, we'd group by portfolio.
    const portfolios = [
      { name: 'Retail CC', penetration: 78, collected: collected * 0.6 },
      { name: 'Auto Loans', penetration: 45, collected: collected * 0.4 },
    ];

    return NextResponse.json({
      collected,
      callsMade,
      contactRate,
      promiseToPay,
      callOutcomes: { rpc, noAnswer, wrongParty },
      portfolios
    });
  } catch (error) {
    console.error('Dashboard Error:', error);
    return NextResponse.json({ message: 'Server error' }, { status: 500 });
  }
}
