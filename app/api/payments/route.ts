import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { logAudit } from '@/lib/audit';

export const dynamic = 'force-dynamic';

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const status      = searchParams.get('status') || 'cleared';
  const date        = searchParams.get('date');       // single date (legacy)
  const dateFrom    = searchParams.get('dateFrom');   // range start
  const dateTo      = searchParams.get('dateTo');     // range end
  const mode        = searchParams.get('mode');
  const agent       = searchParams.get('agent');
  const account     = searchParams.get('account');
  const customerId  = searchParams.get('customerId');
  const page        = Math.max(1, parseInt(searchParams.get('page')  || '1'));
  const limit       = Math.min(100, parseInt(searchParams.get('limit') || '25'));
  const skip        = (page - 1) * limit;
  const requesterId = searchParams.get('requesterId');

  let agentFilter: any = agent ? { name: { contains: agent, mode: 'insensitive' } } : undefined;
  let agentIdFilter = undefined;
  
  if (requesterId) {
    const rUser = await prisma.user.findUnique({ where: { id: Number(requesterId) } });
    if (rUser?.role === 'agent') {
      agentIdFilter = Number(requesterId);
      agentFilter = undefined;
    }
  }

  // Build date filter: range takes priority over single date
  let dateFilter: any = undefined;
  if (dateFrom || dateTo) {
    dateFilter = {};
    if (dateFrom) dateFilter.gte = dateFrom;
    if (dateTo)   dateFilter.lte = dateTo;
  } else if (date) {
    dateFilter = date;
  }

  const where: any = {
    status:     (status === 'all' || !status) ? undefined : status,
    date:       dateFilter,
    mode:       mode       || undefined,
    customerId: customerId ? Number(customerId) : undefined,
    agent:      agentFilter,
    agentId:    agentIdFilter,
    OR: account
      ? [
          { customer: { account_no: { contains: account, mode: 'insensitive' } } },
          { customer: { name:       { contains: account, mode: 'insensitive' } } },
        ]
      : undefined,
  };

  try {
    // ── Base filter WITHOUT status (for global cross-status stats) ────────────
    const baseWhere: any = {
      date:       dateFilter,
      mode:       mode       || undefined,
      customerId: customerId ? Number(customerId) : undefined,
      agent:      agentFilter,
      agentId:    agentIdFilter,
      OR: account
        ? [
            { customer: { account_no: { contains: account, mode: 'insensitive' } } },
            { customer: { name:       { contains: account, mode: 'insensitive' } } },
          ]
        : undefined,
    };

    const [payments, total, globalAgg] = await prisma.$transaction([
      // 1. Paginated records for current tab
      prisma.payment.findMany({
        where,
        include: {
          customer: { select: { id: true, name: true, account_no: true, bkt_2: true, eligible_upgrade: true, eligible_for_update: true, product: true } },
          agent:    { select: { id: true, name: true, empId: true } },
        },
        orderBy: { date: 'desc' },
        skip,
        take: limit,
      }),
      // 2. Total count for current tab (for pagination)
      prisma.payment.count({ where }),
      // 3. Global aggregate per status (for KPI cards — ALL pages, current filters applied)
      prisma.payment.groupBy({
        by: ['status'],
        where: baseWhere,
        _count: { _all: true },
        _sum: { amount: true },
        orderBy: { _count: { status: 'desc' } },
      }),
    ]);

    // Build summary from groupBy result
    const summary: Record<string, { count: number; amount: number }> = {};
    for (const row of globalAgg) {
      summary[row.status] = {
        count:  (row._count as any)?._all || 0,
        amount: row._sum?.amount || 0,
      };
    }

    return NextResponse.json({
      data: payments,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
      summary: {
        cleared:       summary['cleared']          || { count: 0, amount: 0 },
        pending:       summary['pending_approval'] || { count: 0, amount: 0 },
        rejected:      summary['rejected']         || { count: 0, amount: 0 },
      }
    });
  } catch (error) {
    console.error('Error fetching payments', error);
    return NextResponse.json({ message: 'Error fetching payments' }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const data = await request.json();
    
    // Validate required numeric fields
    const customerId = Number(data.customerId);
    const agentId = Number(data.agentId);
    const amount = parseFloat(data.amount);
    const ref = (data.ref || '').trim();
    const paymentDate = data.date || new Date().toISOString().split('T')[0];
    const paymentMode = data.mode || 'Cash';

    if (Number.isNaN(customerId) || Number.isNaN(agentId) || Number.isNaN(amount)) {
      return NextResponse.json({ message: 'Invalid customer, agent, or amount value' }, { status: 400 });
    }

    // ─── DUPLICATE CHECK LAYER 1: Transaction Reference Number ───────────────
    // If a ref/UTR is provided, it MUST be unique across all non-rejected payments.
    if (ref) {
      const existingByRef = await prisma.payment.findFirst({
        where: {
          ref: ref,
          status: { not: 'rejected' } // Rejected payments don't count
        },
        include: {
          customer: { select: { name: true, account_no: true } }
        }
      });

      if (existingByRef) {
        return NextResponse.json({
          duplicate: true,
          type: 'ref_duplicate',
          message: `⚠️ Duplicate Transaction! Reference No. "${ref}" already exists for customer "${existingByRef.customer?.name}" (${existingByRef.customer?.account_no}). Payment of ₹${existingByRef.amount} recorded on ${existingByRef.date}.`
        }, { status: 409 });
      }
    }

    // ─── DUPLICATE CHECK LAYER 2: Same Customer + Amount + Date + Mode ───────
    // Catches accidental double-clicks or re-submissions without a ref number.
    const tenMinutesAgo = new Date(Date.now() - 10 * 60 * 1000);
    const existingSoftDuplicate = await prisma.payment.findFirst({
      where: {
        customerId,
        amount,
        date: paymentDate,
        mode: paymentMode,
        status: { not: 'rejected' },
        createdAt: { gte: tenMinutesAgo }
      }
    });

    if (existingSoftDuplicate && !data.confirmDuplicate) {
      return NextResponse.json({
        duplicate: true,
        type: 'soft_duplicate',
        message: `⚠️ Possible Duplicate! A payment of ₹${amount} via ${paymentMode} for this customer on ${paymentDate} was already recorded ${Math.round((Date.now() - new Date(existingSoftDuplicate.createdAt).getTime()) / 60000)} minute(s) ago. Are you sure you want to submit again?`,
        existingPaymentId: existingSoftDuplicate.id
      }, { status: 409 });
    }

    // ─── All checks passed — create payment ──────────────────────────────────
    const payment = await prisma.payment.create({
      data: {
        customerId,
        amount,
        mode: paymentMode,
        type: data.type || 'Payment',
        ref: ref || '',
        date: paymentDate,
        agentId,
        status: 'pending_approval',
        remarks: data.remarks || '',
        upgradeFlag: data.upgradeFlag || null,
        upgradeType: data.upgradeType || null,
        upgradeReason: data.upgradeReason || null
      }
    });

    try {
      await logAudit({
        userId: agentId,
        action: 'PAYMENT_CREATED',
        entityType: 'Payment',
        entityId: String(payment.id),
        details: { amount: payment.amount, mode: payment.mode, ref: ref || null, status: payment.status }
      });
    } catch (auditErr) {
      console.error('Audit log failed but payment was created:', auditErr);
    }

    return NextResponse.json(payment);
  } catch (error: any) {
    console.error('POST /api/payments error:', error);
    return NextResponse.json({ message: error.message || 'Error creating payment' }, { status: 500 });
  }
}

