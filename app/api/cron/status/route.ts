import { NextResponse } from 'next/server';
import { getLastCronRun } from '@/lib/ptp-scheduler';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const lastRun = await getLastCronRun();
    return NextResponse.json({
      success: true,
      lastRun: lastRun || null,
      nextRun: 'Daily at 12:00 AM IST (18:30 UTC)',
    });
  } catch (err: any) {
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}
