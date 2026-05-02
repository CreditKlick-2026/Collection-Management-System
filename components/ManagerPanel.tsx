"use client";
import React, { useState, useEffect } from 'react';
import { useApp } from '@/context/AppContext';
import * as XLSX from 'xlsx';

// ─── Report type config ────────────────────────────────────────────────────
const REPORT_DEFS = [
  { key: 'payments',  label: 'Payment Report',   icon: '💳', color: '#22c55e', desc: 'All payments with status, mode, agent and customer details' },
  { key: 'ptps',      label: 'PTP Report',       icon: '🤝', color: '#f59e0b', desc: 'Promise to Pay records with dates and amounts' },
  { key: 'leads',     label: 'Leads / Allocation Report', icon: '📋', color: 'var(--acc2)', desc: 'Customer allocations with outstanding and agent info' },
  { key: 'call_logs', label: 'Call Log Report',  icon: '📞', color: 'var(--pur)', desc: 'VOC call records with disposition and PTP info' },
  { key: 'disputes',  label: 'Dispute Report',   icon: '⚖️', color: '#ef4444', desc: 'All dispute cases with status and resolution' },
];

// ─── Utility ────────────────────────────────────────────────────────────────
function downloadCSV(rows: any[], filename: string) {
  if (!rows.length) return;
  const headers = Object.keys(rows[0]);
  const csvContent = [
    headers.join(','),
    ...rows.map(r =>
      headers.map(h => {
        const v = String(r[h] ?? '').replace(/"/g, '""');
        return v.includes(',') || v.includes('"') || v.includes('\n') ? `"${v}"` : v;
      }).join(',')
    )
  ].join('\n');
  const blob = new Blob(['\uFEFF' + csvContent], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a'); a.href = url; a.download = filename; a.click();
  URL.revokeObjectURL(url);
}

function downloadExcel(rows: any[], filename: string) {
  if (!rows.length) return;
  const ws = XLSX.utils.json_to_sheet(rows);
  // Auto-width columns
  const colWidths = Object.keys(rows[0]).map(k => ({
    wch: Math.max(k.length, ...rows.slice(0, 50).map(r => String(r[k] ?? '').length), 10)
  }));
  ws['!cols'] = colWidths;
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, 'Report');
  XLSX.writeFile(wb, filename);
}

// ─── ReportsTab ────────────────────────────────────────────────────────────
const ReportsTab = () => {
  const { toast } = useApp();

  // Default: current month
  const today = new Date().toISOString().split('T')[0];
  const firstOfMonth = today.substring(0, 7) + '-01';

  const [from, setFrom] = useState(firstOfMonth);
  const [to, setTo] = useState(today);
  const [selectedType, setSelectedType] = useState('payments');
  const [rows, setRows] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [fetched, setFetched] = useState(false);

  const selectedDef = REPORT_DEFS.find(d => d.key === selectedType)!;

  const fetchReport = async () => {
    if (!from || !to) { toast('Please select date range'); return; }
    setLoading(true);
    setFetched(false);
    try {
      const res = await fetch(`/api/manager/reports?type=${selectedType}&from=${from}&to=${to}`);
      if (res.ok) {
        const data = await res.json();
        setRows(data.rows || []);
        setFetched(true);
        toast(`✓ ${data.count} records fetched`);
      } else {
        const err = await res.json();
        toast(err.message || 'Failed to fetch report');
      }
    } catch (e) { toast('Network error'); }
    setLoading(false);
  };

  const handleCSV = () => {
    if (!rows.length) { toast('No data to export'); return; }
    downloadCSV(rows, `${selectedType}_${from}_${to}.csv`);
    toast('CSV downloaded ✓');
  };

  const handleExcel = () => {
    if (!rows.length) { toast('No data to export'); return; }
    downloadExcel(rows, `${selectedType}_${from}_${to}.xlsx`);
    toast('Excel downloaded ✓');
  };

  const columns = rows.length > 0 ? Object.keys(rows[0]) : [];

  // Quick date presets
  const setPreset = (preset: string) => {
    const now = new Date();
    const fmt = (d: Date) => d.toISOString().split('T')[0];
    if (preset === 'today') { setFrom(fmt(now)); setTo(fmt(now)); }
    else if (preset === 'week') {
      const start = new Date(now); start.setDate(now.getDate() - 6);
      setFrom(fmt(start)); setTo(fmt(now));
    } else if (preset === 'month') {
      setFrom(now.getFullYear() + '-' + String(now.getMonth() + 1).padStart(2, '0') + '-01');
      setTo(fmt(now));
    } else if (preset === 'last_month') {
      const lm = new Date(now.getFullYear(), now.getMonth() - 1, 1);
      const lme = new Date(now.getFullYear(), now.getMonth(), 0);
      setFrom(fmt(lm)); setTo(fmt(lme));
    } else if (preset === 'quarter') {
      const qStart = new Date(now); qStart.setDate(now.getDate() - 89);
      setFrom(fmt(qStart)); setTo(fmt(now));
    }
  };

  return (
    <div>
      {/* Report Type Selector */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: 10, marginBottom: 20 }}>
        {REPORT_DEFS.map(d => (
          <div key={d.key}
            onClick={() => { setSelectedType(d.key); setRows([]); setFetched(false); }}
            style={{
              border: `1.5px solid ${selectedType === d.key ? d.color : 'var(--bdr)'}`,
              borderRadius: 10, padding: '12px 14px', cursor: 'pointer', transition: 'all 0.2s',
              background: selectedType === d.key ? `${d.color}10` : 'var(--bg2)',
            }}
          >
            <div style={{ fontSize: 22, marginBottom: 6 }}>{d.icon}</div>
            <div style={{ fontSize: 11, fontWeight: 700, color: selectedType === d.key ? d.color : 'var(--txt)', marginBottom: 3 }}>{d.label}</div>
            <div style={{ fontSize: 9, color: 'var(--txt3)', lineHeight: 1.4 }}>{d.desc}</div>
          </div>
        ))}
      </div>

      {/* Date Range + Controls */}
      <div style={{ background: 'var(--bg2)', border: '1px solid var(--bdr)', borderRadius: 12, padding: '16px 20px', marginBottom: 16 }}>
        <div style={{ fontSize: 12, fontWeight: 700, color: 'var(--txt)', marginBottom: 12 }}>📅 Date Range</div>

        {/* Quick presets */}
        <div style={{ display: 'flex', gap: 6, marginBottom: 12, flexWrap: 'wrap' }}>
          {[
            { key: 'today',      label: 'Today' },
            { key: 'week',       label: 'Last 7 Days' },
            { key: 'month',      label: 'This Month' },
            { key: 'last_month', label: 'Last Month' },
            { key: 'quarter',    label: 'Last 90 Days' },
          ].map(p => (
            <button key={p.key} onClick={() => setPreset(p.key)}
              style={{ padding: '4px 12px', borderRadius: 20, fontSize: 11, fontWeight: 600, border: '1px solid var(--bdr)', background: 'var(--bg3)', color: 'var(--txt2)', cursor: 'pointer' }}>
              {p.label}
            </button>
          ))}
        </div>

        <div style={{ display: 'flex', gap: 10, alignItems: 'flex-end', flexWrap: 'wrap' }}>
          <div className="ff" style={{ flex: '1 1 140px', margin: 0 }}>
            <label style={{ fontSize: 10, color: 'var(--txt3)', display: 'block', marginBottom: 4 }}>FROM DATE</label>
            <input className="finp" type="date" value={from} onChange={e => setFrom(e.target.value)} style={{ margin: 0 }} />
          </div>
          <div className="ff" style={{ flex: '1 1 140px', margin: 0 }}>
            <label style={{ fontSize: 10, color: 'var(--txt3)', display: 'block', marginBottom: 4 }}>TO DATE</label>
            <input className="finp" type="date" value={to} onChange={e => setTo(e.target.value)} style={{ margin: 0 }} />
          </div>
          <button
            onClick={fetchReport}
            disabled={loading}
            style={{ padding: '9px 22px', borderRadius: 8, background: 'var(--acc)', color: '#fff', border: 'none', fontWeight: 700, fontSize: 12, cursor: 'pointer', flexShrink: 0, opacity: loading ? 0.6 : 1 }}
          >
            {loading ? '⏳ Fetching...' : `⬇ Fetch ${selectedDef.icon}`}
          </button>

          {fetched && rows.length > 0 && (
            <>
              <button onClick={handleCSV}
                style={{ padding: '9px 18px', borderRadius: 8, background: 'rgba(34,197,94,0.1)', color: '#22c55e', border: '1px solid rgba(34,197,94,0.3)', fontWeight: 700, fontSize: 12, cursor: 'pointer', flexShrink: 0 }}>
                ⬇ CSV
              </button>
              <button onClick={handleExcel}
                style={{ padding: '9px 18px', borderRadius: 8, background: 'rgba(79,125,255,0.1)', color: 'var(--acc2)', border: '1px solid rgba(79,125,255,0.3)', fontWeight: 700, fontSize: 12, cursor: 'pointer', flexShrink: 0 }}>
                ⬇ Excel (.xlsx)
              </button>
            </>
          )}
        </div>
      </div>

      {/* Preview Table */}
      {fetched && (
        <div>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 }}>
            <div style={{ fontSize: 13, fontWeight: 700, color: 'var(--txt)' }}>
              {selectedDef.icon} {selectedDef.label}
              <span style={{ marginLeft: 10, fontSize: 11, color: 'var(--txt3)', fontWeight: 400 }}>
                {from} → {to} &nbsp;·&nbsp; {rows.length} records
              </span>
            </div>
            <div style={{ display: 'flex', gap: 8 }}>
              <button onClick={handleCSV} style={{ padding: '6px 14px', borderRadius: 7, background: 'rgba(34,197,94,0.1)', color: '#22c55e', border: '1px solid rgba(34,197,94,0.3)', fontWeight: 700, fontSize: 11, cursor: 'pointer' }}>
                ⬇ Download CSV
              </button>
              <button onClick={handleExcel} style={{ padding: '6px 14px', borderRadius: 7, background: 'rgba(79,125,255,0.1)', color: 'var(--acc2)', border: '1px solid rgba(79,125,255,0.3)', fontWeight: 700, fontSize: 11, cursor: 'pointer' }}>
                ⬇ Download Excel
              </button>
            </div>
          </div>

          {rows.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '50px 0', color: 'var(--txt3)' }}>
              <div style={{ fontSize: 36, marginBottom: 10, opacity: 0.3 }}>📭</div>
              <div style={{ fontWeight: 600 }}>No records in this date range</div>
            </div>
          ) : (
            <div style={{ border: '1px solid var(--bdr)', borderRadius: 10, overflow: 'hidden' }}>
              <div style={{ overflowX: 'auto', maxHeight: '55vh', overflowY: 'auto' }}>
                <table style={{ borderCollapse: 'collapse', width: '100%', minWidth: 800 }}>
                  <thead>
                    <tr style={{ background: 'var(--bg-top)', position: 'sticky', top: 0, zIndex: 2 }}>
                      {columns.map(col => (
                        <th key={col} style={{ padding: '10px 14px', fontSize: 9, fontWeight: 700, color: 'var(--txt3)', textTransform: 'uppercase', letterSpacing: 0.5, textAlign: 'left', borderBottom: '1px solid var(--bdr)', whiteSpace: 'nowrap' }}>
                          {col}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {rows.slice(0, 100).map((row, i) => (
                      <tr key={i} style={{ borderBottom: '1px solid var(--faint)', background: i % 2 === 0 ? 'var(--bg2)' : 'var(--bg3)' }}>
                        {columns.map(col => (
                          <td key={col} style={{ padding: '9px 14px', fontSize: 11, color: 'var(--txt2)', whiteSpace: 'nowrap', maxWidth: 200, overflow: 'hidden', textOverflow: 'ellipsis' }}>
                            {String(row[col] ?? '—')}
                          </td>
                        ))}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              {rows.length > 100 && (
                <div style={{ padding: '10px 14px', fontSize: 11, color: 'var(--txt3)', borderTop: '1px solid var(--bdr)', background: 'var(--bg-top)' }}>
                  ⚠ Preview shows first 100 rows. Full data is included in the downloaded file ({rows.length} total rows).
                </div>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
};


const ManagerPanel = () => {
  const { toast, user } = useApp();
  const [activeTab, setActiveTab] = useState('team');
  const [team, setTeam] = useState<any[]>([]);

  // Payments state
  const [payments, setPayments] = useState<any[]>([]);
  const [payLoading, setPayLoading] = useState(false);
  const [payFilter, setPayFilter] = useState({ date: '', agent: '', account: '', resolved: '' });
  const [resolvingId, setResolvingId] = useState<number | null>(null);
  const [payPage, setPayPage] = useState(1);
  const [payTotal, setPayTotal] = useState(0);
  const [payTotalPages, setPayTotalPages] = useState(1);
  const PAY_LIMIT = 25;

  useEffect(() => {
    fetchTeam();
  }, []);

  useEffect(() => {
    if (activeTab === 'payments') { setPayPage(1); fetchPayments(1); }
  }, [activeTab, payFilter]);

  useEffect(() => {
    if (activeTab === 'payments') fetchPayments(payPage);
  }, [payPage]);

  const fetchTeam = async () => {
    try {
      const res = await fetch('/api/admin/users');
      if (res.ok) {
        const data = await res.json();
        setTeam(data.filter((u: any) => u.role === 'agent' && u.active));
      }
    } catch (e) { console.error(e); }
  };

  const fetchPayments = async (pg = payPage) => {
    setPayLoading(true);
    try {
      const q = new URLSearchParams({ page: String(pg), limit: String(PAY_LIMIT) });
      if (payFilter.date)     q.append('date', payFilter.date);
      if (payFilter.agent)    q.append('agent', payFilter.agent);
      if (payFilter.account)  q.append('account', payFilter.account);
      if (payFilter.resolved) q.append('resolved', payFilter.resolved);
      const res = await fetch(`/api/manager/payments?${q.toString()}`);
      if (res.ok) {
        const json = await res.json();
        setPayments(json.data || []);
        setPayTotal(json.total || 0);
        setPayTotalPages(json.totalPages || 1);
      }
    } catch (e) { console.error(e); }
    setPayLoading(false);
  };

  const toggleResolve = async (payment: any) => {
    setResolvingId(payment.id);
    try {
      const res = await fetch('/api/manager/payments', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id: payment.id,
          resolve: !payment.resolved,
          managerId: user?.id,
        }),
      });
      if (res.ok) {
        toast(payment.resolved ? '🔓 Payment Unresolved — Agent can now edit' : '🔒 Payment Resolved & Locked');
        fetchPayments();
      } else {
        const err = await res.json();
        toast(err.message || 'Action failed');
      }
    } catch (e) {
      toast('Network error');
    }
    setResolvingId(null);
  };

  const reportAccess = ['call_summary', 'ptp_summary', 'payment_summary', 'team_performance', 'portfolio_aging', 'dispute_summary'];
  const labels: any = {
    call_summary: 'Call Summary', ptp_summary: 'PTP Summary', payment_summary: 'Payment Summary',
    team_performance: 'Team Performance', portfolio_aging: 'Portfolio Aging', dispute_summary: 'Dispute Summary'
  };

  const resolvedCount   = payments.filter(p =>  p.resolved).length;
  const unresolvedCount = payments.filter(p => !p.resolved).length;

  return (
    <div id="pg-manager" className="page on">
      <div className="ph">
        <div>
          <div className="ph-t">📊 Manager Panel</div>
          <div className="ph-s">Team management, payment control and reports</div>
        </div>
      </div>
      <div className="page-body">
        <div className="tabs">
          <div className={`tab ${activeTab === 'team' ? 'on' : ''}`}     onClick={() => setActiveTab('team')}>👥 Team</div>
          <div className={`tab ${activeTab === 'payments' ? 'on' : ''}`} onClick={() => setActiveTab('payments')}>🔒 Payments</div>
          <div className={`tab ${activeTab === 'upload' ? 'on' : ''}`}   onClick={() => setActiveTab('upload')}>↑ Upload</div>
          <div className={`tab ${activeTab === 'reports' ? 'on' : ''}`}  onClick={() => setActiveTab('reports')}>📊 Reports</div>
        </div>

        {/* ── Team Tab ── */}
        {activeTab === 'team' && (
          <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
            <div style={{ overflowX: 'auto' }}>
              <table className="tbl">
                <thead>
                  <tr>
                    <th>Agent</th><th>Emp ID</th><th>Portfolio</th><th>Assigned</th><th>Status</th>
                  </tr>
                </thead>
                <tbody>
                  {team.map(a => (
                    <tr key={a.id}>
                      <td>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 7 }}>
                          <div style={{ width: 26, height: 26, borderRadius: '50%', background: 'var(--accbg)', color: 'var(--acc2)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 9, fontWeight: 700 }}>{a.initials}</div>
                          <span className="nm">{a.name}</span>
                        </div>
                      </td>
                      <td className="mn">{a.empId}</td>
                      <td style={{ fontSize: 11, color: 'var(--pur)' }}>{a.portfolios}</td>
                      <td className="mn" style={{ color: 'var(--acc2)' }}>{a.assigned_count}</td>
                      <td><span className="badge grn">Active</span></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* ── Payments Resolve/Unresolve Tab ── */}
        {activeTab === 'payments' && (
          <div>
            {/* KPI Row */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 10, marginBottom: 14 }}>
              {[
                { label: 'Total Cleared', val: payTotal,        color: 'var(--acc2)', bg: 'rgba(79,125,255,0.06)', icon: '💳' },
                { label: 'Resolved 🔒',   val: resolvedCount,   color: '#22c55e',     bg: 'rgba(34,197,94,0.06)',  icon: '🔒' },
                { label: 'Unresolved 🔓', val: unresolvedCount, color: '#f59e0b',     bg: 'rgba(245,158,11,0.06)', icon: '🔓' },
              ].map(k => (
                <div key={k.label} style={{ background: k.bg, border: `1px solid ${k.color}20`, borderRadius: 8, padding: '10px 14px', display: 'flex', alignItems: 'center', gap: 10 }}>
                  <div style={{ fontSize: 18 }}>{k.icon}</div>
                  <div>
                    <div style={{ fontSize: 18, fontWeight: 800, color: k.color, lineHeight: 1 }}>{k.val}</div>
                    <div style={{ fontSize: 9, color: 'var(--txt3)', textTransform: 'uppercase', letterSpacing: 0.5, marginTop: 2 }}>{k.label}</div>
                  </div>
                </div>
              ))}
            </div>

            {/* Info Banner */}
            <div style={{ background: 'rgba(79,125,255,0.06)', border: '1px solid rgba(79,125,255,0.2)', borderRadius: 8, padding: '10px 16px', marginBottom: 16, fontSize: 12, color: 'var(--acc2)', display: 'flex', alignItems: 'center', gap: 8 }}>
              <span style={{ fontSize: 16 }}>ℹ️</span>
              <span><b>Resolve</b> locks a cleared payment — agents cannot modify it. <b>Unresolve</b> unlocks it for editing.</span>
            </div>

            {/* Filters */}
            <div style={{ display: 'flex', gap: 8, marginBottom: 16, flexWrap: 'wrap', alignItems: 'center' }}>
              <input className="finp" type="date" style={{ width: 'auto' }} value={payFilter.date}
                onChange={e => setPayFilter({ ...payFilter, date: e.target.value })} />
              <input className="finp" placeholder="Agent name..." style={{ width: 150 }} value={payFilter.agent}
                onChange={e => setPayFilter({ ...payFilter, agent: e.target.value })} />
              <input className="finp" placeholder="Account / Customer..." style={{ width: 180 }} value={payFilter.account}
                onChange={e => setPayFilter({ ...payFilter, account: e.target.value })} />
              <select className="finp" style={{ width: 'auto' }} value={payFilter.resolved}
                onChange={e => setPayFilter({ ...payFilter, resolved: e.target.value })}>
                <option value="">All</option>
                <option value="false">🔓 Unresolved</option>
                <option value="true">🔒 Resolved</option>
              </select>
              <button className="btn" style={{ background: 'var(--redbg)', color: 'var(--red)', border: '1px solid rgba(226,75,74,0.3)' }}
                onClick={() => setPayFilter({ date: '', agent: '', account: '', resolved: '' })}>Clear</button>
              <div style={{ marginLeft: 'auto', fontSize: 11, color: 'var(--txt3)' }}>{payTotal} records</div>
            </div>

            {/* Table */}
            <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
              <div style={{ overflowX: 'auto' }}>
                <table className="tbl" style={{ borderCollapse: 'collapse', width: '100%' }}>
                  <thead>
                    <tr style={{ background: 'rgba(255,255,255,0.02)', borderBottom: '1px solid var(--bdr)' }}>
                      <th style={{ padding: '12px 16px', fontSize: 10, textTransform: 'uppercase', letterSpacing: 1, textAlign: 'left', color: 'var(--txt3)' }}>Date</th>
                      <th style={{ padding: '12px 16px', fontSize: 10, textTransform: 'uppercase', letterSpacing: 1, textAlign: 'left', color: 'var(--txt3)' }}>Customer</th>
                      <th style={{ padding: '12px 16px', fontSize: 10, textTransform: 'uppercase', letterSpacing: 1, textAlign: 'left', color: 'var(--txt3)' }}>Amount</th>
                      <th style={{ padding: '12px 16px', fontSize: 10, textTransform: 'uppercase', letterSpacing: 1, textAlign: 'left', color: 'var(--txt3)' }}>Mode</th>
                      <th style={{ padding: '12px 16px', fontSize: 10, textTransform: 'uppercase', letterSpacing: 1, textAlign: 'left', color: 'var(--txt3)' }}>Agent</th>
                      <th style={{ padding: '12px 16px', fontSize: 10, textTransform: 'uppercase', letterSpacing: 1, textAlign: 'left', color: 'var(--txt3)' }}>Ref</th>
                      <th style={{ padding: '12px 16px', fontSize: 10, textTransform: 'uppercase', letterSpacing: 1, textAlign: 'center', color: 'var(--txt3)' }}>Status</th>
                      <th style={{ padding: '12px 16px', fontSize: 10, textTransform: 'uppercase', letterSpacing: 1, textAlign: 'right', color: 'var(--txt3)' }}>Action</th>
                    </tr>
                  </thead>
                  <tbody>
                    {payLoading ? (
                      Array.from({ length: 5 }).map((_, i) => (
                        <tr key={i}><td colSpan={8} style={{ padding: '14px 16px' }}><div className="skel" style={{ width: '100%', height: 18 }} /></td></tr>
                      ))
                    ) : payments.length === 0 ? (
                      <tr><td colSpan={8} style={{ textAlign: 'center', padding: 60, color: 'var(--txt3)' }}>
                        <div style={{ fontSize: 36, marginBottom: 12, opacity: 0.2 }}>💳</div>
                        <div style={{ fontSize: 14, fontWeight: 600 }}>No cleared payments found</div>
                        <div style={{ fontSize: 12, opacity: 0.6 }}>Adjust your filters to see results.</div>
                      </td></tr>
                    ) : payments.map(p => (
                      <tr key={p.id} className="tr-h" style={{ borderBottom: '1px solid rgba(255,255,255,0.03)', background: p.resolved ? 'rgba(34,197,94,0.025)' : 'transparent', transition: 'background 0.15s' }}>
                        <td style={{ padding: '7px 12px', fontSize: 11, color: 'var(--txt3)', whiteSpace: 'nowrap' }}>{p.date}</td>
                        <td style={{ padding: '7px 12px' }}>
                          <div style={{ fontSize: 12, fontWeight: 600, color: 'var(--txt)', lineHeight: 1.2 }}>{p.customer?.name}</div>
                          <div style={{ fontSize: 9, color: 'var(--txt3)', fontFamily: 'monospace' }}>{p.customer?.account_no}</div>
                        </td>
                        <td style={{ padding: '7px 12px', color: '#22c55e', fontWeight: 700, fontSize: 12, whiteSpace: 'nowrap' }}>₹{p.amount?.toLocaleString('en-IN')}</td>
                        <td style={{ padding: '7px 12px' }}>
                          <span style={{ padding: '2px 6px', borderRadius: 4, fontSize: 9, fontWeight: 700, background: 'rgba(79,125,255,0.1)', color: 'var(--acc2)', textTransform: 'uppercase' }}>{p.mode}</span>
                        </td>
                        <td style={{ padding: '7px 12px', fontSize: 11, color: 'var(--txt2)' }}>{p.agent?.name}</td>
                        <td style={{ padding: '7px 12px', fontSize: 9, color: 'var(--txt3)', fontFamily: 'monospace' }}>{p.ref || '—'}</td>
                        <td style={{ padding: '7px 12px', textAlign: 'center' }}>
                          {p.resolved
                            ? <span style={{ display: 'inline-flex', alignItems: 'center', gap: 3, background: 'rgba(34,197,94,0.1)', color: '#22c55e', border: '1px solid rgba(34,197,94,0.25)', padding: '2px 7px', borderRadius: 8, fontSize: 9, fontWeight: 700 }}>🔒 Resolved</span>
                            : <span style={{ display: 'inline-flex', alignItems: 'center', gap: 3, background: 'rgba(245,158,11,0.1)', color: '#f59e0b', border: '1px solid rgba(245,158,11,0.25)', padding: '2px 7px', borderRadius: 8, fontSize: 9, fontWeight: 700 }}>🔓 Open</span>
                          }
                        </td>
                        <td style={{ padding: '7px 12px', textAlign: 'right' }}>
                          <button
                            onClick={() => toggleResolve(p)}
                            disabled={resolvingId === p.id}
                            style={{
                              padding: '4px 10px', borderRadius: 6, fontSize: 10, fontWeight: 700, cursor: 'pointer', border: 'none', transition: 'all 0.15s',
                              background: p.resolved ? 'rgba(245,158,11,0.15)' : 'rgba(34,197,94,0.15)',
                              color: p.resolved ? '#f59e0b' : '#22c55e',
                              opacity: resolvingId === p.id ? 0.5 : 1,
                              whiteSpace: 'nowrap',
                            }}
                          >
                            {resolvingId === p.id ? '...' : p.resolved ? '🔓 Unresolve' : '🔒 Resolve'}
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              {/* Pagination Bar */}
              {payTotalPages > 1 && (
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '8px 14px', borderTop: '1px solid var(--bdr)', background: 'var(--bg3)' }}>
                  <div style={{ fontSize: 11, color: 'var(--txt3)' }}>
                    Showing {((payPage - 1) * PAY_LIMIT) + 1}–{Math.min(payPage * PAY_LIMIT, payTotal)} of {payTotal}
                  </div>
                  <div style={{ display: 'flex', gap: 4, alignItems: 'center' }}>
                    <button onClick={() => setPayPage(1)} disabled={payPage === 1}
                      style={{ padding: '3px 8px', borderRadius: 5, border: '1px solid var(--bdr)', background: 'var(--bg2)', color: 'var(--txt3)', cursor: payPage === 1 ? 'not-allowed' : 'pointer', fontSize: 11, opacity: payPage === 1 ? 0.4 : 1 }}>«</button>
                    <button onClick={() => setPayPage(p => Math.max(1, p - 1))} disabled={payPage === 1}
                      style={{ padding: '3px 8px', borderRadius: 5, border: '1px solid var(--bdr)', background: 'var(--bg2)', color: 'var(--txt3)', cursor: payPage === 1 ? 'not-allowed' : 'pointer', fontSize: 11, opacity: payPage === 1 ? 0.4 : 1 }}>‹ Prev</button>
                    {Array.from({ length: Math.min(5, payTotalPages) }, (_, i) => {
                      const pg = Math.max(1, Math.min(payTotalPages - 4, payPage - 2)) + i;
                      return (
                        <button key={pg} onClick={() => setPayPage(pg)}
                          style={{ padding: '3px 9px', borderRadius: 5, border: `1px solid ${pg === payPage ? 'var(--acc2)' : 'var(--bdr)'}`, background: pg === payPage ? 'var(--acc2)' : 'var(--bg2)', color: pg === payPage ? '#fff' : 'var(--txt3)', cursor: 'pointer', fontSize: 11, fontWeight: pg === payPage ? 700 : 400 }}>{pg}</button>
                      );
                    })}
                    <button onClick={() => setPayPage(p => Math.min(payTotalPages, p + 1))} disabled={payPage === payTotalPages}
                      style={{ padding: '3px 8px', borderRadius: 5, border: '1px solid var(--bdr)', background: 'var(--bg2)', color: 'var(--txt3)', cursor: payPage === payTotalPages ? 'not-allowed' : 'pointer', fontSize: 11, opacity: payPage === payTotalPages ? 0.4 : 1 }}>Next ›</button>
                    <button onClick={() => setPayPage(payTotalPages)} disabled={payPage === payTotalPages}
                      style={{ padding: '3px 8px', borderRadius: 5, border: '1px solid var(--bdr)', background: 'var(--bg2)', color: 'var(--txt3)', cursor: payPage === payTotalPages ? 'not-allowed' : 'pointer', fontSize: 11, opacity: payPage === payTotalPages ? 0.4 : 1 }}>»</button>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}

        {/* ── Upload Tab ── */}
        {activeTab === 'upload' && (
          <div>
            <div className="info-box blue">Upload customer allocations.</div>
            <label style={{ border: '2px dashed var(--bdr2)', borderRadius: 9, padding: 20, textAlign: 'center', cursor: 'pointer', display: 'block', color: 'var(--txt3)', marginBottom: 12 }}>
              <input type="file" style={{ display: 'none' }} onChange={(e) => toast(`File: ${e.target.files?.[0]?.name}`)} />
              <div style={{ fontSize: 22, marginBottom: 6 }}>↑</div>
              <div style={{ fontSize: 12, fontWeight: 600, color: 'var(--txt2)' }}>Click to select .CSV or .XLSX</div>
            </label>
            <div style={{ display: 'flex', gap: 8 }}>
              <button className="btn pr" onClick={() => toast('Upload started...')}>↑ Upload</button>
              <button className="btn gn" onClick={() => toast('Sample downloaded ✓')}>↓ Sample</button>
            </div>
          </div>
        )}

        {/* ── Reports Tab ── */}
        {activeTab === 'reports' && (
          <ReportsTab />
        )}
      </div>
    </div>
  );
};

export default ManagerPanel;
