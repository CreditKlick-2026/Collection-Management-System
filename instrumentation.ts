/**
 * Next.js Instrumentation Hook
 * Yeh file server start hote hi ek baar run hoti hai.
 * Isme hum BullMQ PTP worker & daily cron initialize karte hain.
 * Docs: https://nextjs.org/docs/app/building-your-application/optimizing/instrumentation
 */

export async function register() {
  // Sirf Node.js runtime mein run karo (Edge runtime mein nahi)
  if (process.env.NEXT_RUNTIME === 'nodejs') {
    const { startPTPScheduler } = await import('./lib/ptp-scheduler');
    await startPTPScheduler();
  }
}
