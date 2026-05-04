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

        // Since we are deleting, we can keep fetching taking BATCH_SIZE until 0
        while (true) {
          // Find records to delete (we need their IDs to delete dependencies if any, or we can just delete by bulkUploadJobId)
          // Wait, customers have relations (payments, ptps, etc.). In the app, bulk uploaded records usually don't have payments immediately,
          // but if they do, Prisma will block deletion unless we have Cascade delete or we manually delete them.
          const customers = await prisma.customer.findMany({
            where: { bulkUploadJobId: jobId },
            select: { id: true, account_no: true, name: true },
            take: BATCH_SIZE
          });

          if (customers.length === 0) break;

          // Preserve Payments by copying Customer Data into them before deletion
          for (const cust of customers) {
            await prisma.payment.updateMany({
              where: { customerId: cust.id },
              data: {
                account_no: cust.account_no,
                customer_name: cust.name
              }
            });
          }

          const customerIds = customers.map(c => c.id);

          // Delete related records first (Payments are PRESERVED via SetNull)
          await prisma.pTP.deleteMany({ where: { customerId: { in: customerIds } } });
          await prisma.dispute.deleteMany({ where: { customerId: { in: customerIds } } });
          await prisma.settlement.deleteMany({ where: { customerId: { in: customerIds } } });

          // Now delete customers
          const delRes = await prisma.customer.deleteMany({
            where: { id: { in: customerIds } }
          });

          deletedRecords += delRes.count;

          sendEvent('progress', { 
            deletedRecords, 
            totalRecords 
          });

          // Small delay to allow UI to update smoothly
          await new Promise(r => setTimeout(r, 100));
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
