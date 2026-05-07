import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { logAudit } from '@/lib/audit';
import { redisConnection as redis } from '@/lib/redis';
import { schedulePTPJob } from '@/lib/ptp-scheduler';

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: idStr } = await params;
    const id = parseInt(idStr);
    const data = await request.json();
    const { userId, ...details } = data;

    const parsedUserId = userId ? Number(userId) : null;

    // 1. Update customer metadata (if needed)
    const updateData: any = {};

    if (data.eligibleForUpdate !== undefined) {
      updateData.eligible_for_update = data.eligibleForUpdate;
    }

    await prisma.customer.update({
      where: { id },
      data: updateData
    });

    // 2. If it's a PTP, create a PTP record
    if (data.disposition === 'Promised to Pay' && data.amount && data.date) {
      const parsedAmount = parseFloat(data.amount);
      if (!isNaN(parsedAmount)) {
        const newPtp = await prisma.pTP.create({
          data: {
            customerId: id,
            amount: parsedAmount,
            date: data.date,
            status: 'pending',
            agentId: parsedUserId || 1,
            voc: data.subDisposition || '',
            remarks: data.remarks,
            created: new Date().toISOString().split('T')[0]
          }
        });

        // ── Register delayed Redis job for this PTP ──
        schedulePTPJob(newPtp.id, data.date).catch(err =>
          console.warn('[Disposition] Could not schedule Redis PTP job:', err.message)
        );

        // PTP Notification for Today (only if Redis is available)
        if (redis) {
          try {
            const today = new Date().toISOString().split('T')[0];
            if (data.date === today) {
              const customer = await prisma.customer.findUnique({ where: { id }, select: { name: true, account_no: true } });
              const notification = {
                id: Date.now(),
                type: 'PTP',
                title: 'New PTP Recorded',
                message: `${customer?.name} promised ₹${parsedAmount} for today`,
                time: new Date().toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' }),
                account: customer?.account_no,
                agentId: parsedUserId
              };
              const redisKey = `notifs:ptp:${today}`;
              await redis.lpush(redisKey, JSON.stringify(notification));
              await redis.expire(redisKey, 86400); // 24 hours
            }
          } catch (err) {
            // Redis unavailable - skip notification
          }
        }
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

    // Invalidate Redis cache so Call Logs modal shows fresh data
    if (redis) {
      try {
        const keys = await redis.keys(`call-logs:${id}*`);
        if (keys.length > 0) {
          await redis.del(...keys);
        }
      } catch (_) {}
    }

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error('[DISPOSITION ERROR]', error);
    return NextResponse.json({ message: 'Error saving disposition: ' + error.message }, { status: 500 });
  }
}
