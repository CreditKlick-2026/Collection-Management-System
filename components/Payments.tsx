"use client";
import React, { useState, useEffect, useCallback } from 'react';
import { useApp } from '@/context/AppContext';
import SButton from './SButton';

const DEFAULT_MODES = ['Cash', 'NEFT', 'IMPS', 'UPI', 'Cheque', 'DD'];

// ─── Status config ─────────────────────────────────────────────────────────
const STATUS_CFG: Record<string, { label: string; color: string; bg: string; border: string; icon: string }> = {
  cleared:          { label: 'Cleared',          color: '#22c55e', bg: 'rgba(34,197,94,0.1)',   border: 'rgba(34,197,94,0.3)',   icon: '✓' },
  pending_approval: { label: 'Pending Approval', color: '#f59e0b', bg: 'rgba(245,158,11,0.1)',  border: 'rgba(245,158,11,0.3)',  icon: '⏳' },
  rejected:         { label: 'Rejected',         color: '#ef4444', bg: 'rgba(239,68,68,0.1)',   border: 'rgba(239,68,68,0.3)',   icon: '✕' },
};

const getStatusBadge = (payment: any) => {
  const s = payment.status || 'pending_approval';
  const cfg = STATUS_CFG[s] || { label: s, color: 'var(--txt3)', bg: 'var(--faint)', border: 'var(--bdr)', icon: '?' };
  // If cleared but also has resolved flag, show lock
  const extra = payment.resolved ? ' 🔒' : '';
  return (
    <span style={{
      display: 'inline-flex', alignItems: 'center', gap: 4,
      background: cfg.bg, color: cfg.color, border: `1px solid ${cfg.border}`,
      padding: '3px 9px', borderRadius: 10, fontSize: 10, fontWeight: 700, whiteSpace: 'nowrap'
    }}>
      {cfg.icon} {cfg.label}{extra}
    </span>
  );
};

