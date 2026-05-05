import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const ptps = await prisma.pTP.findMany({
      where: { 
        OR: [
          { voc: '' },
          { voc: null }
        ]
      }
    });

    let updatedCount = 0;

    for (const ptp of ptps) {
      // Find the audit log that created this PTP
      const audit = await prisma.auditLog.findFirst({
        where: {
          entityId: String(ptp.customerId),
          action: 'LEAD_DISPOSITION',
        },
        orderBy: { timestamp: 'desc' }
      });

      if (audit && audit.details) {
        const details = audit.details as any;
        if (details.subDisposition) {
          await prisma.pTP.update({
            where: { id: ptp.id },
            data: { voc: details.subDisposition }
          });
          updatedCount++;
        }
      }
    }

    return NextResponse.json({ success: true, updatedCount });
  } catch (err: any) {
    return NextResponse.json({ error: err.message });
  }
}
