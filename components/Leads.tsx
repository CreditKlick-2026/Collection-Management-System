"use client";
import React, { useState, useEffect } from 'react';
import { useApp } from '@/context/AppContext';
import SButton from './SButton';

const DISPOSITION_LOGIC: Record<string, Record<string, any[]>> = {
  "Right Party Connect": {
    "Customer Refused to Pay": [
      { name: "Financial Issue - Job Loss" },
      { name: "Financial Issue - Business Loss" },
      { name: "Financial Issue - Others" },
      { name: "Financial Issue - Medical Condition" },
      { name: "Dispute - Card No Usages" },
      { name: "Dispute - Card Not Received" },
      { name: "Dispute - Charges Related Issue" },
      { name: "Dispute - Fraud and Others" },
      { name: "Dispute - False Commitment" },
      { name: "Not Ready to Disclose" },
      { name: "Not Ready to Listen" },
    ],
    "Promised to Pay": [
      { name: "Full Outstanding Amount", date: true, amount: true },
      { name: "Minimum Amount", date: true, amount: true },
      { name: "Partial Amount", date: true, amount: true },
      { name: "Customer Wants Settlement", date: true, amount: true, settlement: true },
    ],
    "Follow-Up": [
      { name: "Requested for Waiver", date: true },
      { name: "Asking for some time", date: true },
      { name: "Requested for Statement", date: true },
      { name: "Call Back", date: true },
    ],
    "Customer Visit at Branch": [
      { name: "Customer Visit at Branch", date: true, amount: true }
    ]
  },
  "Third Party Connect": {
    "Customer Not Available": [
      { name: "Out of Country" },
      { name: "Out of City" },
      { name: "Customer Hospitalized" },
      { name: "Not Ready to Disclosed" },
      { name: "Not Ready to Listen" },
      { name: "Customer Deceased" }
    ],
    "Follow-up": [
      { name: "Call Back", date: true }
    ]
  },
  "Wrong Party Connect": {
    "Invalid Contact Number": []
  },
  "Not Connected": {
    "Wrong Number": [],
    "Incorrect Number": [],
    "Switched Off": [],
    "Ringing No Response": [],
    "IVR Call": [],
    "Temporary Out of Service": [],
    "Call Not Connected": []
  }
};

const CONNECT_STATUS_COLORS: Record<string, string> = {
  'Right Party Connect': '#22c55e',
  'Third Party Connect': '#f59e0b',
  'Wrong Party Connect': '#ef4444',
  'Not Connected': '#6b7280',
};

const PAGE_SIZE = 25;

