import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { logAudit } from '@/lib/audit';

export async function POST(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const id = parseInt(params.id);
    const data = await request.json();
    const { userId, ...details } = data;

    const parsedUserId = userId ? Number(userId) : null;

    // 1. Update customer status
    await prisma.customer.update({
      where: { id },
      data: {
        status: data.disposition === 'Promised to Pay' ? 'ptp' : 
                data.connectStatus === 'Right Party Connect' ? 'active' : 
                'pending',
      }
    });

    // 2. If it's a PTP, create a PTP record
    if (data.disposition === 'Promised to Pay' && data.amount && data.date) {
      const parsedAmount = parseFloat(data.amount);
      if (!isNaN(parsedAmount)) {
        await prisma.pTP.create({
          data: {
            customerId: id,
            amount: parsedAmount,
            date: data.date,
            status: 'pending',
            agentId: parsedUserId || 1, // Fallback to a system user if needed
            remarks: data.remarks,
            created: new Date().toISOString().split('T')[0]
          }
        });
      }
    }

    // 3. Log the audit
    if (parsedUserId && !isNaN(parsedUserId)) {
      await logAudit({
        userId: parsedUserId,
        action: 'LEAD_DISPOSITION',
        entityType: 'Customer',
        entityId: String(id),
        details: details
      });
    }

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error('[DISPOSITION ERROR]', error);
    return NextResponse.json({ message: 'Error saving disposition: ' + error.message }, { status: 500 });
  }
}
