import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export const dynamic = 'force-dynamic';

type ReportType = 'payments' | 'ptps' | 'leads' | 'call_logs' | 'disputes' | 'settlements';

// ── Fetch functions (using actual Prisma schema field names) ──────────────

async function fetchPayments(from: string, to: string, agentIds: number[]) {
  return prisma.payment.findMany({
    where: { 
      date: { gte: from, lte: to },
      agentId: { in: agentIds }
    },
    include: {
      customer: { select: { name: true, account_no: true, mobile: true, product: true, bank: true } },
      agent:    { select: { name: true, empId: true } },
    },
    orderBy: { date: 'desc' },
  });
}

async function fetchPTPs(from: string, to: string, agentIds: number[]) {
  // PTP model fields: id, customerId, amount, date (PTP date), created, status, agentId, voc, remarks, flag, flagComment, rejectionReason
  return prisma.pTP.findMany({
    where: {
      agentId: { in: agentIds },
      OR: [
        { date: { gte: from, lte: to } },
        { created: { gte: from, lte: to } }
      ]
    },
    include: {
      customer: { select: { name: true, account_no: true, mobile: true } },
      agent:    { select: { name: true, empId: true } },
    },
    orderBy: { date: 'desc' },
  });
}

async function fetchLeads(from: string, to: string, agentIds: number[], portfolioIds: number[], isAdmin: boolean) {
  const where: any = {
    createdAt: {
      gte: new Date(from + 'T00:00:00Z'),
      lte: new Date(to   + 'T23:59:59Z'),
    },
  };

  if (!isAdmin) {
    where.OR = [
      { assignedAgentId: { in: agentIds } },
      { portfolioId:     { in: portfolioIds } }
    ];
  }

  return prisma.customer.findMany({
    where,
    select: {
      id: true,
      createdAt: true,
      name: true,
      account_no: true,
      mobile: true,
      alt_mobile: true,
      address: true,
      city: true,
      state: true,
      product: true,
      bank: true,
      min_amt_due: true,
      principle_outstanding: true,
      outstanding: true,
      dpd: true,
      bkt_2: true,
      status: true,
      eligible_upgrade: true,
      assignedAgent: { select: { name: true, empId: true } },
      portfolio:     { select: { name: true } },
      metadata: true
    },
    orderBy: { createdAt: 'desc' },
  });
}

async function fetchCallLogs(from: string, to: string, agentIds: number[]) {
  // AuditLog stores call/disposition logs with action='LEAD_DISPOSITION' and entityType='Customer'
  // The `timestamp` field is used (not `createdAt`)
  const logs = await prisma.auditLog.findMany({
    where: {
      action: 'LEAD_DISPOSITION',
      entityType: 'Customer',
      userId: { in: agentIds },
      timestamp: {
        gte: new Date(from + 'T00:00:00Z'),
        lte: new Date(to   + 'T23:59:59Z'),
      },
    },
    include: {
      user: { select: { name: true, empId: true } },
    },
    orderBy: { timestamp: 'desc' },
  });

  // Fetch customer details in bulk for all entityIds
  const customerIds = [...new Set(logs.map(l => parseInt(l.entityId)).filter(n => !isNaN(n)))];
  const customers = customerIds.length
    ? await prisma.customer.findMany({
        where: { id: { in: customerIds } },
        select: { id: true, name: true, account_no: true, mobile: true },
      })
    : [];
  const custMap = Object.fromEntries(customers.map(c => [c.id, c]));

  return logs.map(l => ({ ...l, customerInfo: (custMap as any)[parseInt(l.entityId)] || null }));
}

async function fetchDisputes(from: string, to: string, agentIds: number[]) {
  // Dispute model: raisedDate (String), type, status, description, resolution
  return prisma.dispute.findMany({
    where: {
      raisedDate: { gte: from, lte: to },
      agentId: { in: agentIds }
    },
    include: {
      customer: { select: { name: true, account_no: true } },
      agent:    { select: { name: true, empId: true } },
    },
    orderBy: { raisedDate: 'desc' },
  });
}

async function fetchSettlements(from: string, to: string, agentIds: number[]) {
  return prisma.settlement.findMany({
    where: {
      createdAt: {
        gte: new Date(from + 'T00:00:00Z'),
        lte: new Date(to   + 'T23:59:59Z'),
      },
      agentId: { in: agentIds }
    },
    include: {
      customer: { select: { name: true, account_no: true, mobile: true } },
      agent:    { select: { name: true, empId: true } },
    },
    orderBy: { createdAt: 'desc' },
  });
}

// ── Flatten to export rows ────────────────────────────────────────────────

