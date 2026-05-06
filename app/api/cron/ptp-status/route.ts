import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET(req: Request) {
  try {
    // SECURITY: In production, check for Vercel Cron header
    // if (process.env.NODE_ENV === 'production') {
    //   const authHeader = req.headers.get('authorization');
    //   if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    //     return new Response('Unauthorized', { status: 401 });
    //   }
    // }

    const todayStr = new Date().toISOString().split('T')[0];
    console.log(`[Vercel Cron] Running PTP sync for ${todayStr}...`);

    // 1. Find all pending PTPs that are older than today
    const overduePtps = await prisma.pTP.findMany({
      where: {
        status: 'pending',
        date: { lt: todayStr }
      }
    });

    let broken = 0;
    let paid = 0;

    for (const ptp of overduePtps) {
      // 2. Check if a payment was received on or after the PTP date
      const payment = await prisma.payment.findFirst({
        where: {
          customerId: ptp.customerId,
          status: 'cleared',
          date: { gte: ptp.date }
        }
      });

      if (payment) {
        // Auto-Paid
        await prisma.pTP.update({
          where: { id: ptp.id },
          data: { 
            status: 'paid',
            remarks: (ptp.remarks || '') + `\n[Auto] Paid via Payment ID: ${payment.id}`
          }
        });
        paid++;
      } else {
        // Auto-Broken & Escalate to Manager
        await prisma.pTP.update({
          where: { id: ptp.id },
          data: { 
            status: 'broken',
            transferStatus: 'escalated',
            remarks: (ptp.remarks || '') + '\n[Auto-Broken] No payment tracked. Sent for Manager Review.'
          }
        });
        broken++;
      }
    }

    return NextResponse.json({ 
      success: true, 
      message: `PTP Sync Complete.`,
      stats: { total_checked: overduePtps.length, auto_broken: broken, auto_paid: paid }
    });

  } catch (error: any) {
    console.error('[Vercel Cron Error]', error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
