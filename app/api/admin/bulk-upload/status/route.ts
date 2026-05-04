import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export const dynamic = 'force-dynamic';

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const jobId = searchParams.get('jobId');
  const checkActive = searchParams.get('checkActive');

  try {
    if (checkActive === 'true') {
      // Find the most recent incomplete job
      const activeJob = await prisma.bulkUploadJob.findFirst({
        where: {
          status: { in: ['pending', 'processing'] }
        },
        orderBy: { createdAt: 'desc' }
      });

      // Auto-expire stale jobs (stuck > 30 min = mark failed)
      if (activeJob) {
        const ageMs = Date.now() - new Date(activeJob.updatedAt).getTime();
        if (ageMs > 30 * 60 * 1000) {
          await prisma.bulkUploadJob.update({
            where: { id: activeJob.id },
            data:  { status: 'failed', errors: ['Auto-expired: job was stale for >30 minutes'] }
          });
          return NextResponse.json({ activeJob: null });
        }
      }

      return NextResponse.json({ activeJob });
    }

    if (!jobId) {
      return NextResponse.json({ error: 'Job ID required' }, { status: 400 });
    }

    const job = await prisma.bulkUploadJob.findUnique({
      where: { id: jobId }
    });

    if (!job) {
      return NextResponse.json({ error: 'Job not found' }, { status: 404 });
    }

    // Live DB count — gives frontend real "how many in database right now"
    const totalCustomers = await prisma.customer.count();

    return NextResponse.json({ job, totalCustomers });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