export async function PUT(request: Request) {
  try {
    const { id, status, flag, flagBy, flagComment, rejectionReason, remarks, customerId, agentId, metadata, type, upgradeFlag, upgradeType, upgradeReason } =
      await request.json();

    // Check if payment is locked (resolved by manager)
    const existing = await prisma.payment.findUnique({ where: { id: Number(id) } });
    if (existing?.resolved) {
      return NextResponse.json({ message: 'LOCKED: This payment has been resolved by a manager and cannot be modified.' }, { status: 403 });
    }

    const payment = await prisma.payment.update({
      where: { id: Number(id) },
      data: {
        status,
        flag,
        flagBy: flagBy ? Number(flagBy) : undefined,
        flagComment,
        rejectionReason,
        remarks,
        type: type || undefined,
        customerId: customerId ? Number(customerId) : undefined,
        agentId: agentId ? Number(agentId) : undefined,
        metadata: metadata || undefined,
        upgradeFlag: upgradeFlag || undefined,
        upgradeType: upgradeType || undefined,
        upgradeReason: upgradeReason || undefined,
      }
    });

    await logAudit({
      userId: Number(flagBy || payment.agentId), // Use flagBy if available, else agent
      action: status === 'rejected' ? 'PAYMENT_REJECTED' : flag === 'flagged' ? 'PAYMENT_FLAGGED' : 'PAYMENT_UPDATED',
      entityType: 'Payment',
      entityId: String(payment.id),
      details: { status, flag, flagComment, rejectionReason }
    });

    return NextResponse.json(payment);
  } catch (error) {
    console.error('Error updating payment', error);
    return NextResponse.json({ message: 'Error updating payment' }, { status: 500 });
  }
}