// ─── Record Payment Form ────────────────────────────────────────────────────
const RecordPaymentForm = ({ modes, onSuccess }: { modes: string[], onSuccess: () => void }) => {
  const { toast, closeModal, user } = useApp();
  const [form, setForm] = useState({ customerId: '', amount: '', mode: 'Cash', ref: '', date: new Date().toISOString().split('T')[0], remarks: '' });
  const [saving, setSaving] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [suggestions, setSuggestions] = useState<any[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const suggestionRef = React.useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (suggestionRef.current && !suggestionRef.current.contains(event.target as Node)) setShowSuggestions(false);
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  useEffect(() => {
    if (searchQuery.length < 2) { setSuggestions([]); return; }
    const timer = setTimeout(async () => {
      setIsSearching(true);
      try {
        const res = await fetch(`/api/leads?q=${searchQuery}&searchType=account`);
        if (res.ok) setSuggestions(await res.json());
      } catch (e) { console.error(e); }
      setIsSearching(false);
    }, 300);
    return () => clearTimeout(timer);
  }, [searchQuery]);

  const selectCustomer = (c: any) => {
    setForm({ ...form, customerId: c.id });
    setSearchQuery(`${c.name} (${c.account_no})`);
    setShowSuggestions(false);
  };

  const handleSubmit = async () => {
    if (!form.customerId || !form.amount) { toast('Customer and amount are required'); return; }
    if (!user?.id) { toast('You must be logged in'); return; }
    setSaving(true);
    try {
      const res = await fetch('/api/payments', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...form, amount: parseFloat(form.amount), agentId: user.id })
      });
      if (res.ok) { toast('Payment recorded — pending manager approval ✓'); closeModal(); onSuccess(); }
      else { const err = await res.json(); toast(err.message || 'Failed to record payment'); }
    } catch (e) { toast('Network error'); }
    setSaving(false);
  };

  return (
    <div style={{ padding: '16px 20px 20px' }}>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 14 }}>
        <div className="ff" style={{ gridColumn: '1/-1', position: 'relative' }} ref={suggestionRef}>
          <label>Customer Account *</label>
          <div style={{ position: 'relative' }}>
            <input className="finp" placeholder="Search by Name or Account #..." value={searchQuery}
              onChange={e => { setSearchQuery(e.target.value); setShowSuggestions(true); if (form.customerId) setForm({ ...form, customerId: '' }); }}
              onFocus={() => searchQuery.length >= 2 && setShowSuggestions(true)} />
            {isSearching && <div style={{ position: 'absolute', right: 10, top: '50%', transform: 'translateY(-50%)', fontSize: 10, color: 'var(--txt3)' }}>Searching...</div>}
          </div>
          {showSuggestions && suggestions.length > 0 && (
            <div style={{ position: 'absolute', top: '100%', left: 0, right: 0, zIndex: 100, background: 'var(--bg2)', border: '1px solid var(--bdr)', borderRadius: 8, marginTop: 4, boxShadow: '0 10px 25px rgba(0,0,0,0.3)', maxHeight: 200, overflowY: 'auto' }}>
              {suggestions.map(c => (
                <div key={c.id} style={{ padding: '10px 12px', cursor: 'pointer', borderBottom: '1px solid var(--faint)', transition: 'background 0.2s' }}
                  onClick={() => selectCustomer(c)} onMouseOver={e => e.currentTarget.style.background = 'var(--bg3)'} onMouseOut={e => e.currentTarget.style.background = 'transparent'}>
                  <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--txt)' }}>{c.name}</div>
                  <div style={{ fontSize: 11, color: 'var(--txt3)' }}>{c.account_no} · {c.mobile}</div>
                </div>
              ))}
            </div>
          )}
          {showSuggestions && searchQuery.length >= 2 && !isSearching && suggestions.length === 0 && (
            <div style={{ position: 'absolute', top: '100%', left: 0, right: 0, zIndex: 100, background: 'var(--bg2)', border: '1px solid var(--bdr)', borderRadius: 8, marginTop: 4, padding: '12px', fontSize: 12, color: 'var(--txt3)', textAlign: 'center' }}>No customers found</div>
          )}
        </div>
        <div className="ff"><label>Amount (₹) *</label><input className="finp" type="number" placeholder="0.00" value={form.amount} onChange={e => setForm({ ...form, amount: e.target.value })} /></div>
        <div className="ff"><label>Payment Mode</label>
          <select className="finp" value={form.mode} onChange={e => setForm({ ...form, mode: e.target.value })}>
            {modes.map(m => <option key={m} value={m}>{m}</option>)}
          </select>
        </div>
        <div className="ff"><label>Reference Number</label><input className="finp" placeholder="UTR / Cheque No." value={form.ref} onChange={e => setForm({ ...form, ref: e.target.value })} /></div>
        <div className="ff"><label>Payment Date</label><input className="finp" type="date" value={form.date} onChange={e => setForm({ ...form, date: e.target.value })} /></div>
        <div className="ff" style={{ gridColumn: '1/-1' }}><label>Remarks</label><textarea className="finp" rows={2} style={{ resize: 'vertical' }} value={form.remarks} onChange={e => setForm({ ...form, remarks: e.target.value })} /></div>
      </div>
      <div style={{ display: 'flex', gap: 10 }}>
        <SButton variant="primary" style={{ flex: 2 }} onClick={handleSubmit} loading={saving}>Record Payment</SButton>
        <SButton variant="secondary" style={{ flex: 1 }} onClick={closeModal}>Cancel</SButton>
      </div>
    </div>
  );
};

