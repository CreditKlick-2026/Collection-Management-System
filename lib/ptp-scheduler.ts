/**
 * PTP Scheduler — lib/ptp-scheduler.ts
 *
 * Two-tier approach:
 * 1. DELAYED JOB: Jab PTP create ho, exact PTP date ke midnight par ek job fire karo
 * 2. DAILY SWEEP CRON: Backup safety net — missed jobs ko catch karo
 */

import { Queue, Worker, Job } from 'bullmq';
import { redisConnection } from './redis';
import prisma from './prisma';

const QUEUE_NAME   = 'ptp-queue';
const LAST_RUN_KEY = 'ptp:cron:lastRun';

// Shared queue instance (used by both scheduler & API routes to add jobs)
let ptpQueue: Queue | null = null;
let ptpWorker: Worker | null = null;

// ─── IST Midnight Calculator ──────────────────────────────────────────────────
// Given a date string "YYYY-MM-DD", return ms delay until that date's
// 12:00 AM IST (= 18:30 UTC previous day)
export function msUntilPTPDate(ptpDateStr: string): number {
  // PTP date e.g. "2026-05-10"
  // We want to fire at: 2026-05-10 00:00:00 IST = 2026-05-09 18:30:00 UTC
  const [year, month, day] = ptpDateStr.split('-').map(Number);

  // 12:00 AM IST = 18:30 UTC of the PREVIOUS calendar day
  const fireAtUTC = Date.UTC(year, month - 1, day, 18, 30, 0); // 18:30 UTC = 00:00 IST next day

  const now = Date.now();
  const delay = fireAtUTC - now;

  // If date already passed, fire immediately (for backfill/old PTPs)
  return delay > 0 ? delay : 0;
}

// ─── Process a Single PTP ─────────────────────────────────────────────────────
async function processSinglePTP(ptpId: number) {
  const ptp = await prisma.pTP.findUnique({
    where: { id: ptpId },
    select: { id: true, customerId: true, date: true, status: true, remarks: true },
  });

  // Skip if already resolved
  if (!ptp || ptp.status !== 'pending') {
    console.log(`[PTP-Worker] PTP ${ptpId} already resolved (${ptp?.status}). Skipping.`);
    return;
  }

  // Check payment
  const payment = await prisma.payment.findFirst({
    where: {
      customerId: ptp.customerId,
      status:     'cleared',
      date:       { gte: ptp.date },
    },
    select: { id: true },
  });

  if (payment) {
    await prisma.pTP.update({
      where: { id: ptpId },
      data: {
        status:  'paid',
        remarks: (ptp.remarks ? ptp.remarks + '\n' : '') +
                 `[Auto] Paid via Payment #${payment.id} at ${new Date().toISOString()}`,
      },
    });
    console.log(`[PTP-Worker] ✓ PTP ${ptpId} → PAID (Payment #${payment.id})`);
  } else {
    await prisma.pTP.update({
      where: { id: ptpId },
      data: {
        status:         'broken',
        transferStatus: 'escalated',
        remarks: (ptp.remarks ? ptp.remarks + '\n' : '') +
                 `[Auto-Broken] No payment found. Escalated at ${new Date().toISOString()}`,
      },
    });
    console.log(`[PTP-Worker] ✗ PTP ${ptpId} → BROKEN & ESCALATED`);
  }
}

// ─── Daily Sweep (Safety Net) ─────────────────────────────────────────────────
async function processDailySweep() {
  const istOffset = 5.5 * 60 * 60 * 1000;
  const todayIST  = new Date(Date.now() + istOffset).toISOString().split('T')[0];

  console.log(`[PTP-Sweep] Running safety sweep for ${todayIST}...`);

  // Find all pending PTPs whose date has passed (missed by delayed jobs)
  const overduePtps = await prisma.pTP.findMany({
    where: { status: 'pending', date: { lt: todayIST } },
    select: { id: true },
  });

  console.log(`[PTP-Sweep] Found ${overduePtps.length} missed PTPs to process.`);

  let autoBroken = 0;
  let autoPaid   = 0;

  for (const ptp of overduePtps) {
    await processSinglePTP(ptp.id);
    const updated = await prisma.pTP.findUnique({ where: { id: ptp.id }, select: { status: true } });
    if (updated?.status === 'broken') autoBroken++;
    if (updated?.status === 'paid')   autoPaid++;
  }

  const result = {
    ranAt:        new Date().toISOString(),
    ranAtIST:     todayIST,
    totalChecked: overduePtps.length,
    autoBroken,
    autoPaid,
  };

  if (redisConnection) {
    await redisConnection.set(LAST_RUN_KEY, JSON.stringify(result), 'EX', 7 * 24 * 3600);
  }

  console.log(`[PTP-Sweep] Done — Broken: ${autoBroken}, Paid: ${autoPaid}`);
  return result;
}