// ─── Payment History Modal ─────────────────────────────────────────────────
const PaymentHistoryModal = ({ lead }: { lead: any }) => {
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState('');

  useEffect(() => {
    if (!lead?.id) return;
    setLoading(true);
    fetch(`/api/leads/${lead.id}/payments`)
      .then(r => r.json())
      .then(d => { setData(d); setLoading(false); })
      .catch(() => setLoading(false));
  }, [lead?.id]);

  const STATUS_CFG: Record<string, { label: string; color: string; bg: string }> = {
    cleared:          { label: 'Cleared',          color: '#22c55e', bg: 'rgba(34,197,94,0.1)'   },
    pending_approval: { label: 'Pending Approval', color: '#f59e0b', bg: 'rgba(245,158,11,0.1)' },
    rejected:         { label: 'Rejected',         color: '#ef4444', bg: 'rgba(239,68,68,0.1)'  },
  };

  const filtered = (data?.payments || []).filter((p: any) => !statusFilter || p.status === statusFilter);

  return (
    <div style={{ padding: '0 20px 20px' }}>
      {/* Summary KPI cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 8, marginBottom: 16 }}>
        {[
          { label: 'Total Payments', val: data?.summary?.count || 0,                                  color: 'var(--acc2)', bg: 'rgba(79,125,255,0.06)', isCount: true },
          { label: 'Cleared',        val: data?.summary?.clearedCount || 0,                           color: '#22c55e',    bg: 'rgba(34,197,94,0.06)',   isCount: true },
          { label: 'Pending',        val: data?.summary?.pendingCount || 0,                           color: '#f59e0b',    bg: 'rgba(245,158,11,0.06)', isCount: true },
          { label: 'Rejected',       val: data?.summary?.rejectedCount || 0,                          color: '#ef4444',    bg: 'rgba(239,68,68,0.06)',  isCount: true },
        ].map(s => (
          <div key={s.label} style={{ background: s.bg, border: `1px solid ${s.color}25`, borderRadius: 6, padding: '6px 10px', textAlign: 'center' }}>
            <div style={{ fontSize: 18, fontWeight: 800, color: s.color }}>{s.val}</div>
            <div style={{ fontSize: 8, color: 'var(--txt3)', textTransform: 'uppercase', letterSpacing: 0.5 }}>{s.label}</div>
          </div>
        ))}
      </div>

      {/* Filter */}
      <div style={{ display: 'flex', gap: 8, marginBottom: 12, alignItems: 'center' }}>
        <select
          style={{ background: 'var(--bg2)', border: '1px solid var(--bdr)', borderRadius: 6, padding: '6px 12px', fontSize: 11, color: 'var(--txt)', outline: 'none' }}
          value={statusFilter} onChange={e => setStatusFilter(e.target.value)}
        >
          <option value="">All Statuses</option>
          <option value="cleared">Cleared</option>
          <option value="pending_approval">Pending Approval</option>
          <option value="rejected">Rejected</option>
        </select>
        <div style={{ fontSize: 10, color: 'var(--txt3)', marginLeft: 'auto' }}>{filtered.length} records</div>
      </div>

      {/* Table */}
      <div style={{ border: '1px solid var(--bdr)', borderRadius: 8, overflow: 'hidden' }}>
        <div style={{ display: 'grid', gridTemplateColumns: '30px 90px 90px 90px 1fr 90px 80px', background: 'var(--bg-top)', borderBottom: '1px solid var(--bdr)', padding: '6px 12px', gap: 8 }}>
          {['#', 'Date', 'Amount', 'Mode', 'Reference No.', 'Agent', 'Status'].map(h => (
            <div key={h} style={{ fontSize: 9, fontWeight: 700, color: 'var(--txt3)', textTransform: 'uppercase', letterSpacing: 0.4 }}>{h}</div>
          ))}
        </div>
        <div style={{ maxHeight: '55vh', overflowY: 'auto', background: 'var(--bg2)' }}>
          {loading ? (
            <div style={{ padding: 40, textAlign: 'center', color: 'var(--txt3)' }}>⏳ Loading...</div>
          ) : !filtered.length ? (
            <div style={{ padding: 40, textAlign: 'center', color: 'var(--txt3)' }}>
              <div style={{ fontSize: 28, marginBottom: 8 }}>📭</div>
              No payment records found.
            </div>
          ) : (
            filtered.map((p: any, idx: number) => {
              const cfg = STATUS_CFG[p.status] || { label: p.status, color: 'var(--txt3)', bg: 'var(--faint)' };
              return (
                <div key={p.id} style={{ display: 'grid', gridTemplateColumns: '30px 90px 90px 90px 1fr 90px 80px', padding: '8px 12px', gap: 8, alignItems: 'center', borderBottom: idx < filtered.length - 1 ? '1px solid var(--faint)' : 'none' }}>
                  <div style={{ fontSize: 10, color: 'var(--txt3)' }}>{idx + 1}</div>
                  <div style={{ fontSize: 11, color: 'var(--txt)', fontWeight: 600 }}>{p.date}</div>
                  <div style={{ fontSize: 11, color: '#22c55e', fontWeight: 700 }}>₹{Number(p.amount).toLocaleString('en-IN')}</div>
                  <div style={{ fontSize: 10, color: 'var(--txt2)' }}>{p.mode}</div>
                  <div style={{ fontSize: 10, color: 'var(--txt3)', fontFamily: 'monospace' }}>{p.ref || '—'}</div>
                  <div style={{ fontSize: 10, color: 'var(--txt2)' }}>{p.agent?.name || '—'}</div>
                  <div>
                    <span style={{ background: cfg.bg, color: cfg.color, border: `1px solid ${cfg.color}30`, padding: '2px 7px', borderRadius: 10, fontSize: 9, fontWeight: 700 }}>
                      {cfg.label}
                    </span>
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>
    </div>
  );
};

// ─── Payment Summary Modal ─────────────────────────────────────────────────
const PaymentSummaryModal = ({ lead }: { lead: any }) => {
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!lead?.id) return;
    setLoading(true);
    fetch(`/api/leads/${lead.id}/payments`)
      .then(r => r.json())
      .then(d => { setData(d); setLoading(false); })
      .catch(() => setLoading(false));
  }, [lead?.id]);

  const s = data?.summary || {};
  const outstanding = lead?.outstanding || 0;
  const recovered = s.cleared || 0;
  const recoveryPct = outstanding > 0 ? Math.min(100, (recovered / outstanding) * 100) : 0;

  // Group payments by month for chart
  const monthlyData: Record<string, number> = {};
  (data?.payments || []).filter((p: any) => p.status === 'cleared').forEach((p: any) => {
    const m = p.date?.substring(0, 7) || 'Unknown';
    monthlyData[m] = (monthlyData[m] || 0) + p.amount;
  });
  const months = Object.keys(monthlyData).sort().slice(-6);
  const maxMonthly = Math.max(...months.map(m => monthlyData[m]), 1);

  return (
    <div style={{ padding: '0 20px 20px' }}>
      {loading ? (
        <div style={{ padding: 60, textAlign: 'center', color: 'var(--txt3)' }}>⏳ Loading...</div>
      ) : (
        <>
          {/* Top KPI Row */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 12, marginBottom: 20 }}>
            {[
              { label: 'Total Collected', val: `₹${Number(s.cleared || 0).toLocaleString('en-IN')}`,  color: '#22c55e', bg: 'rgba(34,197,94,0.06)',   icon: '✅', note: `${s.clearedCount || 0} cleared payments` },
              { label: 'Pending Approval',val: `₹${Number(s.pending || 0).toLocaleString('en-IN')}`,  color: '#f59e0b', bg: 'rgba(245,158,11,0.06)', icon: '⏳', note: `${s.pendingCount || 0} pending payments` },
              { label: 'Rejected Amount', val: `₹${Number(s.rejected || 0).toLocaleString('en-IN')}`, color: '#ef4444', bg: 'rgba(239,68,68,0.06)',  icon: '❌', note: `${s.rejectedCount || 0} rejected payments` },
            ].map(k => (
              <div key={k.label} style={{ background: k.bg, border: `1px solid ${k.color}25`, borderRadius: 10, padding: '14px 16px' }}>
                <div style={{ fontSize: 20, marginBottom: 4 }}>{k.icon}</div>
                <div style={{ fontSize: 20, fontWeight: 800, color: k.color, marginBottom: 2 }}>{k.val}</div>
                <div style={{ fontSize: 10, color: 'var(--txt)', fontWeight: 600 }}>{k.label}</div>
                <div style={{ fontSize: 9, color: 'var(--txt3)', marginTop: 2 }}>{k.note}</div>
              </div>
            ))}
          </div>

          {/* Recovery Progress */}
          <div style={{ background: 'var(--bg3)', border: '1px solid var(--bdr)', borderRadius: 10, padding: '16px 20px', marginBottom: 20 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 }}>
              <div>
                <div style={{ fontSize: 13, fontWeight: 700, color: 'var(--txt)', marginBottom: 2 }}>Recovery Progress</div>
                <div style={{ fontSize: 10, color: 'var(--txt3)' }}>
                  Outstanding: ₹{Number(outstanding).toLocaleString('en-IN')} &nbsp;•&nbsp; Collected: ₹{Number(recovered).toLocaleString('en-IN')}
                </div>
              </div>
              <div style={{ fontSize: 28, fontWeight: 900, color: recoveryPct >= 75 ? '#22c55e' : recoveryPct >= 40 ? '#f59e0b' : '#ef4444' }}>
                {recoveryPct.toFixed(1)}%
              </div>
            </div>
            <div style={{ height: 10, background: 'var(--faint)', borderRadius: 999, overflow: 'hidden' }}>
              <div style={{ height: '100%', width: `${recoveryPct}%`, background: recoveryPct >= 75 ? 'linear-gradient(90deg, #22c55e, #16a34a)' : recoveryPct >= 40 ? 'linear-gradient(90deg, #f59e0b, #d97706)' : 'linear-gradient(90deg, #ef4444, #dc2626)', borderRadius: 999, transition: 'width 0.6s ease' }} />
            </div>
          </div>

          {/* Monthly bar chart */}
          {months.length > 0 && (
            <div style={{ background: 'var(--bg3)', border: '1px solid var(--bdr)', borderRadius: 10, padding: '16px 20px' }}>
              <div style={{ fontSize: 12, fontWeight: 700, color: 'var(--txt)', marginBottom: 14 }}>Monthly Collections (Last 6 Months)</div>
              <div style={{ display: 'flex', alignItems: 'flex-end', gap: 8, height: 100 }}>
                {months.map(m => {
                  const val = monthlyData[m];
                  const h = Math.max(6, (val / maxMonthly) * 90);
                  const [yr, mo] = m.split('-');
                  const label = new Date(parseInt(yr), parseInt(mo) - 1).toLocaleString('default', { month: 'short' });
                  return (
                    <div key={m} style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4 }}>
                      <div style={{ fontSize: 8, color: '#22c55e', fontWeight: 700 }}>₹{(val / 1000).toFixed(0)}K</div>
                      <div style={{ width: '100%', height: `${h}px`, background: 'linear-gradient(180deg, #22c55e, #16a34a)', borderRadius: '4px 4px 0 0', transition: 'height 0.4s ease' }} title={`${m}: ₹${val.toLocaleString('en-IN')}`} />
                      <div style={{ fontSize: 8, color: 'var(--txt3)' }}>{label}</div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {months.length === 0 && (
            <div style={{ textAlign: 'center', padding: '30px', color: 'var(--txt3)' }}>
              <div style={{ fontSize: 32, marginBottom: 8 }}>📊</div>
              No cleared payments found yet.
            </div>
          )}
        </>
      )}
    </div>
  );
};

/* ── Settlement History Modal ─────────────────────────────── */
const SettlementHistoryModal = ({ lead }: { lead: any }) => {
  const [data, setData] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!lead?.id) return;
    setLoading(true);
    fetch(`/api/settlements?customerId=${lead.id}&status=all`)
      .then(r => r.json())
      .then(d => { setData(Array.isArray(d) ? d : []); setLoading(false); })
      .catch(() => setLoading(false));
  }, [lead?.id]);

  const STATUS_MAP: any = {
    Raised: { color: 'var(--amb)', label: 'Raised' },
    Approve: { color: 'var(--grn)', label: 'Approved' },
    Rejected: { color: 'var(--red)', label: 'Rejected' },
    Pending: { color: 'var(--pur)', label: 'Pending' },
  };

  return (
    <div style={{ padding: '0 20px 20px' }}>
      {loading ? (
        <div style={{ padding: 40, textAlign: 'center' }}>Loading history...</div>
      ) : data.length === 0 ? (
        <div style={{ padding: 40, textAlign: 'center', color: 'var(--txt3)' }}>No settlement history found for this customer.</div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          {data.map((s: any) => {
            const cfg = STATUS_MAP[s.status] || { color: 'var(--txt3)', label: s.status };
            return (
              <div key={s.id} style={{ background: 'var(--bg3)', border: '1px solid var(--bdr)', borderRadius: 10, padding: 15 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 10 }}>
                  <div style={{ fontSize: 13, fontWeight: 700, display: 'flex', alignItems: 'center', gap: 8 }}>
                    <span>{s.reason}</span>
                    {s.amount > 0 && <span style={{ color: 'var(--red)', background: 'rgba(239,68,68,0.06)', padding: '1px 6px', borderRadius: 4, fontSize: 10 }}>₹{s.amount.toLocaleString('en-IN')}</span>}
                  </div>
                  <span style={{ fontSize: 10, fontWeight: 700, color: cfg.color, background: `${cfg.color}15`, padding: '2px 8px', borderRadius: 10, border: `1px solid ${cfg.color}30` }}>
                    {cfg.label}
                  </span>
                </div>
                <div style={{ fontSize: 11, color: 'var(--txt2)', marginBottom: 8 }}>
                  <b>Agent Remarks:</b> {s.justification}
                </div>
                {s.remarks && (
                  <div style={{ fontSize: 11, color: 'var(--txt)', background: 'rgba(255,255,255,0.03)', padding: 8, borderRadius: 6, borderLeft: '3px solid var(--acc2)' }}>
                    <b>Manager Remarks:</b> {s.remarks}
                  </div>
                )}
                <div style={{ fontSize: 9, color: 'var(--txt3)', marginTop: 10, textAlign: 'right' }}>
                  Requested on {new Date(s.createdAt).toLocaleDateString()}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};


const CallLogsModal = ({ lead }: { lead: any }) => {
  const [logs, setLogs] = useState<any[]>([]);
  const [totalCount, setTotalCount] = useState(0);
  const [stats, setStats] = useState({ rpcCount: 0, ptpCount: 0, ncCount: 0 });
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [filterCS, setFilterCS] = useState('');
  const [search, setSearch] = useState('');
  const [expanded, setExpanded] = useState<number | null>(null);

  useEffect(() => {
    if (!lead) {
      setLoading(false);
      return;
    }
    const fetchLogs = async () => {
      setLoading(true);
      try {
        const query = new URLSearchParams({
          page: page.toString(),
          limit: PAGE_SIZE.toString()
        });
        if (filterCS) query.append('status', filterCS);
        if (search) query.append('search', search);

        const res = await fetch(`/api/leads/${lead.id}/call-logs?${query.toString()}`);
        const data = await res.json();

        if (data && data.logs) {
          setLogs(data.logs);
          setTotalCount(data.totalCount || 0);
          if (data.stats) setStats(data.stats);
        } else if (Array.isArray(data)) {
          // Fallback if API hasn't deployed properly
          setLogs(data);
          setTotalCount(data.length);
        }
      } catch (e) { console.error(e); }
      finally { setLoading(false); }
    };
    fetchLogs();
  }, [lead?.id, page, filterCS, search]); // Re-fetch on page or filter change

  const totalPages = Math.max(1, Math.ceil(totalCount / PAGE_SIZE));

  return (
    <div style={{ padding: '0 20px 20px' }}>

      {/* Summary Stats */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 8, marginBottom: 16 }}>
        {[
          { label: 'Total Calls', val: totalCount, color: 'var(--acc2)', bg: 'rgba(79,125,255,0.06)' },
          { label: 'RPC', val: stats.rpcCount, color: '#22c55e', bg: 'rgba(34,197,94,0.06)' },
          { label: 'PTP', val: stats.ptpCount, color: '#f59e0b', bg: 'rgba(245,158,11,0.06)' },
          { label: 'Not Connected', val: stats.ncCount, color: '#6b7280', bg: 'rgba(107,114,128,0.06)' },
        ].map(s => (
          <div key={s.label} style={{ background: s.bg, border: `1px solid ${s.color}20`, borderRadius: 6, padding: '4px 8px', textAlign: 'center' }}>
            <div style={{ fontSize: 16, fontWeight: 800, color: s.color }}>{s.val}</div>
            <div style={{ fontSize: 8, color: 'var(--txt3)', textTransform: 'uppercase', letterSpacing: 0.5 }}>{s.label}</div>
          </div>
        ))}
      </div>

      {/* Filters Row */}
      <div style={{ display: 'flex', gap: 10, marginBottom: 12, alignItems: 'center' }}>
        <div style={{ flex: 1, position: 'relative' }}>
          <span style={{ position: 'absolute', left: 10, top: '50%', transform: 'translateY(-50%)', color: 'var(--txt3)', fontSize: 13 }}>⌕</span>
          <input
            style={{ width: '100%', background: 'var(--bg2)', border: '1px solid var(--bdr)', borderRadius: 6, padding: '6px 10px 6px 28px', fontSize: 11, color: 'var(--txt)', outline: 'none' }}
            placeholder="Search logs..."
            value={search}
            onChange={e => { setSearch(e.target.value); setPage(1); }}
          />
        </div>
        <select
          style={{ background: 'var(--bg2)', border: '1px solid var(--bdr)', borderRadius: 6, padding: '6px 10px', fontSize: 11, color: 'var(--txt)', outline: 'none' }}
          value={filterCS}
          onChange={e => { setFilterCS(e.target.value); setPage(1); }}
        >
          <option value="">All Statuses</option>
          {Object.keys(CONNECT_STATUS_COLORS).map(k => <option key={k} value={k}>{k}</option>)}
        </select>
        <div style={{ fontSize: 10, color: 'var(--txt3)', whiteSpace: 'nowrap' }}>
          {totalCount} records
        </div>
      </div>

      {/* Table */}
      <div style={{ border: '1px solid var(--bdr)', borderRadius: 8, overflow: 'hidden' }}>
        {/* Table Header */}
        <div style={{ display: 'grid', gridTemplateColumns: '30px 100px 1.3fr 1.3fr 1.6fr 110px 80px', background: 'var(--bg-top)', borderBottom: '1px solid var(--bdr)', padding: '6px 10px', gap: 6 }}>
          {['#', 'Date & Time', 'Connect Status', 'Disposition', 'Sub-Disposition', 'Agent', 'Amount'].map(h => (
            <div key={h} style={{ fontSize: 9, fontWeight: 700, color: 'var(--txt3)', textTransform: 'uppercase', letterSpacing: 0.4 }}>{h}</div>
          ))}
        </div>

        {/* Rows */}
        <div style={{ maxHeight: '55vh', overflowY: 'auto', background: 'var(--bg2)' }}>
          {loading ? (
            <div style={{ padding: '40px', textAlign: 'center', color: 'var(--txt3)' }}>
              <div style={{ fontSize: 24, marginBottom: 8 }}>⏳</div>Loading...
            </div>
          ) : !logs.length ? (
            <div style={{ padding: '40px', textAlign: 'center', color: 'var(--txt3)' }}>
              <div style={{ fontSize: 24, marginBottom: 8 }}>📭</div>No logs match your filter.
            </div>
          ) : (
            logs.map((log, idx) => {
              const d = log.details as any;
              const csColor = CONNECT_STATUS_COLORS[d?.connectStatus] || '#6b7280';
              const ts = new Date(log.timestamp);
              const dateStr = ts.toLocaleDateString('en-IN', { day: '2-digit', month: 'short' });
              const timeStr = ts.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' });
              const rowNum = (page - 1) * PAGE_SIZE + idx + 1;
              const isExp = expanded === log.id;

              return (
                <div key={log.id}
                  onClick={() => setExpanded(isExp ? null : log.id)}
                  style={{
                    display: 'flex', flexDirection: 'column',
                    borderBottom: idx < logs.length - 1 ? '1px solid var(--faint)' : 'none',
                    cursor: 'pointer',
                    background: isExp ? 'rgba(79,125,255,0.03)' : 'transparent',
                    transition: 'background 0.1s'
                  }}
                >
                  <div style={{ display: 'grid', gridTemplateColumns: '30px 100px 1.3fr 1.3fr 1.6fr 110px 80px', padding: '7px 10px', gap: 6, alignItems: 'center' }}>
                    <div style={{ fontSize: 10, color: 'var(--txt3)' }}>{rowNum}</div>
                    <div>
                      <div style={{ fontSize: 10, color: 'var(--txt)', fontWeight: 600 }}>{dateStr}</div>
                      <div style={{ fontSize: 9, color: 'var(--txt3)' }}>{timeStr}</div>
                    </div>
                    <div>
                      <span style={{ background: `${csColor}15`, color: csColor, border: `1px solid ${csColor}30`, borderRadius: 4, padding: '2px 6px', fontSize: 9, fontWeight: 700 }}>
                        {d?.connectStatus || '—'}
                      </span>
                    </div>
                    <div style={{ fontSize: 10, color: 'var(--txt2)' }}>{d?.disposition || '—'}</div>
                    <div style={{ fontSize: 10, color: 'var(--txt3)' }}>{d?.subDisposition || '—'}</div>
                    <div style={{ fontSize: 10, color: 'var(--txt2)', display: 'flex', flexDirection: 'column' }}>
                      <span>{log.user?.name || '—'}</span>
                      {log.user?.empId && <span style={{ color: 'var(--txt3)', fontSize: 9 }}>({log.user.empId})</span>}
                    </div>
                    <div style={{ fontSize: 10, color: d?.amount ? '#22c55e' : 'var(--txt3)', fontWeight: d?.amount ? 700 : 400 }}>
                      {d?.amount ? `₹${Number(d.amount).toLocaleString('en-IN')}` : '—'}
                    </div>
                  </div>

                  {/* Expanded remarks row - ALWAYS SHOWN */}
                  {(d && Object.keys(d).length > 0) && (
                    <div style={{ padding: '0 10px 8px 46px', display: 'flex', gap: 12, flexWrap: 'wrap' }}>
                      {d?.remarks && (
                        <div style={{ fontSize: 11, color: 'var(--txt3)', background: 'var(--bg3)', padding: '5px 8px', borderRadius: 4, borderLeft: '2px solid rgba(79,125,255,0.4)', fontStyle: 'italic', flex: 1 }}>
                          "{d.remarks}"
                        </div>
                      )}
                      <div style={{ display: 'flex', gap: 10, alignItems: 'center', flexShrink: 0, flexWrap: 'wrap' }}>
                        {d?.date && <span style={{ fontSize: 10, color: 'var(--txt3)' }}>📅 PTP Date: {d.date}</span>}
                        {d?.altNumber && <span style={{ fontSize: 10, color: 'var(--txt2)' }}>📱 Alt: {d.altNumber}</span>}
                        {d?.callDrop && d.callDrop !== 'No' && <span style={{ fontSize: 10, color: '#ef4444', background: 'rgba(239,68,68,0.1)', padding: '1px 5px', borderRadius: 3 }}>⚠ Call Drop: {d.callDrop}</span>}
                        {d?.upgradeFlag && (
                          <span style={{ fontSize: 10, color: 'var(--pur)', background: 'var(--purbg)', border: '1px solid rgba(167,139,250,0.3)', padding: '1px 5px', borderRadius: 3 }}>
                            ⭐ {d.upgradeFlag} {d.upgradeType ? `(${d.upgradeType})` : d.upgradeReason ? `(${d.upgradeReason})` : ''}
                          </span>
                        )}
                        {/* Dynamic render for any other fields not explicitly handled */}
                        {Object.entries(d || {})
                          .filter(([k, v]) => !['connectStatus', 'disposition', 'subDisposition', 'remarks', 'callDrop', 'altNumber', 'userId', 'amount', 'date', 'upgradeFlag', 'upgradeType', 'upgradeReason'].includes(k) && v !== null && v !== undefined && v !== '')
                          .map(([k, v]) => (
                            <span key={k} style={{ fontSize: 10, color: 'var(--txt2)', background: 'var(--faint)', border: '1px solid var(--bdr)', padding: '1px 5px', borderRadius: 3 }}>
                              {k.replace(/([A-Z])/g, ' $1').trim().toUpperCase()}: {String(v)}
                            </span>
                          ))
                        }
                      </div>
                    </div>
                  )}
                </div>
              );
            })
          )}
        </div>
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: 12 }}>
          <div style={{ fontSize: 10, color: 'var(--txt3)' }}>
            Page {page} of {totalPages}
          </div>
          <div style={{ display: 'flex', gap: 4 }}>
            <button className="btn sm" onClick={() => setPage(1)} disabled={page === 1} style={{ opacity: page === 1 ? 0.4 : 1, padding: '4px 8px', fontSize: 10 }}>«</button>
            <button className="btn sm" onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page === 1} style={{ opacity: page === 1 ? 0.4 : 1, padding: '4px 8px', fontSize: 10 }}>‹ Prev</button>
            {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
              const p = Math.max(1, Math.min(totalPages - 4, page - 2)) + i;
              return (
                <button key={p} className="btn sm"
                  onClick={() => setPage(p)}
                  style={{ background: p === page ? 'var(--acc)' : 'transparent', color: p === page ? '#fff' : 'var(--txt2)', border: '1px solid var(--bdr)', minWidth: 26, padding: '4px 0', fontSize: 10 }}>
                  {p}
                </button>
              );
            })}
            <button className="btn sm" onClick={() => setPage(p => Math.min(totalPages, p + 1))} disabled={page === totalPages} style={{ opacity: page === totalPages ? 0.4 : 1, padding: '4px 8px', fontSize: 10 }}>Next ›</button>
            <button className="btn sm" onClick={() => setPage(totalPages)} disabled={page === totalPages} style={{ opacity: page === totalPages ? 0.4 : 1, padding: '4px 8px', fontSize: 10 }}>»</button>
          </div>
        </div>
      )}
    </div>
  );
};

const EditLeadModal = ({ lead, onDone }: { lead: any, onDone: () => void }) => {
  const { user, closeModal, toast } = useApp();
  const [loading, setLoading] = useState(false);
  // ... rest of state ...
  const [connectStatus, setConnectStatus] = useState('');
  const [disposition, setDisposition] = useState('');
  const [subDisposition, setSubDisposition] = useState('');

  const [date, setDate] = useState('');
  const [amount, setAmount] = useState('');
  const [settlement, setSettlement] = useState('');
  const [callDrop, setCallDrop] = useState('No');
  const [altNumber, setAltNumber] = useState('');
  const [remarks, setRemarks] = useState('');
  const [upgradeFlag, setUpgradeFlag] = useState('');
  const [upgradeType, setUpgradeType] = useState('');
  const [upgradeReason, setUpgradeReason] = useState('');

  const dispositions = connectStatus && DISPOSITION_LOGIC[connectStatus] ? Object.keys(DISPOSITION_LOGIC[connectStatus]) : [];
  const subDispositions = connectStatus && disposition && DISPOSITION_LOGIC[connectStatus][disposition] ? DISPOSITION_LOGIC[connectStatus][disposition] : [];
  const activeLogic = subDispositions.find((s: any) => s.name === subDisposition) || {};

  // Reset dependent fields when parent changes
  useEffect(() => { setDisposition(''); setSubDisposition(''); }, [connectStatus]);
  useEffect(() => { setSubDisposition(''); }, [disposition]);

  const handleSubmit = async () => {
    if (!connectStatus || !disposition) { toast('Please select Connect Status and Disposition'); return; }
    setLoading(true);
    try {
      const res = await fetch(`/api/leads/${lead.id}/disposition`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId: user?.id,
          connectStatus,
          disposition,
          subDisposition,
          date,
          amount,
          settlement,
          callDrop,
          altNumber,
          remarks,
          upgradeFlag,
          upgradeType,
          upgradeReason
        })
      });
      if (res.ok) {
        toast('Lead disposition updated successfully');
        closeModal();
        onDone();
      } else {
        toast('Failed to update disposition');
      }
    } catch (e) {
      console.error(e);
      toast('Error updating disposition');
    } finally {
      setLoading(false);
    }
  };

  const showAltNumber = ['Right Party Connect', 'Third Party Connect', 'Wrong Party Connect'].includes(connectStatus);

  return (
    <div style={{ padding: '0 20px 20px' }}>
      <div style={{ background: 'rgba(79,125,255,0.08)', border: '1px solid rgba(79,125,255,0.2)', padding: '12px 16px', borderRadius: 8, marginBottom: 20, color: 'var(--acc2)', fontSize: 13 }}>
        Updating Disposition for: <b>{lead?.name}</b> <span style={{ color: 'var(--txt3)' }}>·</span> <b>{lead?.account_no}</b>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 15, marginBottom: 15 }}>
        <div className="ff">
          <label>CONNECT STATUS *</label>
          <select className="finp" value={connectStatus} onChange={e => setConnectStatus(e.target.value)}>
            <option value="">— Select —</option>
            {Object.keys(DISPOSITION_LOGIC).map(k => <option key={k} value={k}>{k}</option>)}
          </select>
        </div>
        <div className="ff">
          <label>DISPOSITION *</label>
          <select className="finp" value={disposition} onChange={e => setDisposition(e.target.value)} disabled={!dispositions.length}>
            <option value="">— Select —</option>
            {dispositions.map(k => <option key={k} value={k}>{k}</option>)}
          </select>
        </div>
        <div className="ff">
          <label>SUB DISPOSITION</label>
          <select className="finp" value={subDisposition} onChange={e => setSubDisposition(e.target.value)} disabled={!subDispositions.length}>
            <option value="">— Select —</option>
            {subDispositions.map((s: any) => <option key={s.name} value={s.name}>{s.name}</option>)}
          </select>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 15, marginBottom: 15 }}>
        {activeLogic.date && (
          <div className="ff">
            <label>ACTION DATE</label>
            <input className="finp" type="date" value={date} onChange={e => setDate(e.target.value)} />
          </div>
        )}
        {activeLogic.amount && (
          <div className="ff">
            <label>AMOUNT (₹)</label>
            <input className="finp" type="number" placeholder="0" value={amount} onChange={e => setAmount(e.target.value)} />
          </div>
        )}
        {activeLogic.settlement && (
          <div className="ff">
            <label>SETTLEMENT AMOUNT (₹)</label>
            <input className="finp" type="number" placeholder="0" value={settlement} onChange={e => setSettlement(e.target.value)} />
          </div>
        )}
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 15, marginBottom: 20 }}>
        {showAltNumber && (
          <div className="ff">
            <label>CALL DROP?</label>
            <select className="finp" value={callDrop} onChange={e => setCallDrop(e.target.value)}>
              <option value="No">No</option>
              <option value="Yes">Yes</option>
            </select>
          </div>
        )}
        {showAltNumber && (
          <div className="ff">
            <label>ALTERNATE NUMBER</label>
            <input className="finp" placeholder="Enter alternate mobile..." value={altNumber} onChange={e => setAltNumber(e.target.value)} />
          </div>
        )}
      </div>

      {lead?.eligible_upgrade === 'Y' && (
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 15, marginBottom: 20 }}>
          <div className="ff">
            <label>UPGRADE FLAG</label>
            <select className="finp" value={upgradeFlag} onChange={e => { setUpgradeFlag(e.target.value); setUpgradeType(''); setUpgradeReason(''); }}>
              <option value="">— Select —</option>
              <option value="Upgraded">Upgraded</option>
              <option value="Pending For Upgrade">Pending For Upgrade</option>
            </select>
          </div>
          {upgradeFlag === 'Upgraded' && (
            <div className="ff">
              <label>UPGRADE TYPE</label>
              <select className="finp" value={upgradeType} onChange={e => setUpgradeType(e.target.value)}>
                <option value="">— Select —</option>
                <option value="System">System</option>
                <option value="Payment Received">Payment Received</option>
                <option value="Money Collection">Money Collection</option>
                <option value="Reversal">Reversal</option>
              </select>
            </div>
          )}
          {upgradeFlag === 'Pending For Upgrade' && (
            <div className="ff">
              <label>UPGRADE REASON</label>
              <select className="finp" value={upgradeReason} onChange={e => setUpgradeReason(e.target.value)}>
                <option value="">— Select —</option>
                <option value="Multi Card Payment Due">Multi Card Payment Due</option>
                <option value="ONE Card Write Off">ONE Card Write Off</option>
                <option value="Multi Card Write Off">Multi Card Write Off</option>
                <option value="Card Settlement">Card Settlement</option>
                <option value="Card Settlement (J5/J6)">Card Settlement (J5/J6)</option>
                <option value="Intrest Payment Due">Intrest Payment Due</option>
                <option value="Customer Refused to Pay">Customer Refused to Pay</option>
                <option value="Customer Not Contactable">Customer Not Contactable</option>
              </select>
            </div>
          )}
        </div>
      )}

      <div className="ff" style={{ marginBottom: 25 }}>
        <label>REMARKS / CALL NOTES *</label>
        <textarea className="finp" rows={3} style={{ resize: 'vertical' }} placeholder="Enter detailed interaction notes..." value={remarks} onChange={e => setRemarks(e.target.value)} />
      </div>

      <button className="btn pr" style={{ width: '100%', padding: '12px', background: 'var(--acc)' }} onClick={handleSubmit} disabled={loading}>
        {loading ? 'Saving...' : '✓ Save Disposition'}
      </button>
    </div>
  );
};

