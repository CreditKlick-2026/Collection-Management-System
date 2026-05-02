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

    return NextResponse.json({ job });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