// ─── Public: Schedule a single PTP job when PTP is created ───────────────────
export async function schedulePTPJob(ptpId: number, ptpDate: string) {
  if (!ptpQueue) {
    console.warn('[PTP-Scheduler] Queue not initialized. PTP job skipped.');
    return;
  }

  const delay = msUntilPTPDate(ptpDate);
  const delayHours = Math.round(delay / 1000 / 60 / 60);

  await ptpQueue.add(
    'check-single-ptp',
    { ptpId },
    {
      delay,
      jobId:             `ptp-${ptpId}`, // Unique — prevents duplicates
      removeOnComplete:  true,
      removeOnFail:      { count: 3 },
    }
  );

  console.log(`[PTP-Scheduler] Scheduled PTP ${ptpId} for ${ptpDate} IST midnight (in ~${delayHours}h)`);

  // Also store in Redis for audit: ptp:<id>:scheduled
  if (redisConnection) {
    await redisConnection.set(
      `ptp:${ptpId}:scheduled`,
      JSON.stringify({ ptpId, ptpDate, scheduledAt: new Date().toISOString(), delayMs: delay }),
      'EX', 30 * 24 * 3600 // 30 days
    );
  }
}

// ─── Start Scheduler (called from instrumentation.ts on server boot) ──────────
export async function startPTPScheduler() {
  if (!redisConnection) {
    console.warn('[PTP-Scheduler] Redis not available — auto-broken will not run.');
    return;
  }

  try {
    // 0. Test connection first so BullMQ doesn't crash the server if Redis is down
    await redisConnection.ping();
  } catch (err) {
    console.warn('[PTP-Scheduler] Redis server is down. PTP scheduler disabled.');
    return;
  }

  try {
    // 1. Initialize Queue
    ptpQueue = new Queue(QUEUE_NAME, { connection: redisConnection });

    // 2. Daily safety sweep cron (catches any missed delayed jobs)
    //    18:30 UTC = 12:00 AM IST
    const repeatable = await ptpQueue.getRepeatableJobs();
    if (!repeatable.find(j => j.name === 'daily-sweep')) {
      await ptpQueue.add('daily-sweep', {}, {
        repeat:           { pattern: '30 18 * * *' },
        removeOnComplete: { count: 5 },
        removeOnFail:     { count: 10 },
      });
      console.log('[PTP-Scheduler] Daily sweep cron registered at 18:30 UTC (12:00 AM IST)');
    }

    // 3. Worker — handles both single PTP jobs & daily sweep
    ptpWorker = new Worker(
      QUEUE_NAME,
      async (job: Job) => {
        if (job.name === 'check-single-ptp') {
          await processSinglePTP(job.data.ptpId);
        } else if (job.name === 'daily-sweep') {
          await processDailySweep();
        }
      },
      { connection: redisConnection, concurrency: 5 }
    );

    ptpWorker.on('completed', (job) =>
      console.log(`[PTP-Worker] ✓ Job "${job.name}" #${job.id} done`)
    );
    ptpWorker.on('failed', (job, err) =>
      console.error(`[PTP-Worker] ✗ Job "${job?.name}" #${job?.id} failed:`, err.message)
    );

    console.log('[PTP-Scheduler] ✓ Started. Delayed jobs + daily sweep active.');

  } catch (err: any) {
    console.error('[PTP-Scheduler] Startup failed:', err.message);
  }
}

// ─── Read last sweep result (for status API) ──────────────────────────────────
export async function getLastCronRun() {
  if (!redisConnection) return null;
  try {
    const raw = await redisConnection.get(LAST_RUN_KEY);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

// ─── Get individual PTP schedule info ─────────────────────────────────────────
export async function getPTPScheduleInfo(ptpId: number) {
  if (!redisConnection) return null;
  try {
    const raw = await redisConnection.get(`ptp:${ptpId}:scheduled`);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}
