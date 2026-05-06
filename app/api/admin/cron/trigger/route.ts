import { NextResponse } from 'next/server';
import { initPtpCron, ptpQueue } from '@/lib/ptp-queue';

export async function POST(req: Request) {
  try {
    // Initialize the daily cron job
    await initPtpCron();
    
    // Manually trigger a check right now
    await ptpQueue.add('check-overdue-ptps', { manual: true });

    return NextResponse.json({ success: true, message: 'PTP Automation Initialized & Manual Check Triggered.' });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