// ─── Payment Detail Modal ───────────────────────────────────────────────────
const PaymentDetailModal = ({ payment, onClose, onRefresh }: { payment: any, onClose: () => void, onRefresh: () => void }) => {
  const { toast } = useApp();
  const [remarks, setRemarks] = useState(payment?.remarks || '');
  const [saving, setSaving] = useState(false);

  const saveRemarks = async () => {
    if (payment.resolved) { toast('🔒 This payment is locked by manager'); return; }
    setSaving(true);
    try {
      const res = await fetch('/api/payments', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: payment.id, remarks, status: payment.status, flag: payment.flag })
      });
      if (res.ok) { toast('Remarks saved ✓'); onRefresh(); onClose(); }
      else {
        const err = await res.json();
        toast(err.message?.startsWith('LOCKED') ? '🔒 Locked by manager — cannot modify' : 'Failed to save');
      }
    } catch (e) { toast('Network error'); }
    setSaving(false);
  };

  const s = payment.status || 'pending_approval';
  const cfg = STATUS_CFG[s] || { label: s, color: 'var(--txt3)', bg: 'var(--faint)', border: 'var(--bdr)', icon: '?' };

  return (
    <div style={{ padding: '16px 20px 20px' }}>
      {/* Status Banner */}
      <div style={{ background: cfg.bg, border: `1px solid ${cfg.border}`, borderRadius: 8, padding: '10px 14px', marginBottom: 14, display: 'flex', alignItems: 'center', gap: 10 }}>
        <span style={{ fontSize: 20 }}>{cfg.icon}</span>
        <div>
          <div style={{ fontSize: 13, fontWeight: 700, color: cfg.color }}>{cfg.label}</div>
          {payment.resolved && <div style={{ fontSize: 10, color: 'var(--txt3)' }}>🔒 Locked by manager — editing disabled</div>}
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, marginBottom: 12 }}>
        <div className="ff"><label>Customer</label><input className="finp" value={payment.customer?.name || '—'} readOnly /></div>
        <div className="ff"><label>Account #</label><input className="finp" value={payment.customer?.account_no || '—'} readOnly /></div>
        <div className="ff"><label>Amount</label><input className="finp" value={`₹${payment.amount?.toLocaleString('en-IN')}`} readOnly style={{ color: '#22c55e', fontWeight: 700 }} /></div>
        <div className="ff"><label>Mode</label><input className="finp" value={payment.mode} readOnly /></div>
        <div className="ff"><label>Reference #</label><input className="finp" value={payment.ref || '—'} readOnly /></div>
        <div className="ff"><label>Date</label><input className="finp" value={payment.date} readOnly /></div>
        <div className="ff"><label>Agent</label><input className="finp" value={payment.agent?.name || '—'} readOnly /></div>
        <div className="ff"><label>Status (Backend)</label><input className="finp" value={s} readOnly style={{ color: cfg.color, fontWeight: 600, textTransform: 'capitalize' }} /></div>
      </div>

      {payment.rejectionReason && (
        <div className="info-box red" style={{ marginBottom: 10, fontSize: 11 }}>✕ <b>Rejected:</b> {payment.rejectionReason}</div>
      )}
      {payment.flag === 'flagged' && payment.flagComment && (
        <div className="info-box amb" style={{ marginBottom: 10, fontSize: 11 }}>⚑ <b>Flagged:</b> {payment.flagComment}</div>
      )}

      <div className="ff" style={{ marginBottom: 14 }}>
        <label>VOC / Remarks</label>
        <textarea className="finp" rows={2} style={{ resize: 'vertical', opacity: payment.resolved ? 0.6 : 1 }} value={remarks} onChange={e => setRemarks(e.target.value)} readOnly={payment.resolved} />
      </div>
      <div style={{ display: 'flex', gap: 8 }}>
        <button className="btn pr" style={{ flex: 1, padding: 9, opacity: payment.resolved ? 0.5 : 1 }} onClick={saveRemarks} disabled={saving || payment.resolved}>
          {saving ? 'Saving...' : payment.resolved ? '🔒 Locked' : '✓ Save Remarks'}
        </button>
        <button className="btn dn" style={{ padding: '9px 16px' }} onClick={onClose}>Close</button>
      </div>
    </div>
  );
};

// ─── Main Payments Component ────────────────────────────────────────────────
const STATUS_TABS = [
  { key: 'all',              label: 'All',      icon: '◈' },
  { key: 'cleared',         label: 'Cleared',  icon: '✓' },
  { key: 'pending_approval',label: 'Pending',  icon: '⏳' },
  { key: 'rejected',        label: 'Rejected', icon: '✕' },
];

