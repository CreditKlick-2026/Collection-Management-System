import { NextResponse } from 'next/server';
import { skippedStore } from '@/lib/upload-events';

export const dynamic = 'force-dynamic';

/**
 * GET /api/admin/bulk-upload/skipped?jobId=xxx&page=1&limit=20
 * Returns paginated list of skipped records for a given job.
 * Data lives in process memory (skippedStore) — available until auto-cleanup (1hr).
 */
export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const jobId = searchParams.get('jobId');
  const page  = Math.max(1, parseInt(searchParams.get('page') || '1'));
  const limit = Math.min(100, Math.max(1, parseInt(searchParams.get('limit') || '20')));

  if (!jobId) {
    return NextResponse.json({ error: 'jobId required' }, { status: 400 });
  }

  const allRecords = skippedStore.get(jobId) || [];
  const total      = allRecords.length;
  const totalPages = Math.ceil(total / limit) || 1;
  const start      = (page - 1) * limit;
  const records    = allRecords.slice(start, start + limit);

  return NextResponse.json({
    records,
    pagination: {
      page,
      limit,
      total,
      totalPages,
      hasNext: page < totalPages,
      hasPrev: page > 1,
    }
  });
}