function flattenPayments(records: any[]) {
  return records.map(p => ({
    'Payment Date':      p.date,
    'Customer Name':     p.customer?.name      || '',
    'Account No':        p.customer?.account_no || '',
    'Mobile':            p.customer?.mobile     || '',
    'Product':           p.customer?.product    || '',
    'Bank':              p.customer?.bank       || '',
    'Amount (₹)':        p.amount,
    'Mode':              p.mode,
    'Reference No':      p.ref                  || '',
    'Status':            p.status,
    'Flag':              p.flag                 || '',
    'Resolved':          p.resolved ? 'Yes' : 'No',
    'Agent':             p.agent?.name          || '',
    'Agent EmpID':       p.agent?.empId         || '',
    'Remarks':           p.remarks              || '',
    'Rejection Reason':  p.rejectionReason      || '',
    'Flag Comment':      p.flagComment          || '',
  }));
}

function flattenPTPs(records: any[]) {
  return records.map(p => ({
    'PTP Date':          p.date,
    'Created Date':      p.created              || '',
    'Customer Name':     p.customer?.name       || '',
    'Account No':        p.customer?.account_no || '',
    'Mobile':            p.customer?.mobile     || '',
    'PTP Amount (₹)':    p.amount,
    'Status':            p.status               || '',
    'Flag':              p.flag                 || '',
    'Agent':             p.agent?.name          || '',
    'Agent EmpID':       p.agent?.empId         || '',
    'VOC':               p.voc                  || '',
    'Remarks':           p.remarks              || '',
    'Flag Comment':      p.flagComment          || '',
    'Rejection Reason':  p.rejectionReason      || '',
  }));
}

function flattenLeads(records: any[], customColumns: any[]) {
  return records.map(l => {
    const row: any = {
      'Allocation Date':          l.createdAt ? new Date(l.createdAt).toISOString().split('T')[0] : '',
      'Customer Name':            l.name             || '',
      'Account No':               l.account_no       || '',
      'Mobile':                   l.mobile           || '',
      'Alt Mobile':               l.alt_mobile       || '',
      'Address':                  l.address          || '',
      'City':                     l.city             || '',
      'State':                    l.state            || '',
      'Product':                  l.product          || '',
      'Bank':                     l.bank             || '',
      'Min Amount Due (₹)':       l.min_amt_due      ?? '',
      'Principal Outstanding (₹)': l.principle_outstanding ?? '',
      'Total Outstanding (₹)':    l.outstanding      ?? '',
      'DPD':                      l.dpd              || 0,
      'BKT':                      l.bkt_2            || '',
      'Status':                   l.status           || '',
      'Portfolio':                l.portfolio?.name  || '',
      'Assigned Agent':           l.assignedAgent?.name  || '',
      'Agent EmpID':              l.assignedAgent?.empId || '',
      'Eligible Upgrade':         l.eligible_upgrade || '',
    };

    // Add dynamic custom columns from metadata
    if (l.metadata && typeof l.metadata === 'object') {
      customColumns.forEach(col => {
        row[col.label] = (l.metadata as any)[col.key] || '';
      });
    } else {
      customColumns.forEach(col => {
        row[col.label] = '';
      });
    }

    return row;
  });
}

function flattenCallLogs(records: any[]) {
  return records.map(l => {
    const d = (l.details as any) || {};
    return {
      'Date & Time':        l.timestamp ? new Date(l.timestamp).toLocaleString('en-IN') : '',
      'Customer Name':      l.customerInfo?.name        || d.customerName || '',
      'Account No':         l.customerInfo?.account_no  || '',
      'Mobile':             l.customerInfo?.mobile       || '',
      'Agent':              l.user?.name                || '',
      'Agent EmpID':        l.user?.empId               || '',
      'Connect Status':     d.connectStatus             || '',
      'Disposition':        d.disposition               || '',
      'Sub-Disposition':    d.subDisposition            || '',
      'PTP Amount (₹)':     d.amount                    || '',
      'PTP Date':           d.date                      || '',
      'Settlement Amount':  d.settlement                || '',
      'Call Drop':          d.callDrop                  || 'No',
      'Alt Number':         d.altNumber                 || '',
      'Remarks':            d.remarks                   || '',
      'Upgrade Flag':       d.upgradeFlag               || '',
    };
  });
}

function flattenDisputes(records: any[]) {
  return records.map(d => ({
    'Raised Date':       d.raisedDate             || '',
    'Customer Name':     d.customer?.name         || '',
    'Account No':        d.customer?.account_no   || '',
    'Dispute Type':      d.type                   || '',
    'Description':       d.description            || '',
    'Status':            d.status                 || '',
    'Resolution':        d.resolution             || '',
    'Escalated':         d.escalated ? 'Yes' : 'No',
    'Flag':              d.flag                   || '',
    'Flag Comment':      d.flagComment            || '',
    'Agent':             d.agent?.name            || '',
    'Agent EmpID':       d.agent?.empId           || '',
  }));
}