const Payments = () => {
  const { openModal, closeModal } = useApp();
  const [payments, setPayments] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState({ date: '', agent: '', account: '', mode: '' });
  const [activeTab, setActiveTab] = useState('all');
  const [masterModes, setMasterModes] = useState<string[]>(DEFAULT_MODES);
  const [stats, setStats] = useState({ cleared: 0, pending: 0, rejected: 0, total: 0, totalAmount: 0, clearedAmount: 0 });
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalRecords, setTotalRecords] = useState(0);
  const LIMIT = 25;

  const fetchModes = async () => {
    try {
      const res = await fetch('/api/admin/master-lists');
      if (res.ok) {
        const data = await res.json();
        const customModes = data.filter((l: any) => l.type === 'payment-mode').map((l: any) => l.value);
        setMasterModes(Array.from(new Set([...DEFAULT_MODES, ...customModes])));
      }
    } catch (e) { console.error(e); }
  };

  const fetchPayments = useCallback(async (pg = page) => {
    setLoading(true);
    try {
      const q = new URLSearchParams({
        status: activeTab === 'all' ? 'all' : activeTab,
        date: filters.date,
        mode: filters.mode,
        agent: filters.agent,
        account: filters.account,
        page: String(pg),
        limit: String(LIMIT)
      });
      const res = await fetch(`/api/payments?${q.toString()}`);
      if (res.ok) {
        const json = await res.json();
        const dataArray = Array.isArray(json) ? json : (json.data || []);
        const total = json.total || dataArray.length;
        
        setPayments(dataArray);
        setTotalRecords(total);
        setTotalPages(json.totalPages || 1);

        // Compute stats from the data (Note: stats are now only for the current page if filtered, 
        // but for 'all' we usually want global stats. For now, keeping it simple to fix the crash.)
        const cl  = dataArray.filter((p: any) => p.status === 'cleared');
        const pen = dataArray.filter((p: any) => p.status === 'pending_approval');
        const rej = dataArray.filter((p: any) => p.status === 'rejected');
        
        setStats({
          cleared:      cl.length,
          pending:      pen.length,
          rejected:     rej.length,
          total:        dataArray.length,
          totalAmount:  dataArray.reduce((s: number, p: any) => s + (p.amount || 0), 0),
          clearedAmount: cl.reduce((s: number, p: any) => s + (p.amount || 0), 0),
        });
      }
    } catch (e) { console.error(e); }
    setLoading(false);
  }, [activeTab, filters, page]);

  useEffect(() => { fetchModes(); }, []);
  useEffect(() => {
    setPage(1);
    const t = setTimeout(() => fetchPayments(1), 350);
    return () => clearTimeout(t);
  }, [filters, activeTab]);

  useEffect(() => {
    fetchPayments(page);
  }, [page]);

  const openRecordModal = () => openModal('Record Payment', <RecordPaymentForm modes={masterModes} onSuccess={fetchPayments} />);
  const openDetailModal = (p: any) => openModal(
    `Payment Detail — ${p.customer?.account_no || ''}`,
    <PaymentDetailModal payment={p} onClose={closeModal} onRefresh={fetchPayments} />
  );

  return (
    <div id="pg-payments" className="page on">
      <div className="ph">
        <div>
          <div className="ph-t">◈ Payments</div>
          <div className="ph-s">Manage and track collections</div>
        </div>
        <div className="ph-ml">
          {/* Status Tabs */}
          <div style={{ display: 'flex', gap: 2, background: 'var(--bg3)', borderRadius: 10, padding: 3, border: '1px solid var(--bdr)', marginRight: 12 }}>
            {STATUS_TABS.map(t => (
              <button key={t.key}
                onClick={() => setActiveTab(t.key)}
                style={{
                  padding: '6px 14px', borderRadius: 8, border: 'none', cursor: 'pointer', fontSize: 12, fontWeight: 600, transition: 'all 0.2s',
                  background: activeTab === t.key ? 'var(--acc2)' : 'transparent',
                  color: activeTab === t.key ? '#fff' : 'var(--txt3)',
                  boxShadow: activeTab === t.key ? '0 2px 8px rgba(79,125,255,0.3)' : 'none',
                }}
              >
                {t.icon} {t.label}
              </button>
            ))}
          </div>
          <SButton variant="primary" onClick={openRecordModal}>+ Record Payment</SButton>
        </div>
      </div>

      <div className="page-body">
        {/* KPI Cards */}
        <div className="g4" style={{ marginBottom: 22 }}>
          {[
            { label: 'Cleared', val: stats.cleared, sub: `₹${stats.clearedAmount.toLocaleString('en-IN')}`, color: '#22c55e', bg: 'rgba(34,197,94,0.08)', bdr: 'rgba(34,197,94,0.2)', icon: '✓' },
            { label: 'Collected Amount', val: `₹${stats.clearedAmount.toLocaleString('en-IN')}`, sub: `${stats.cleared} payments`, color: 'var(--acc2)', bg: 'rgba(79,125,255,0.08)', bdr: 'rgba(79,125,255,0.2)', icon: '💰' },
            { label: 'Pending Approval', val: stats.pending, sub: 'Awaiting review', color: '#f59e0b', bg: 'rgba(245,158,11,0.08)', bdr: 'rgba(245,158,11,0.2)', icon: '⏳' },
            { label: 'Rejected', val: stats.rejected, sub: `of ${stats.total} total`, color: '#ef4444', bg: 'rgba(239,68,68,0.08)', bdr: 'rgba(239,68,68,0.2)', icon: '✕' },
          ].map(k => (
            <div key={k.label} style={{ background: `linear-gradient(135deg, ${k.bg} 0%, transparent 100%)`, border: `1px solid ${k.bdr}`, borderRadius: 12, padding: '18px 20px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                <div>
                  <div style={{ fontSize: 10, color: k.color, fontWeight: 700, letterSpacing: 0.5, marginBottom: 5, textTransform: 'uppercase' }}>{k.label}</div>
                  <div style={{ fontSize: 24, fontWeight: 800, color: 'var(--txt)' }}>{k.val}</div>
                  <div style={{ fontSize: 10, color: 'var(--txt3)', marginTop: 3 }}>{k.sub}</div>
                </div>
                <div style={{ fontSize: 22, opacity: 0.4 }}>{k.icon}</div>
              </div>
            </div>
          ))}
        </div>

        {/* Filters */}
        <div style={{ marginBottom: 18, display: 'flex', gap: 10, alignItems: 'center', flexWrap: 'wrap' }}>
          <input className="finp" type="date" style={{ flex: '1 1 120px', minWidth: 120 }} value={filters.date} onChange={e => setFilters({ ...filters, date: e.target.value })} />
          <input className="finp" placeholder="Agent name..." style={{ flex: '1 1 130px', minWidth: 130 }} value={filters.agent} onChange={e => setFilters({ ...filters, agent: e.target.value })} />
          <input className="finp" placeholder="Account / Customer..." style={{ flex: '2 1 150px', minWidth: 150 }} value={filters.account} onChange={e => setFilters({ ...filters, account: e.target.value })} />
          <select className="finp" style={{ flex: '1 1 120px', minWidth: 120 }} value={filters.mode} onChange={e => setFilters({ ...filters, mode: e.target.value })}>
            <option value="">All Modes</option>
            {masterModes.map(m => <option key={m} value={m}>{m}</option>)}
          </select>
          <button className="btn" style={{ background: 'var(--redbg)', color: 'var(--red)', border: '1px solid rgba(226,75,74,0.3)', flexShrink: 0 }}
            onClick={() => setFilters({ date: '', agent: '', account: '', mode: '' })}>Clear</button>
          <div style={{ fontSize: 11, color: 'var(--txt3)', marginLeft: 'auto', flexShrink: 0 }}>{totalRecords} records</div>
        </div>

        {/* Table */}
        <div className="card" style={{ padding: 0, overflow: 'hidden', background: 'var(--bg2)', border: '1px solid var(--bdr)', borderRadius: 14 }}>
          <div style={{ overflowX: 'auto' }}>
            <table className="tbl" style={{ borderCollapse: 'collapse', width: '100%' }}>
              <thead>
                <tr style={{ background: 'rgba(255,255,255,0.02)', borderBottom: '1px solid var(--bdr)' }}>
                  {['Date', 'Account Details', 'Amount', 'Mode', 'Ref #', 'Agent', 'Status', ''].map(h => (
                    <th key={h} style={{ padding: '13px 18px', color: 'var(--txt3)', fontSize: 10, textTransform: 'uppercase', letterSpacing: 1, textAlign: h === '' ? 'right' : 'left' }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  Array.from({ length: 6 }).map((_, i) => (
                    <tr key={i} style={{ borderBottom: '1px solid var(--faint)' }}>
                      <td colSpan={8} style={{ padding: '14px 18px' }}><div className="skel" style={{ width: '100%', height: 18 }} /></td>
                    </tr>
                  ))
                ) : payments.length === 0 ? (
                  <tr><td colSpan={8} style={{ textAlign: 'center', padding: 60, color: 'var(--txt3)' }}>
                    <div style={{ fontSize: 40, marginBottom: 15, opacity: 0.2 }}>🔍</div>
                    <div style={{ fontSize: 14, fontWeight: 600 }}>No payments found</div>
                    <div style={{ fontSize: 12, opacity: 0.6 }}>Try adjusting your filters or record a new payment.</div>
                  </td></tr>
                ) : payments.map(p => (
                  <tr key={p.id} className="tr-h" style={{ borderBottom: '1px solid rgba(255,255,255,0.04)', transition: 'background 0.2s', background: p.resolved ? 'rgba(34,197,94,0.02)' : 'transparent' }}>
                    <td style={{ padding: '15px 18px', fontSize: 12, color: 'var(--txt3)' }}>{p.date}</td>
                    <td style={{ padding: '15px 18px' }}>
                      <div style={{ fontSize: 13, fontWeight: 700, color: 'var(--txt)' }}>{p.customer?.name}</div>
                      <div style={{ fontSize: 11, color: 'var(--txt3)', fontFamily: 'monospace' }}>{p.customer?.account_no}</div>
                    </td>
                    <td style={{ padding: '15px 18px', color: '#22c55e', fontWeight: 800, fontSize: 14 }}>₹{p.amount?.toLocaleString('en-IN')}</td>
                    <td style={{ padding: '15px 18px' }}>
                      <span style={{ padding: '3px 9px', borderRadius: 6, fontSize: 10, fontWeight: 700, background: 'rgba(79,125,255,0.1)', color: 'var(--acc2)', border: '1px solid rgba(79,125,255,0.2)', textTransform: 'uppercase' }}>{p.mode}</span>
                    </td>
                    <td style={{ padding: '15px 18px', color: 'var(--txt3)', fontSize: 11, fontFamily: 'monospace' }}>{p.ref || '—'}</td>
                    <td style={{ padding: '15px 18px' }}>
                      <div style={{ fontSize: 12, color: 'var(--txt2)', fontWeight: 600 }}>{p.agent?.name}</div>
                      {p.agent?.empId && <div style={{ fontSize: 10, color: 'var(--txt3)' }}>{p.agent.empId}</div>}
                    </td>
                    <td style={{ padding: '15px 18px' }}>{getStatusBadge(p)}</td>
                    <td style={{ padding: '15px 18px', textAlign: 'right' }}>
                      <button className="btn sm" style={{ background: 'var(--bg3)', border: '1px solid var(--bdr)' }} onClick={() => openDetailModal(p)}>Details</button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Pagination */}
          {totalPages > 1 && (
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '12px 20px', borderTop: '1px solid var(--bdr)', background: 'rgba(255,255,255,0.01)' }}>
              <div style={{ fontSize: 12, color: 'var(--txt3)' }}>
                Showing {((page - 1) * LIMIT) + 1}–{Math.min(page * LIMIT, totalRecords)} of {totalRecords}
              </div>
              <div style={{ display: 'flex', gap: 6 }}>
                <button className="btn sm" disabled={page === 1} onClick={() => setPage(p => Math.max(1, p - 1))}>Previous</button>
                <div style={{ display: 'flex', gap: 4 }}>
                  {Array.from({ length: Math.min(5, totalPages) }).map((_, i) => {
                    const pg = Math.max(1, Math.min(totalPages - 4, page - 2)) + i;
                    if (pg > totalPages || pg < 1) return null;
                    return (
                      <button key={pg} 
                        onClick={() => setPage(pg)}
                        style={{ 
                          width: 32, height: 32, borderRadius: 8, border: '1px solid var(--bdr)', 
                          background: page === pg ? 'var(--acc2)' : 'var(--bg2)',
                          color: page === pg ? '#fff' : 'var(--txt2)',
                          fontSize: 12, fontWeight: 600, cursor: 'pointer'
                        }}
                      >
                        {pg}
                      </button>
                    );
                  })}
                </div>
                <button className="btn sm" disabled={page === totalPages} onClick={() => setPage(p => Math.min(totalPages, p + 1))}>Next</button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Payments;
