import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { schedulePTPJob } from '@/lib/ptp-scheduler';

export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const date           = searchParams.get('date');
  const dateFrom       = searchParams.get('dateFrom');
  const dateTo         = searchParams.get('dateTo');
  const agent          = searchParams.get('agent');
  const account        = searchParams.get('account');
  const status         = searchParams.get('status');
  const transferStatusFilter = searchParams.get('transferStatus');
  const recoveryStatus = searchParams.get('recoveryStatus');
  const flag           = searchParams.get('flag');
  const page           = Math.max(1, parseInt(searchParams.get('page')  || '1'));
  const limit          = Math.min(100, parseInt(searchParams.get('limit') || '25'));
  const skip           = (page - 1) * limit;
  const requesterId    = searchParams.get('requesterId');

  let agentFilter: any = agent ? { name: { contains: agent, mode: 'insensitive' } } : undefined;
  let agentIdFilter: any = undefined;
  
  if (requesterId) {
    const rUser = await prisma.user.findUnique({ where: { id: Number(requesterId) } });
    if (rUser?.role === 'agent') {
      agentIdFilter = Number(requesterId);
      agentFilter = undefined;
    }
  }

  // Date filter: range takes priority over single date
  let dateFilter: any = undefined;
  if (dateFrom || dateTo) {
    dateFilter = {};
    if (dateFrom) dateFilter.gte = dateFrom;
    if (dateTo)   dateFilter.lte = dateTo;
  } else if (date) {
    dateFilter = date;
  }

    const where: any = {
      date:    dateFilter,
      status:  status || undefined,
      transferStatus: transferStatusFilter || undefined,
      recoveryStatus: recoveryStatus || undefined,
      flag:    flag === 'null' ? null : (flag || undefined),
      OR: account
        ? [
            { customer: { account_no: { contains: account, mode: 'insensitive' } } },
            { customer: { name:       { contains: account, mode: 'insensitive' } } },
          ]
        : undefined,
    };
    
    if (agentIdFilter) {
      where.OR = where.OR || [];
      where.OR.push({ agentId: agentIdFilter }, { originalAgentId: agentIdFilter });
    } else if (agentFilter) {
      where.agent = agentFilter;
    }

  try {
    const [ptps, total, globalAgg, approvedAgg, originalAgg] = await prisma.$transaction([
      // 1. Paginated records
      prisma.pTP.findMany({
        where,
        include: { customer: true, agent: true, originalAgent: true },
        orderBy: { created: 'desc' },
        skip,
        take: limit,
      }),
      // 2. Total count for pagination
      prisma.pTP.count({ where }),
      // 3. Global aggregate by status (for KPI cards — ALL pages)
      prisma.pTP.groupBy({
        by: ['status'],
        where,
        _count: { _all: true },
        _sum:   { amount: true },
        orderBy: { _count: { status: 'desc' } },
      }),
      // 4. Approved PTPs only (flag = 'approved') — for Approved Amount card
      prisma.pTP.aggregate({
        where: { ...where, flag: 'approved' },
        _count: { _all: true },
        _sum:   { amount: true },
      }),
      // 5. Total Raised (based on originalAgentId for correct lifetime metrics)
      prisma.pTP.aggregate({
        where: { 
          ...where, 
          OR: undefined, 
          originalAgentId: agentIdFilter ? agentIdFilter : undefined,
          agent: agentFilter ? agentFilter : undefined
        },
        _count: { _all: true },
        _sum:   { amount: true },
      }),
    ]);

    // Build summary map from status groupBy
    const summaryMap: Record<string, { count: number; amount: number }> = {};
    for (const row of globalAgg) {
      summaryMap[row.status] = {
        count:  (row._count as any)?._all || 0,
        amount: row._sum?.amount || 0,
      };
    }
    const allStatuses = ['pending', 'paid', 'kept', 'broken'];
    const summary: Record<string, { count: number; amount: number }> = {};
    for (const s of allStatuses) summary[s] = summaryMap[s] || { count: 0, amount: 0 };
    summary.total = {
      count:  (originalAgg._count as any)?._all || 0,
      amount: originalAgg._sum?.amount || 0,
    };
    // Approved flag aggregate
    summary.approved = {
      count:  (approvedAgg._count as any)?._all || 0,
      amount: approvedAgg._sum?.amount || 0,
    };

    const formatted = ptps.map(p => ({
      id:               p.id,
      account_no:       p.customer.account_no,
      customer_name:    p.customer.name,
      ptp_amount:       p.amount,
      ptp_date:         p.date,
      status:           p.status,
      agent_name:       p.agent.name,
      original_agent:   p.originalAgent?.name || p.agent.name,
      transfer_status:  p.transferStatus,
      created:          p.created,
      flag:             p.flag,
      flag_comment:     p.flagComment,
      rejection_reason: p.rejectionReason,
      voc:              p.voc,
      remarks:          p.remarks,
      recovery_status:  p.recoveryStatus,
      last_action_at:   p.lastActionAt,
      recovery_remarks: p.recoveryRemarks,
    }));

    return NextResponse.json({ data: formatted, total, page, limit, totalPages: Math.ceil(total / limit), summary });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const data = await req.json();
    
    const customerId = Number(data.customerId);
    const agentId = Number(data.agentId);
    const amount = parseFloat(data.amount);

    if (Number.isNaN(customerId) || Number.isNaN(agentId) || Number.isNaN(amount)) {
      return NextResponse.json({ message: 'Invalid customer, agent, or amount' }, { status: 400 });
    }

    const newPtp = await prisma.pTP.create({
      data: {
        customerId,
        amount,
        date: data.date,
        status: data.status || 'pending',
        agentId,
        originalAgentId: agentId,
        voc: data.voc || '',
        remarks: data.remarks || '',
        created: new Date().toISOString().split('T')[0]
      }
    });

    // ── Schedule Redis delayed job to auto-check this PTP on its date ──
    if (newPtp.status === 'pending' && data.date) {
      schedulePTPJob(newPtp.id, data.date).catch(err =>
        console.warn('[PTP] Could not schedule Redis job:', err.message)
      );
    }

    // ── Smart Recovery: Mark all OLD PTPs as recovered for this customer ──
    try {
      const targetCustomerId = Number(newPtp.customerId);
      
      const recoveryResult = await prisma.pTP.updateMany({
        where: {
          customerId: targetCustomerId,
          id: { not: newPtp.id },
          status: { notIn: ['paid', 'kept', 'PAID', 'KEPT'] },
          NOT: {
            recoveryStatus: { in: ['recovered', 'RECOVERED'] }
          }
        },
        data: {
          recoveryStatus: 'recovered',
          recoveryRemarks: `Recovered by new PTP ID: ${newPtp.id}`,
          lastActionAt: new Date()
        }
      });
      console.log(`[PTP POST] Smart Recovery Success: Updated ${recoveryResult.count} records for Customer ${targetCustomerId}`);
    } catch (e) {
      console.error('[PTP POST] Smart recovery failed:', e);
    }

    return NextResponse.json(newPtp);
  } catch (error: any) {
    console.error('POST /api/ptps error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function PUT(req: NextRequest) {
  try {
    const data = await req.json();
    const { id, amount, date, status, voc, remarks, flag, flag_comment, rejection_reason, transferStatus, newAgentId, recoveryStatus, recoveryRemarks } = data;

    if (!id) return NextResponse.json({ message: 'ID is required' }, { status: 400 });

    // Automatically move to 'in_progress' if reassigned to a new agent and it was broken/pending
    let autoRecoveryStatus = recoveryStatus;
    if (newAgentId && !recoveryStatus) {
      const current = await prisma.pTP.findUnique({ where: { id: Number(id) } });
      if (current?.status?.toLowerCase() === 'broken' && (!current.recoveryStatus || current.recoveryStatus === 'pending')) {
        autoRecoveryStatus = 'in_progress';
      }
    }

    const updated = await prisma.pTP.update({
      where: { id: Number(id) },
      data: {
        amount: amount ? parseFloat(amount) : undefined,
        date: date || undefined,
        status: status || undefined,
        transferStatus: transferStatus || undefined,
        agent: newAgentId ? { connect: { id: Number(newAgentId) } } : undefined,
        voc: voc || undefined,
        remarks: remarks || undefined,
        flag: flag || undefined,
        flagComment: flag_comment || undefined,
        rejectionReason: rejection_reason || undefined,
        recoveryStatus: autoRecoveryStatus || undefined,
        recoveryRemarks: recoveryRemarks || (newAgentId ? `Reassigned to agent ID: ${newAgentId}` : undefined),
        lastActionAt: (autoRecoveryStatus || recoveryRemarks || newAgentId) ? new Date() : undefined,
      }
    });

    return NextResponse.json(updated);
  } catch (error: any) {
    console.error('PUT /api/ptps error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}