function flattenSettlements(records: any[]) {
  return records.map(s => ({
    'Request Date':      s.createdAt ? new Date(s.createdAt).toISOString().split('T')[0] : s.created,
    'Customer Name':     s.customer?.name         || '',
    'Account No':        s.customer?.account_no   || '',
    'Mobile':            s.customer?.mobile       || '',
    'Settlement Amount': s.amount,
    'Reason':            s.reason                 || '',
    'Sub-Reason':        s.subReason              || '',
    'Justification':     s.justification          || '',
    'Status':            s.status                 || '',
    'Rejection Reason':  s.rejectionReason        || '',
    'Manager Remarks':   s.remarks                || '',
    'Agent':             s.agent?.name            || '',
    'Agent EmpID':       s.agent?.empId           || '',
  }));
}

function convertToCSV(data: any[]): string {
  if (!data || data.length === 0) return '';
  const headers = Object.keys(data[0]);
  const csvRows = [] as string[];
  // Header row
  csvRows.push(headers.map(h => `"${String(h).replace(/"/g, '""')}"`).join(','));
  // Data rows
  data.forEach(row => {
    const rowValues = headers.map(h => {
      const val = (row as any)[h];
      if (val === null || val === undefined) return '';
      const escaped = String(val).replace(/"/g, '""');
      return `"${escaped}"`;
    });
    csvRows.push(rowValues.join(','));
  });
  return csvRows.join('\n');
}

// ── GET handler ───────────────────────────────────────────────────────────

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const type = (searchParams.get('type') || 'payments') as ReportType;
  const from = searchParams.get('from') || new Date().toISOString().split('T')[0];
  const to   = searchParams.get('to')   || new Date().toISOString().split('T')[0];
  const managerId = searchParams.get('managerId');
  const format = searchParams.get('format') || 'json'; // 'json' or 'csv'
  const limit = searchParams.get('limit') ? Number(searchParams.get('limit')) : null;

  try {
    if (!managerId) {
      return NextResponse.json({ message: 'Manager ID is required' }, { status: 400 });
    }

    const user = await prisma.user.findUnique({
      where: { id: Number(managerId) },
      include: {
        portfoliosManaged: { select: { id: true } },
        portfoliosAgent: { select: { id: true } }
      }
    });

    let agentIds: number[] = [];
    let portfolioIds: number[] = [];
    const isAdmin = user?.role === 'admin';

    if (isAdmin) {
      const allUsers = await prisma.user.findMany({ select: { id: true } });
      agentIds = allUsers.map(u => u.id);
      // For admins, we don't strictly need portfolioIds if they see everything
    } else {
      const agents = await prisma.user.findMany({
        where: { 
          OR: [
            { managerId: Number(managerId) },
            { id: Number(managerId) }
          ]
        },
        select: { id: true }
      });
      agentIds = agents.map(a => a.id);
      portfolioIds = [
        ...(user?.portfoliosManaged.map(p => p.id) || []),
        ...(user?.portfoliosAgent.map(p => p.id) || [])
      ];
    }

    let rows: any[] = [];

    switch (type) {
      case 'payments':
        rows = flattenPayments(await fetchPayments(from, to, agentIds));
        break;
      case 'ptps':
        rows = flattenPTPs(await fetchPTPs(from, to, agentIds));
        break;
      case 'leads': {
        const customColumns = await prisma.leadColumn.findMany({
          orderBy: { order: 'asc' },
          select: { key: true, label: true }
        });
        rows = flattenLeads(await fetchLeads(from, to, agentIds, portfolioIds, isAdmin), customColumns);
        break;
      }
      case 'call_logs':
        rows = flattenCallLogs(await fetchCallLogs(from, to, agentIds));
        break;
      case 'disputes':
        rows = flattenDisputes(await fetchDisputes(from, to, agentIds));
        break;
      case 'settlements':
        rows = flattenSettlements(await fetchSettlements(from, to, agentIds));
        break;
      default:
        return NextResponse.json({ message: 'Invalid report type' }, { status: 400 });
    }

    if (format === 'csv') {
      const csv = convertToCSV(rows);
      const headers = new Headers({
        'Content-Type': 'text/csv',
        'Content-Disposition': `attachment; filename="${type}_report_${from}_to_${to}.csv"`,
      });
      return new NextResponse(csv, { status: 200, headers });
    }

    const totalCount = rows.length;
    if (limit && rows.length > limit) {
      rows = rows.slice(0, limit);
    }

    return NextResponse.json({ rows, count: totalCount, type, from, to, limited: !!limit });
  } catch (error) {
    console.error('Report fetch error:', error);
    return NextResponse.json({ message: 'Error generating report', error: String(error) }, { status: 500 });
  }
}
