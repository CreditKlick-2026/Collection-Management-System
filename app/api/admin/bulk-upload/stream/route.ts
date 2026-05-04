import { prisma } from '@/lib/prisma';
import uploadEventBus from '@/lib/upload-events';

export const dynamic = 'force-dynamic';

/**
 * SSE endpoint — streams real-time bulk upload progress to the browser.
 *
 * Flow:
 *   Worker Thread → parentPort.postMessage()
 *     → route.ts worker.on('message') → uploadEventBus.emit(`job:${jobId}`)
 *       → this handler listens → pushes SSE event → EventSource in browser
 */
export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const jobId = searchParams.get('jobId');

  if (!jobId) {
    return new Response('jobId required', { status: 400 });
  }

  const encoder = new TextEncoder();

  const stream = new ReadableStream({
    async start(controller) {
      const send = (data: object) => {
        try {
          controller.enqueue(encoder.encode(`data: ${JSON.stringify(data)}\n\n`));
        } catch {}
      };

      // 1. Send current job state immediately on connect
      try {
        const job            = await prisma.bulkUploadJob.findUnique({ where: { id: jobId } });
        const totalCustomers = await prisma.customer.count();
        if (job) send({ type: 'snapshot', job, totalCustomers });
      } catch {}

      // 2. Listen for real-time events from the worker
      const listener = async (msg: any) => {
        // Attach live DB count to every progress event
        let totalCustomers: number | undefined;
        try {
          if (msg.type === 'progress' || msg.type === 'done') {
            totalCustomers = await prisma.customer.count();
          }
        } catch {}

        send({ ...msg, totalCustomers });

        // On completion, send final snapshot then close
        if (msg.type === 'done' || msg.type === 'error') {
          try {
            const job = await prisma.bulkUploadJob.findUnique({ where: { id: jobId } });
            const tc  = await prisma.customer.count();
            if (job) send({ type: 'snapshot', job, totalCustomers: tc });
          } catch {}
          setTimeout(() => {
            uploadEventBus.off(`job:${jobId}`, listener);
            try { controller.close(); } catch {}
          }, 500);
        }
      };

      uploadEventBus.on(`job:${jobId}`, listener);

      // 3. Heartbeat every 15s to keep connection alive (prevents proxy timeouts)
      const heartbeat = setInterval(() => {
        try { controller.enqueue(encoder.encode(': ping\n\n')); } catch {}
      }, 15_000);

      // 4. Cleanup on client disconnect
      request.signal.addEventListener('abort', () => {
        clearInterval(heartbeat);
        uploadEventBus.off(`job:${jobId}`, listener);
        try { controller.close(); } catch {}
      });
    }
  });

  return new Response(stream, {
    headers: {
      'Content-Type':  'text/event-stream',
      'Cache-Control': 'no-cache, no-transform',
      'Connection':    'keep-alive',
      'X-Accel-Buffering': 'no',   // Disable nginx buffering
    }
  });
}
