import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

export const dynamic = 'force-dynamic';

// ─── Security ────────────────────────────────────────────────────────────────
// Vercel automatically sends this header when invoking crons.
// Set CRON_SECRET in Vercel env vars → Settings → Environment Variables.
// Locally this check is skipped so you can test via browser.
function isAuthorized(req: Request): boolean {
  if (process.env.NODE_ENV !== 'production') return true;
  const auth = req.headers.get('authorization');
  return auth === `Bearer ${process.env.CRON_SECRET}`;
}

// ─── Main Cron Handler ───────────────────────────────────────────────────────
export async function GET(req: Request) {
  if (!isAuthorized(req)) {
    return new Response('Unauthorized', { status: 401 });
  }

  const startTime = Date.now();

  // IST-aware "today" — PTP dates are stored as YYYY-MM-DD strings
  // We use IST offset (+5:30) so the job runs correctly even when Vercel
  // servers are in UTC.
  const now = new Date();
  const istOffset = 5.5 * 60 * 60 * 1000; // ms
  const istNow = new Date(now.getTime() + istOffset);
  const todayIST = istNow.toISOString().split('T')[0]; // "YYYY-MM-DD"

  console.log(`[Cron] ─── PTP Auto-Sync ─── IST date: ${todayIST}`);

  try {
    // ── Step 1: Fetch all PENDING PTPs whose promised date < today ────────
    const overduePtps = await prisma.pTP.findMany({
      where: {
        status: 'pending',
        date: { lt: todayIST },        // strictly before today
      },
      select: {
        id: true,
        customerId: true,
        date: true,
        remarks: true,
        agentId: true,
        originalAgentId: true,
      },
    });

    console.log(`[Cron] Overdue PTPs found: ${overduePtps.length}`);

    if (overduePtps.length === 0) {
      return NextResponse.json({
        success: true,
        message: 'No overdue PTPs found.',
        stats: { total_checked: 0, auto_broken: 0, auto_paid: 0 },
        duration_ms: Date.now() - startTime,
      });
    }

    let autoBroken = 0;
    let autoPaid = 0;
    const errors: string[] = [];

    for (const ptp of overduePtps) {
      try {
        // ── Step 2: Check if a cleared payment exists on/after PTP date ──
        const payment = await prisma.payment.findFirst({
          where: {
            customerId: ptp.customerId,
            status: 'cleared',
            date: { gte: ptp.date },   // payment on or after the promised date
          },
          select: { id: true },
        });

        if (payment) {
          // ── CASE A: Payment found → Auto-Paid ──────────────────────────
          await prisma.pTP.update({
            where: { id: ptp.id },
            data: {
              status: 'paid',
              remarks:
                (ptp.remarks ? ptp.remarks + '\n' : '') +
                `[Auto] Marked paid via Payment #${payment.id} on ${new Date().toISOString()}`,
            },
          });
          autoPaid++;
          console.log(`[Cron] ✓ PTP ${ptp.id} → PAID (Payment #${payment.id})`);

        } else {
          // ── CASE B: No payment → Auto-Broken & Escalate to Manager ─────
          await prisma.pTP.update({
            where: { id: ptp.id },
            data: {
              status: 'broken',
              // 'escalated' makes this PTP appear in Manager's Escalations tab
              transferStatus: 'escalated',
              remarks:
                (ptp.remarks ? ptp.remarks + '\n' : '') +
                `[Auto-Broken] No payment found. Auto-escalated on ${new Date().toISOString()}`,
            },
          });
          autoBroken++;
          console.log(`[Cron] ✗ PTP ${ptp.id} → BROKEN & ESCALATED`);
        }
      } catch (rowErr: any) {
        errors.push(`PTP ${ptp.id}: ${rowErr.message}`);
        console.error(`[Cron] Error processing PTP ${ptp.id}:`, rowErr.message);
      }
    }

    const duration = Date.now() - startTime;

    console.log(
      `[Cron] Done in ${duration}ms — Broken: ${autoBroken}, Paid: ${autoPaid}, Errors: ${errors.length}`
    );

    return NextResponse.json({
      success: true,
      message: 'PTP Auto-Sync complete.',
      stats: {
        total_checked: overduePtps.length,
        auto_broken: autoBroken,
        auto_paid: autoPaid,
        errors: errors.length,
      },
      error_details: errors.length ? errors : undefined,
      duration_ms: duration,
      ran_at_ist: todayIST,
    });

  } catch (error: any) {
    console.error('[Cron] Fatal error:', error.message);
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    );
  }
}
