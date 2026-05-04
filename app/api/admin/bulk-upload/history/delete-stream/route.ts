import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export const dynamic = 'force-dynamic';

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const jobId = searchParams.get('jobId');

  if (!jobId) {
    return new NextResponse('Missing jobId', { status: 400 });
  }

  const encoder = new TextEncoder();
  const stream = new ReadableStream({
    async start(controller) {
      const sendEvent = (event: string, data: any) => {
        controller.enqueue(encoder.encode(`event: ${event}\ndata: ${JSON.stringify(data)}\n\n`));
      };

      try {
        // First check if job exists
        const job = await prisma.bulkUploadJob.findUnique({
          where: { id: jobId }
        });

        if (!job) {
          sendEvent('error', { message: 'Job not found' });
          controller.close();
          return;
        }

        // Count how many records belong to this job
        const totalRecords = await prisma.customer.count({
          where: { bulkUploadJobId: jobId }
        });

        sendEvent('start', { totalRecords });

        if (totalRecords === 0) {
          // If no records, just delete the job and finish
          await prisma.bulkUploadJob.delete({ where: { id: jobId } });
          sendEvent('complete', { deletedRecords: 0 });
          controller.close();
          return;
        }

        const BATCH_SIZE = 500;
        let deletedRecords = 0;

        while (true) {
          const customers = await prisma.customer.findMany({
            where: { bulkUploadJobId: jobId },
            select: { id: true },
            take: BATCH_SIZE
          });

          if (customers.length === 0) break;

          const customerIds = customers.map(c => c.id);

          // Preserve payment data with a single raw SQL (no N+1 loop)
          await prisma.$executeRawUnsafe(`
            UPDATE "Payment" p
            SET account_no = c.account_no, customer_name = c.name
            FROM "Customer" c
            WHERE p."customerId" = c.id AND c.id IN (${customerIds.join(',')})
          `);

          // Delete relations sequentially (NOT in $transaction) so we
          // release the connection between each query — prevents pool starvation
          await prisma.pTP.deleteMany({ where: { customerId: { in: customerIds } } });
          await prisma.dispute.deleteMany({ where: { customerId: { in: customerIds } } });
          await prisma.settlement.deleteMany({ where: { customerId: { in: customerIds } } });
          const delRes = await prisma.customer.deleteMany({ where: { id: { in: customerIds } } });

          deletedRecords += delRes.count;

          sendEvent('progress', { deletedRecords, totalRecords });

          // Yield time so other API calls can grab a connection
          await new Promise(r => setTimeout(r, 200));
        }

        // Finally delete the job record
        await prisma.bulkUploadJob.delete({ where: { id: jobId } });

        sendEvent('complete', { deletedRecords });
      } catch (err: any) {
        sendEvent('error', { message: err.message });
      } finally {
        controller.close();
      }
    }
  });

  return new NextResponse(stream, {
    headers: {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache',
      'Connection': 'keep-alive',
    },
  });
}