const RecordLeadPaymentModal = ({ lead, onDone }: { lead: any, onDone: () => void }) => {
  const { user, closeModal, toast } = useApp();
  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState({
    amount: '',
    mode: 'NEFT',
    ref: '',
    date: new Date().toISOString().split('T')[0],
    remarks: '',
    upgradeFlag: '',
    upgradeType: '',
    status: lead.status || 'ACTIVE'
  });

  const handleSubmit = async () => {
    if (!form.amount) { toast('Please enter amount'); return; }
    setLoading(true);
    try {
      // 1. Create Payment
      const payRes = await fetch('/api/payments', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          customerId: lead.id,
          amount: form.amount,
          mode: form.mode,
          ref: form.ref,
          date: form.date,
          remarks: form.remarks,
          agentId: user?.id
        })
      });

      // 1.5 Update Lead Status if changed
      if (form.status !== lead.status) {
        await fetch(`/api/leads/${lead.id}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ status: form.status })
        });
      }

      // 2. If Upgraded, update lead via disposition API
      if (lead.eligible_upgrade === 'Y' && form.upgradeFlag) {
        await fetch(`/api/leads/${lead.id}/disposition`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            userId: user?.id,
            connectStatus: 'Right Party Connect',
            disposition: 'Promised to Pay',
            subDisposition: 'Full Outstanding Amount',
            remarks: `Payment Recorded: ${form.remarks}`,
            upgradeFlag: form.upgradeFlag,
            upgradeType: form.upgradeType
          })
        });
      }

      if (payRes.ok) {
        toast('Payment recorded successfully ✓');
        closeModal();
        onDone();
      }
    } catch (e) {
      toast('Error recording payment');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ padding: '0 20px 15px' }}>
      <div style={{ display: 'flex', gap: 12, marginBottom: 12, flexWrap: 'wrap' }}>
        <div style={{ flex: 1, minWidth: 200, background: 'rgba(34,197,94,0.08)', border: '1px solid rgba(34,197,94,0.2)', padding: '10px 14px', borderRadius: 8, color: 'var(--grn)', fontSize: 13, fontWeight: 600, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <span>Outstanding: ₹{Number(lead.outstanding || 0).toLocaleString('en-IN')}</span>
        </div>
        <div style={{ flex: 2, minWidth: 250, background: 'rgba(245,166,35,0.06)', border: '1px solid rgba(245,166,35,0.15)', padding: '10px 14px', borderRadius: 8, color: 'var(--amb)', fontSize: 11.5, lineHeight: 1.4, display: 'flex', alignItems: 'center' }}>
          ⌛ Payment will go to <b style={{ color: 'var(--amb)', marginLeft: 4 }}>Pending Approval</b> queue. Manager approval required.
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 12, marginBottom: 12 }}>
        <div className="ff">
          <label style={{ fontSize: 9, letterSpacing: 0.5, color: 'var(--txt3)' }}>AMOUNT (₹) *</label>
          <input className="finp" type="number" value={form.amount} onChange={e => setForm({...form, amount: e.target.value})} placeholder="0" />
        </div>
        <div className="ff">
          <label style={{ fontSize: 9, letterSpacing: 0.5, color: 'var(--txt3)' }}>PAYMENT MODE</label>
          <select className="finp" value={form.mode} onChange={e => setForm({...form, mode: e.target.value})}>
            {['NEFT', 'IMPS', 'UPI', 'Cash', 'Cheque', 'DD'].map(m => <option key={m} value={m}>{m}</option>)}
          </select>
        </div>
        <div className="ff">
          <label style={{ fontSize: 9, letterSpacing: 0.5, color: 'var(--txt3)' }}>PAYMENT DATE</label>
          <input className="finp" type="date" value={form.date} onChange={e => setForm({...form, date: e.target.value})} />
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 12 }}>
        <div className="ff">
          <label style={{ fontSize: 9, letterSpacing: 0.5, color: 'var(--txt3)' }}>REFERENCE NO.</label>
          <input className="finp" value={form.ref} onChange={e => setForm({...form, ref: e.target.value})} placeholder="UTR / Ref number" />
        </div>
        <div className="ff">
          <label style={{ fontSize: 9, letterSpacing: 0.5, color: 'var(--txt3)' }}>UPDATE STATUS</label>
          <select 
            className="finp" 
            style={{ height: '36px', borderRadius: 10, border: '1px solid var(--pur)', background: 'var(--purbg)', color: 'var(--pur)', fontWeight: 700 }}
            value={form.status}
            onChange={e => setForm({...form, status: e.target.value})}
          >
            {/* The user specifically wanted these 4 + current status */}
            {Array.from(new Set([lead.status || 'ACTIVE', 'Rollback', 'Rollforward', 'Normilization', 'STAB'])).map(s => (
              <option key={s} value={s}>{s}</option>
            ))}
          </select>
        </div>
      </div>

      {lead.eligible_upgrade === 'Y' && (
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 12 }}>
          <div className="ff">
            <label style={{ fontSize: 9, letterSpacing: 0.5, color: 'var(--txt3)' }}>UPGRADE FLAG</label>
            <select className="finp" value={form.upgradeFlag} onChange={e => setForm({...form, upgradeFlag: e.target.value, upgradeType: ''})}>
              <option value="">— Select —</option>
              <option value="Upgraded">Upgraded</option>
              <option value="Pending For Upgrade">Pending For Upgrade</option>
            </select>
          </div>
          <div className="ff">
            <label style={{ fontSize: 9, letterSpacing: 0.5, color: 'var(--txt3)' }}>UPGRADE TYPE</label>
            <select className="finp" value={form.upgradeType} onChange={e => setForm({...form, upgradeType: e.target.value})} disabled={!form.upgradeFlag}>
              <option value="">— Select —</option>
              <option value="System">System</option>
              <option value="Payment Received">Payment Received</option>
              <option value="Money Collection">Money Collection</option>
              <option value="Reversal">Reversal</option>
            </select>
          </div>
        </div>
      )}

      <div className="ff" style={{ marginBottom: 15 }}>
        <label style={{ fontSize: 9, letterSpacing: 0.5, color: 'var(--txt3)' }}>REMARKS / NOTES</label>
        <textarea className="finp" rows={2} style={{ resize: 'vertical', minHeight: '60px' }} value={form.remarks} onChange={e => setForm({...form, remarks: e.target.value})} placeholder="Payment notes..." />
      </div>

      <button className="btn pr" style={{ width: '100%', padding: '12px', background: 'rgba(34,197,94,0.1)', color: 'var(--grn)', border: '1px solid rgba(34,197,94,0.2)', fontWeight: 700, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 10 }} onClick={handleSubmit} disabled={loading}>
        {loading ? 'Processing...' : <><span style={{ fontSize: 16 }}>💳</span> Submit for Approval</>}
      </button>
    </div>
  );
};

const Leads = () => {
  const { openModal, user } = useApp();
  const [leads, setLeads] = useState<any[]>([]);
  const [leadColumns, setLeadColumns] = useState<any[]>([]);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);
  const [selectedLead, setSelectedLead] = useState<any>(null);
  const [filterTab, setFilterTab] = useState('all');
  const [showFilters, setShowFilters] = useState(false);
  const [statusOptions, setStatusOptions] = useState<string[]>([]);
  const [statusFilter, setStatusFilter] = useState('');
  const [portfolioOptions, setPortfolioOptions] = useState<any[]>([]);
  const [portfolioFilter, setPortfolioFilter] = useState('');
  const [dpdMin, setDpdMin] = useState('');
  const [dpdMax, setDpdMax] = useState('');
  const [outMin, setOutMin] = useState('');
  const [filterMonth, setFilterMonth] = useState(String(new Date().getMonth() + 1));
  const [filterYear, setFilterYear] = useState(String(new Date().getFullYear()));
  const [isTableMaximized, setIsTableMaximized] = useState(false);
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(25);
  const [totalCount, setTotalCount] = useState(0);
  const [leadPaySummary, setLeadPaySummary] = useState<any>(null);
  const [latestSettlement, setLatestSettlement] = useState<any>(null);

  useEffect(() => {
    fetchMetadata();
  }, []);

  useEffect(() => {
    if (!selectedLead?.id) { 
      setLeadPaySummary(null); 
      setLatestSettlement(null);
      return; 
    }
    
    // Fetch payment summary
    fetch(`/api/leads/${selectedLead.id}/payments`)
      .then(r => r.json())
      .then(d => setLeadPaySummary(d?.summary || null))
      .catch(() => setLeadPaySummary(null));

    // Fetch latest settlement status
    fetch(`/api/settlements?customerId=${selectedLead.id}&status=all&limit=1`)
      .then(r => r.json())
      .then(d => setLatestSettlement(Array.isArray(d) && d.length > 0 ? d[0] : null))
      .catch(() => setLatestSettlement(null));
  }, [selectedLead?.id]);

  useEffect(() => {
    setPage(1);
  }, [search, filterTab, statusFilter, portfolioFilter, dpdMin, dpdMax, outMin, filterMonth, filterYear]);

  useEffect(() => {
    setLoading(true);
    const timer = setTimeout(() => {
      fetchLeads();
    }, 300);
    return () => clearTimeout(timer);
  }, [search, filterTab, statusFilter, portfolioFilter, dpdMin, dpdMax, outMin, filterMonth, filterYear, page, limit]);

  const fetchMetadata = async () => {
    try {
      const res = await fetch(`/api/metadata?t=${Date.now()}`, { cache: 'no-store' });
      const data = await res.json();
      if (data.leadColumns) setLeadColumns(data.leadColumns);
      if (data.lists?.leadStatuses) setStatusOptions(data.lists.leadStatuses);
      if (data.portfolios) setPortfolioOptions(data.portfolios);
    } catch (e) { console.error(e); }
  };

  const fetchLeads = async () => {
    setLoading(true);
    try {
      const query = new URLSearchParams({ q: search, searchType: filterTab, userId: user?.id || '' });
      if (statusFilter) query.append('status', statusFilter);
      if (portfolioFilter) query.append('portfolio', portfolioFilter);
      if (dpdMin) query.append('dpdMin', dpdMin);
      if (dpdMax) query.append('dpdMax', dpdMax);
      if (outMin) query.append('outMin', outMin);
      if (filterMonth) query.append('month', filterMonth);
      if (filterYear) query.append('year', filterYear);
      query.append('paginate', 'true');
      query.append('page', page.toString());
      query.append('limit', limit.toString());
      query.append('t', Date.now().toString());

      const res = await fetch(`/api/leads?${query.toString()}`, { cache: 'no-store' });
      const data = await res.json();
      
      let leadsData = [];
      if (data.leads && Array.isArray(data.leads)) {
        leadsData = data.leads;
        setTotalCount(data.total || 0);
      } else if (Array.isArray(data)) {
        leadsData = data;
        setTotalCount(data.length);
      }

      setLeads(leadsData);
      if (leadsData.length > 0) {
        // If current selection is not in the new data, pick the first one
        if (!selectedLead || !leadsData.find((l: any) => l.id === selectedLead.id)) {
          setSelectedLead(leadsData[0]);
        }
      } else {
        setSelectedLead(null);
      }
    } catch (error) {
      console.error('Error fetching leads:', error);
      setLeads([]);
      setSelectedLead(null);
    } finally {
      setLoading(false);
    }
  };

  // Fixed column order & label overrides (independent of DB order)
  const COLUMN_ORDER: Record<string, { order: number; label: string }> = {
    account_no:            { order: 1,  label: 'Account Number'        },
    name:                  { order: 2,  label: 'Customer Name'         },
    mobile:                { order: 3,  label: 'Mobile Number'         },
    dpd:                   { order: 4,  label: 'DPD'                   },
    product:               { order: 5,  label: 'Product Type'          },
    bank:                  { order: 6,  label: 'Bank / Lender'         },
    status:                { order: 7,  label: 'Status'                },
    portfolio:             { order: 8,  label: 'Portfolio'             },
    city:                  { order: 9,  label: 'City'                  },
    state:                 { order: 10, label: 'State'                 },
    email:                 { order: 11, label: 'Email'                 },
    alt_mobile:            { order: 12, label: 'Alt Mobile'            },
    address:               { order: 13, label: 'Address'               },
    min_amt_due:           { order: 14, label: 'Min Amount Due'        },
    principle_outstanding: { order: 15, label: 'Principle Outstanding' },
    outstanding:           { order: 16, label: 'Total Outstanding'     },
    pan:                   { order: 17, label: 'PAN Number'            },
    bkt_2:                 { order: 18, label: 'Bucket'                },
    createdat:             { order: 19, label: 'Allocation Date'       },
    assignedagent:         { order: 20, label: 'Assigned Agent'        },
  };

  const applyOrder = (cols: any[]) =>
    cols
      .map(c => {
        const k = c.key?.toLowerCase();
        const override = COLUMN_ORDER[k];
        return override ? { ...c, label: override.label, _order: override.order } : { ...c, _order: 999 };
      })
      .sort((a, b) => a._order - b._order);

  const excluded = (c: any) => {
    const k = c.key?.toLowerCase();
    return k === 'eligible_for_update' || k === 'eligible_upgrade';
  };

  const tableCols = applyOrder(leadColumns.filter(c => c.visible !== false && !excluded(c)));
  const profileCols = applyOrder(leadColumns.filter(c => c.showInProfile !== false && !excluded(c)));

  const RaiseSettlementModal = ({ lead, onDone }: { lead: any, onDone: () => void }) => {
    const { toast, closeModal, user } = useApp();
    const [reason, setReason] = useState('');
    const [justification, setJustification] = useState('');
    const [amount, setAmount] = useState('');
    const [loading, setLoading] = useState(false);

    const reasons = [
      'Accident', 
      'dispute', 
      'medical issue', 
      'job loss', 
      'business Loss', 
      'depht in family', 
      'customer dead'
    ];

    const handleSubmit = async () => {
      if (!reason) { toast('Please select a reason for settlement'); return; }
      if (!amount || Number(amount) <= 0) { toast('Please provide a valid settlement amount'); return; }
      if (!justification.trim()) { toast('Please provide justification'); return; }
      setLoading(true);
      try {
        const res = await fetch('/api/settlements', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            customerId: lead.id,
            agentId: user?.id,
            reason,
            amount: Number(amount),
            justification
          })
        });
        if (res.ok) {
          toast('Settlement Request Raised ✓');
          closeModal();
          onDone();
        } else {
          toast((await res.json()).message || 'Failed to raise request');
        }
      } catch (e) {
        toast('Error raising request');
      } finally {
        setLoading(false);
      }
    };

    return (
      <div style={{ padding: '20px' }}>
        <div className="ff">
          <label>Reason for Settlement *</label>
          <select className="finp" style={{ borderRadius: 4 }} value={reason} onChange={e => setReason(e.target.value)}>
            <option value="">— Select Reason —</option>
            {reasons.map(r => <option key={r} value={r}>{r}</option>)}
          </select>
        </div>

        <div className="ff">
          <label>Settlement Amount (₹) *</label>
          <input type="number" className="finp" style={{ borderRadius: 4 }} value={amount} onChange={e => setAmount(e.target.value)} placeholder="e.g. 50000" />
        </div>

        <div className="ff">
          <label>Agent Justification *</label>
          <textarea className="finp" rows={4} style={{ borderRadius: 4, resize: 'vertical' }} value={justification} onChange={e => setJustification(e.target.value)} placeholder="Provide detailed justification for this settlement request..." />
        </div>

        <button className="btn pr" style={{ width: '100%', padding: '12px', fontSize: 13, borderRadius: 4 }} onClick={handleSubmit} disabled={loading}>
          {loading ? 'Raising...' : 'Raise Request for Settlement'}
        </button>
      </div>
    );
  };

  return (
    <>
      <style>{`
        .hide-scrollbar::-webkit-scrollbar { display: none; }
        .hide-scrollbar { -ms-overflow-style: none; scrollbar-width: none; }
        .num-dropdown .num-dropdown-list { display: none; }
        .num-dropdown:hover .num-dropdown-list,
        .num-dropdown:active .num-dropdown-list,
        .num-dropdown:focus-within .num-dropdown-list {
          display: block !important;
        }
      `}</style>
      <div id="pg-leads" className="page on">
        <div className="leads-wrapper">
        {/* CUSTOMER DASHBOARD HEADER */}
        {!isTableMaximized && (
          <div id="custDash" className="cust-dash filled" style={{ background: 'var(--bg2)', borderBottom: '1px solid var(--bdr)' }}>
            <div className="cust-dash-header">
              
              {/* LEFT SIDE: Avatar + Name OR skeleton OR placeholder */}
              <div style={{ flex: 1, minWidth: 0 }}>
                {loading ? (
                  <div style={{ display: 'flex', gap: 14, alignItems: 'center' }}>
                    <div style={{ width: 48, height: 48, borderRadius: '50%', background: 'var(--faint)', flexShrink: 0 }} className="skel" />
                    <div style={{ minWidth: 0, flex: 1 }}>
                      <div className="skel" style={{ width: 180, maxWidth: '100%', height: 16, marginBottom: 8 }} />
                      <div className="skel" style={{ width: 260, maxWidth: '100%', height: 11 }} />
                    </div>
                  </div>
                ) : !selectedLead ? (
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10, color: 'var(--txt3)', height: 48 }}>
                    <div style={{ fontSize: '20px', opacity: 0.5 }}>◉</div>
                    <div>Search and select a customer below to view details</div>
                  </div>
                ) : (
                  <div style={{ display: 'flex', gap: 14, alignItems: 'center' }}>
                    <div className="av" style={{ flexShrink: 0, width: 48, height: 48, fontSize: 18, background: 'var(--faint)', color: 'var(--acc2)', border: '1px solid var(--bdr)', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                      {selectedLead.name?.split(' ').map((n: any) => n[0]).join('').substring(0, 2)}
                    </div>
                    <div style={{ minWidth: 0, flex: 1 }}>
                      <div style={{ fontSize: 18, fontWeight: 700, color: 'var(--txt)', marginBottom: 4, display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
                        <span style={{ whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{selectedLead.name}</span>
                        {selectedLead.eligible_upgrade === 'Y' ? (
                          <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4, background: 'rgba(46,204,138,0.1)', color: 'var(--grn)', padding: '2px 8px', borderRadius: 12, fontSize: 11, border: '1px solid rgba(46,204,138,0.3)', fontWeight: 600 }}>
                            <span style={{ fontSize: 12 }}>✓</span> Eligible for Upgrade
                          </span>
                        ) : (
                          <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4, background: 'rgba(226,75,74,0.1)', color: 'var(--red)', padding: '2px 8px', borderRadius: 12, fontSize: 11, border: '1px solid rgba(226,75,74,0.3)', fontWeight: 600 }}>
                            <span style={{ fontSize: 12 }}>✕</span> Not Eligible for Upgrade
                          </span>
                        )}
                        <button style={{ display: 'inline-flex', alignItems: 'center', gap: 5, background: 'rgba(34,197,94,0.08)', border: '1px solid rgba(34,197,94,0.3)', color: '#22c55e', padding: '3px 10px', borderRadius: 12, fontSize: 11, fontWeight: 600, cursor: 'pointer' }}
                          onClick={() => openModal(`📋 Payment History — ${selectedLead.name}`, <PaymentHistoryModal lead={selectedLead} />, 900)}
                        >
                          📋 History
                        </button>
                        <button style={{ display: 'inline-flex', alignItems: 'center', gap: 5, background: 'rgba(167,139,250,0.08)', border: '1px solid rgba(167,139,250,0.3)', color: 'var(--pur)', padding: '3px 10px', borderRadius: 12, fontSize: 11, fontWeight: 600, cursor: 'pointer' }}
                          onClick={() => openModal(`📊 Payment Summary — ${selectedLead.name}`, <PaymentSummaryModal lead={selectedLead} />, 700)}
                        >
                          📊 Summary
                        </button>
                      </div>
                      <div style={{ fontSize: 12, color: 'var(--txt3)', display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap', overflow: 'hidden' }}>
                        <span style={{ whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                          {selectedLead.account_no} - {selectedLead.product || 'Personal Loan'} - {selectedLead.bank || 'HDFC Bank'}
                        </span>
                        {leadPaySummary !== null && (
                          <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4, background: 'rgba(34,197,94,0.1)', color: '#22c55e', padding: '1px 8px', borderRadius: 10, fontSize: 10, border: '1px solid rgba(34,197,94,0.25)', fontWeight: 700, whiteSpace: 'nowrap', flexShrink: 0 }}>
                            💰 Total Paid: ₹{Number(leadPaySummary.cleared || 0).toLocaleString('en-IN')}
                            {leadPaySummary.clearedCount > 0 && <span style={{ opacity: 0.7, fontWeight: 400 }}>({leadPaySummary.clearedCount})</span>}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                )}
              </div>

              {/* RIGHT SIDE: Action Buttons & Filters */}
              <div className="cust-dash-actions">
                <div className="cust-dash-actions-btns">
                  <button className={`btn sm ${!selectedLead ? 'dis' : ''}`} style={{ background: 'transparent', border: '1px solid var(--bdr)', color: 'var(--grn)', padding: '6px 12px' }} 
                    disabled={!selectedLead}
                    onClick={() => selectedLead && openModal(`Record Payment — ${selectedLead.name}`, <RecordLeadPaymentModal lead={selectedLead} onDone={fetchLeads} />, 800)}
                  >
                    💳 Payment
                  </button>
                  <button className="btn sm" style={{ background: 'transparent', border: '1px solid var(--bdr)', color: 'var(--amb)', padding: '6px 12px' }} 
                    onClick={() => openModal(`📞 Call Logs ${selectedLead ? `— ${selectedLead.name}` : ''}`, <CallLogsModal lead={selectedLead} />, 1100)}
                  >
                    📞 Call Logs
                  </button>
                  <button className={`btn sm ${!selectedLead ? 'dis' : ''}`} style={{ background: 'rgba(79,125,255,0.1)', border: '1px solid rgba(79,125,255,0.3)', color: 'var(--acc2)', padding: '6px 12px' }}
                    disabled={!selectedLead}
                    onClick={() => selectedLead && openModal('Edit Lead Disposition', <EditLeadModal lead={selectedLead} onDone={fetchLeads} />)}
                  >
                    ✎ VOC UPDATE
                  </button>
                  <button className={`btn sm ${!selectedLead ? 'dis' : ''}`} style={{ background: 'rgba(244,63,94,0.1)', border: '1px solid rgba(244,63,94,0.3)', color: 'var(--red)', padding: '6px 12px' }}
                    disabled={!selectedLead}
                    onClick={() => selectedLead && openModal(`Raise Settlement — ${selectedLead.name}`, <RaiseSettlementModal lead={selectedLead} onDone={fetchLeads} />, 600)}
                  >
                    ⚖️ Settlement
                  </button>
                </div>

                <div className="cust-dash-filters">
                  <select 
                    className="finp" 
                    style={{ fontSize: 11, padding: '4px 8px', width: 'auto', background: 'var(--bg3)', borderRadius: 16, border: '1px solid var(--bdr)' }} 
                    value={filterMonth} 
                    onChange={e => setFilterMonth(e.target.value)}
                  >
                    {Array.from({ length: 12 }).map((_, i) => <option key={i + 1} value={i + 1}>{new Date(2000, i, 1).toLocaleString('default', { month: 'short' })}</option>)}
                  </select>
                  <select 
                    className="finp" 
                    style={{ fontSize: 11, padding: '4px 8px', width: 'auto', background: 'var(--bg3)', borderRadius: 16, border: '1px solid var(--bdr)' }} 
                    value={filterYear} 
                    onChange={e => setFilterYear(e.target.value)}
                  >
                    {[0, 1, 2, 3, 4].map(y => {
                      const yr = new Date().getFullYear() - y;
                      return <option key={yr} value={yr}>{yr}</option>
                    })}
                  </select>
                </div>
              </div>
            </div>

            {/* LOWER SIDE: Grid Info Boxes */}
            {loading ? (
              <div className="cust-dash-grid">
                {Array.from({ length: 8 }).map((_, i) => (
                  <div key={i} className="cust-dash-grid-item">
                    <div className="skel" style={{ width: '60%', height: 8, marginBottom: 2 }} />
                    <div className="skel" style={{ width: '80%', height: 11 }} />
                  </div>
                ))}
              </div>
            ) : selectedLead ? (
              <div className="cust-dash-grid">
                {(profileCols.length > 0 ? profileCols : [
                  { label: 'ACCOUNT NUMBER', key: 'account_no' },
                  { label: 'MOBILE NUMBER', key: 'mobile' },
                  { label: 'OUTSTANDING', key: 'outstanding', type: 'amount' },
                  { label: 'STATUS', key: 'status' }
                ]).map((item: any, i: number) => {
                  const lowerKey = item.key?.toLowerCase();
                  const rawVal = selectedLead[item.key] ?? selectedLead[lowerKey]
                    ?? selectedLead.metadata?.[item.key] ?? selectedLead.metadata?.[lowerKey]
                    ?? selectedLead.metadata?.[item.label] ?? selectedLead.metadata?.[item.label?.toUpperCase()] ?? '—';
                  const val = (rawVal && typeof rawVal === 'object') ? (rawVal.name || rawVal.label || '—') : rawVal;
                  
                  const isMobile = lowerKey === 'mobile' || lowerKey === 'mobile_number' || lowerKey === 'mobile_no';
                  const altMobile = selectedLead.alt_mobile || selectedLead.metadata?.alt_mobile || selectedLead.metadata?.ALT_MOBILE || selectedLead.metadata?.['ALT MOBILE'];
                  
                  return (
                    <div key={i} className="cust-dash-grid-item" style={{ position: 'relative', overflow: 'visible' }}>
                      <div className="item-lbl" title={item.label} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <span>{item.label}</span>
                        {isMobile && altMobile && altMobile !== '—' && altMobile !== val && (
                          <div className="num-dropdown" style={{ position: 'relative', cursor: 'pointer', padding: '0 2px' }}>
                            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" style={{ width: 10, height: 10, color: 'var(--acc2)' }}><polyline points="6 9 12 15 18 9"></polyline></svg>
                            <div className="num-dropdown-list" style={{ position: 'absolute', top: '100%', right: 0, marginTop: 4, background: 'var(--bg2)', border: '1px solid var(--bdr)', borderRadius: 6, boxShadow: '0 4px 12px rgba(0,0,0,0.1)', zIndex: 100, minWidth: 150, padding: '4px 0' }}>
                              <div style={{ padding: '6px 12px', fontSize: 11, color: 'var(--txt)', borderBottom: '1px solid var(--faint)' }}>{val} <span style={{ color: 'var(--txt3)', fontSize: 9 }}>(Primary)</span></div>
                              <div style={{ padding: '6px 12px', fontSize: 11, color: 'var(--txt)' }}>{altMobile} <span style={{ color: 'var(--txt3)', fontSize: 9 }}>(Alternate)</span></div>
                            </div>
                          </div>
                        )}
                      </div>
                      <div className={`item-val ${item.type === 'amount' ? 'amt' : ''}`} title={String(val)}>
                        {item.type === 'amount' ? `₹${Number(val).toLocaleString('en-IN')}` : String(val)}
                      </div>
                    </div>
                  );
                })}

                {/* Settlement Status Box */}
                <div className="cust-dash-grid-item" style={{ border: '1px solid rgba(244,63,94,0.2)', background: 'rgba(244,63,94,0.03)', gridColumn: 'span 2', minWidth: 280 }}>
                  <div className="item-lbl" style={{ color: 'var(--red)', fontWeight: 700 }}>SETTLEMENT STATUS</div>
                  <div className="item-val" style={{ display: 'flex', alignItems: 'center', gap: 6, minHeight: 32 }}>
                    {!latestSettlement ? (
                      <span style={{ color: 'var(--txt3)', fontSize: 12, fontWeight: 600, opacity: 0.6 }}>No Request Raised</span>
                    ) : (
                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', width: '100%' }}>
                        <span style={{ 
                          color: latestSettlement.status === 'Approve' ? 'var(--grn)' : latestSettlement.status === 'Rejected' ? 'var(--red)' : 'var(--amb)',
                          fontWeight: 900,
                          fontSize: 12,
                          letterSpacing: 0.5
                        }}>
                          {latestSettlement.status === 'Approve' ? '✅ APPROVED' : 
                           latestSettlement.status === 'Rejected' ? '❌ REJECTED' : 
                           latestSettlement.status === 'Pending' ? '🔄 PENDING' : '⏳ RAISED'}
                        </span>
                        <button 
                          style={{ background: 'var(--bg2)', border: '1px solid var(--bdr)', borderRadius: 6, padding: '5px 12px', fontSize: 10, cursor: 'pointer', color: 'var(--txt)', fontWeight: 700, boxShadow: '0 1px 3px rgba(0,0,0,0.1)', transition: 'all 0.2s' }}
                          onClick={() => openModal(`⚖️ Settlement History — ${selectedLead.name}`, <SettlementHistoryModal lead={selectedLead} />, 600)}
                        >
                          View History
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            ) : null}
          </div>
        )}

        {/* SEARCH BAR */}
        <div className="sbar" style={{ padding: '8px 16px', borderBottom: '1px solid var(--bdr)', display: 'flex', gap: 8, alignItems: 'center' }}>
          <div className="sinp-wrap" style={{ flex: 1, maxWidth: 350, background: 'var(--bg2)', borderRadius: 20, border: '1px solid var(--bdr)' }}>
            <span style={{ padding: '0 10px', color: 'var(--txt3)', fontSize: 13 }}>⌕</span>
            <input
              className="sinp"
              style={{ background: 'transparent', border: 'none', padding: '6px 0', fontSize: 12 }}
              placeholder="Search by account, mobile, name, PAN..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
          <div style={{ display: 'flex', gap: 4 }}>
            {['All', 'Name', 'Mobile', 'Account', 'PAN'].map(t => (
              <div key={t} className={`stab ${filterTab === t.toLowerCase() ? 'on' : ''}`} onClick={() => setFilterTab(t.toLowerCase())} style={{ borderRadius: 16, padding: '2px 10px', fontSize: 11 }}>{t}</div>
            ))}
          </div>
          <SButton size="slim" variant="secondary" onClick={() => setShowFilters(!showFilters)}>⊞ More {showFilters ? '▲' : '▼'}</SButton>
          <span style={{ fontSize: 12, color: 'var(--txt3)', marginLeft: 'auto', display: 'flex', alignItems: 'center', gap: 10 }}>
            {leads.length} records
            <button
              onClick={() => setIsTableMaximized(!isTableMaximized)}
              style={{ background: 'transparent', border: 'none', cursor: 'pointer', color: 'var(--txt2)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '4px', borderRadius: 4, transition: '0.2s', backgroundColor: 'var(--bg3)' }}
              title={isTableMaximized ? "Restore Layout" : "Maximize Table"}
            >
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                {isTableMaximized ? (
                  <>
                    <polyline points="4 14 12 22 20 14"></polyline>
                    <line x1="12" y1="2" x2="12" y2="22"></line>
                  </>
                ) : (
                  <>
                    <polyline points="4 10 12 2 20 10"></polyline>
                    <line x1="12" y1="2" x2="12" y2="22"></line>
                  </>
                )}
              </svg>
            </button>
          </span>
        </div>

        {/* FILTER ROW */}
        {showFilters && (
          <div id="fRow" style={{ display: 'flex', padding: '10px 20px', background: 'var(--bg2)', borderBottom: '1px solid var(--bdr)', gap: 10, flexWrap: 'wrap', alignItems: 'center' }}>
            <select
              className="finp"
              style={{ fontSize: 12, padding: '6px 10px', width: 'auto' }}
              value={statusFilter}
              onChange={e => setStatusFilter(e.target.value)}
            >
              <option value="">All Status</option>
              {statusOptions.map(st => <option key={st} value={st}>{st}</option>)}
            </select>
            <input className="finp" type="number" placeholder="DPD Min" style={{ width: '90px', padding: '6px 10px' }} value={dpdMin} onChange={e => setDpdMin(e.target.value)} />
            <input className="finp" type="number" placeholder="DPD Max" style={{ width: '90px', padding: '6px 10px' }} value={dpdMax} onChange={e => setDpdMax(e.target.value)} />
            <input className="finp" type="number" placeholder="₹ Min" style={{ width: '100px', padding: '6px 10px' }} value={outMin} onChange={e => setOutMin(e.target.value)} />
            <select className="finp" style={{ fontSize: 12, padding: '6px 10px', width: 'auto' }} value={portfolioFilter} onChange={e => setPortfolioFilter(e.target.value)}>
              <option value="">All Portfolios</option>
              {portfolioOptions.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
            </select>
            <SButton size="slim" variant="critical" onClick={() => {
              setStatusFilter(''); setDpdMin(''); setDpdMax(''); setOutMin(''); setPortfolioFilter(''); setSearch(''); setFilterTab('all');
            }}>Clear Filters</SButton>
          </div>
        )}

        {/* RESULTS AREA */}
        <div className="result-area hide-scrollbar" style={{ flex: 1, overflow: 'auto', background: 'var(--bg2)' }}>
          <div className="result-area-mobile-scroll">
            <table className="tbl" style={{ width: '100%', borderCollapse: 'collapse', whiteSpace: 'nowrap' }}>
              <thead>
                <tr style={{ borderBottom: '1px solid var(--bdr)' }}>
                  {tableCols.length > 0 ? tableCols.map(col => (
                    <th key={col.key} style={{ background: 'var(--bg2)', position: 'sticky', top: 0, zIndex: 10, border: 'none', padding: '8px 10px', color: 'var(--txt3)', fontSize: 9, textTransform: 'uppercase', letterSpacing: 0.5, textAlign: 'left' }}>
                      {col.label}
                    </th>
                  )) : (
                    <>
                      <th style={{ background: 'var(--bg2)', position: 'sticky', top: 0, zIndex: 10, border: 'none', padding: '8px 10px', color: 'var(--txt3)', fontSize: 9, textTransform: 'uppercase', letterSpacing: 0.5 }}>Account Number</th>
                      <th style={{ background: 'var(--bg2)', position: 'sticky', top: 0, zIndex: 10, border: 'none', padding: '8px 10px', color: 'var(--txt3)', fontSize: 9, textTransform: 'uppercase', letterSpacing: 0.5 }}>Customer Name</th>
                      <th style={{ background: 'var(--bg2)', position: 'sticky', top: 0, zIndex: 10, border: 'none', padding: '8px 10px', color: 'var(--txt3)', fontSize: 9, textTransform: 'uppercase', letterSpacing: 0.5 }}>Mobile Number</th>
                      <th style={{ background: 'var(--bg2)', position: 'sticky', top: 0, zIndex: 10, border: 'none', padding: '8px 10px', color: 'var(--txt3)', fontSize: 9, textTransform: 'uppercase', letterSpacing: 0.5 }}>Outstanding</th>
                      <th style={{ background: 'var(--bg2)', position: 'sticky', top: 0, zIndex: 10, border: 'none', padding: '8px 10px', color: 'var(--txt3)', fontSize: 9, textTransform: 'uppercase', letterSpacing: 0.5 }}>Status</th>
                      <th style={{ background: 'var(--bg2)', position: 'sticky', top: 0, zIndex: 10, border: 'none', padding: '8px 10px', color: 'var(--txt3)', fontSize: 9, textTransform: 'uppercase', letterSpacing: 0.5 }}>Settlement</th>
                    </>
                  )}
                  <th style={{ background: 'var(--bg2)', position: 'sticky', top: 0, zIndex: 10, border: 'none', padding: '8px 10px', color: 'var(--txt3)', fontSize: 9, textTransform: 'uppercase', letterSpacing: 0.5 }}>Assigned To</th>
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  Array.from({ length: 15 }).map((_, i) => (
                    <tr key={i} style={{ borderBottom: '1px solid var(--faint)' }}>
                      {Array.from({ length: (tableCols.length || 6) + 1 }).map((_, j) => (
                        <td key={j} style={{ padding: '8px 10px' }}>
                          <div className="skel" style={{ width: `${Math.floor(Math.random() * 40) + 40}%` }} />
                        </td>
                      ))}
                    </tr>
                  ))
                ) : leads.map(lead => (
                  <tr key={lead.id} onClick={() => setSelectedLead(lead)} style={{ borderBottom: '1px solid var(--faint)', cursor: 'pointer', background: selectedLead?.id === lead.id ? 'var(--accbg)' : 'transparent' }}>
                    {tableCols.length > 0 ? tableCols.map(col => {
                      const lowerKey = col.key?.toLowerCase();
                      const rawVal = lead[col.key] ?? lead[lowerKey]
                        ?? lead.metadata?.[col.key] ?? lead.metadata?.[lowerKey]
                        ?? lead.metadata?.[col.label] ?? lead.metadata?.[col.label?.toUpperCase()] ?? '—';
                      const val = (rawVal && typeof rawVal === 'object') ? (rawVal.name || rawVal.label || '—') : rawVal;
                      return (
                        <td key={col.key} style={{ padding: '8px 10px', fontSize: 11, color: col.type === 'amount' ? 'var(--red)' : 'var(--txt2)' }}>
                          {col.type === 'amount' ? `₹${Number(val).toLocaleString('en-IN')}` :
                            col.type === 'badge' ? <span className="badge" style={{ background: 'var(--purbg)', color: 'var(--pur)', border: '1px solid var(--purbg)', borderRadius: 12, padding: '2px 8px' }}>{String(val)}</span> :
                              String(val)}
                        </td>
                      );
                    }) : (
                      <>
                        <td className="mn" style={{ padding: '8px 10px', color: 'var(--txt3)' }}>{lead.account_no}</td>
                        <td className="nm" style={{ padding: '8px 10px', color: 'var(--txt)' }}>{lead.name}</td>
                        <td className="mn" style={{ padding: '8px 10px', color: 'var(--txt2)' }}>{lead.mobile}</td>
                        <td className="mn" style={{ padding: '8px 10px', color: 'var(--red)', fontWeight: 600 }}>₹{lead.outstanding?.toLocaleString('en-IN')}</td>
                        <td><span className="badge">{lead.status}</span></td>
                        <td>
                           {lead.settlements && lead.settlements.length > 0 ? (
                             <span className="badge" style={{ 
                               background: 'transparent', 
                               border: `1px solid ${lead.settlements[0].status === 'Approve' ? 'rgba(34,197,94,0.3)' : lead.settlements[0].status === 'Rejected' ? 'rgba(239,68,68,0.3)' : 'rgba(245,158,11,0.3)'}`, 
                               color: lead.settlements[0].status === 'Approve' ? 'var(--grn)' : lead.settlements[0].status === 'Rejected' ? 'var(--red)' : 'var(--amb)',
                               fontSize: 9,
                               borderRadius: 12
                             }}>
                               {lead.settlements[0].status}
                             </span>
                           ) : (
                             <span style={{ color: 'var(--txt3)', fontSize: 9, opacity: 0.5 }}>—</span>
                           )}
                         </td>
                      </>
                    )}
                    <td style={{ padding: '8px 10px', fontSize: 11, color: 'var(--txt2)' }}>{lead.assignedAgent?.name || 'Unassigned'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* PAGER */}
        <div className="pager">
          <span style={{ fontSize: 11, color: 'var(--txt3)', flex: 1 }}>Page {page} of {Math.max(1, Math.ceil(totalCount / limit))} • {totalCount} records</span>
          <div style={{ display: 'flex', gap: 3 }}>
            <button className="p-btn" disabled={page <= 1} onClick={() => setPage(1)}>«</button>
            <button className="p-btn" disabled={page <= 1} onClick={() => setPage(Math.max(1, page - 1))}>‹</button>
            <button className="p-btn cur">{page}</button>
            <button className="p-btn" disabled={page >= Math.ceil(totalCount / limit)} onClick={() => setPage(page + 1)}>›</button>
            <button className="p-btn" disabled={page >= Math.ceil(totalCount / limit)} onClick={() => setPage(Math.ceil(totalCount / limit))}>»</button>
          </div>
          <select className="finp" style={{ fontSize: 10, padding: '3px 6px', width: 'auto', marginLeft: 10 }} value={limit} onChange={e => { setLimit(Number(e.target.value)); setPage(1); }}>
            <option value="25">25/page</option>
            <option value="50">50/page</option>
            <option value="100">100/page</option>
          </select>
        </div>
      </div>
    </div>
    </>
  );
};

export default Leads;
