"use client";
import React, { useState, useEffect } from 'react';
import { useApp } from '@/context/AppContext';

/* ── Flag Modal ──────────────────────────────────────── */
/* ── Review Payment Modal (Advanced) ──────────────────── */
const ReviewPaymentModal = ({ item, onDone }: { item: any, onDone: () => void }) => {
  const { toast, closeModal, user } = useApp();
  const [action, setAction] = useState<'approved' | 'flagged' | 'rejected' | 'reassign'>('approved');
  const [comment, setComment] = useState('');
  const [saving, setSaving] = useState(false);

  // Agent Swap Logic
  const isEligible = item.customer?.eligible_upgrade === 'Y';
  const [upgradeData, setUpgradeData] = useState({ flag: '', type: '', upgraded: 'N' });
  const [allAgents, setAllAgents] = useState<any[]>([]);
  const [selectedAgentId, setSelectedAgentId] = useState(item.agentId);
  const [search, setSearch] = useState('');

  useEffect(() => {
    fetchAgents();
  }, []);

  const fetchAgents = async () => {
    try {
      const res = await fetch('/api/admin/users');
      if (res.ok) {
        const users = await res.json();
        setAllAgents(users.filter((u: any) => u.role === 'agent' || u.role === 'manager'));
      }
    } catch (e) { console.error(e); }
  };

  const filteredAgents = allAgents.filter(u =>
    u.name.toLowerCase().includes(search.toLowerCase()) ||
    u.empId?.toLowerCase().includes(search.toLowerCase())
  );

  const handleSubmit = async () => {
    if ((action === 'flagged' || action === 'rejected') && !comment.trim()) {
      toast('Please enter a comment / reason'); return;
    }
    if (action === 'reassign' && selectedAgentId === item.agentId) {
      toast('Please select a different agent to swap'); return;
    }

    setSaving(true);
    try {
      const body: any = {
        id: item.id,
        status: action === 'approved' ? 'cleared' : action === 'rejected' ? 'rejected' : 'pending_approval',
        flag: action === 'reassign' ? 'reassigned' : action,
        flagBy: user?.id,
        flagComment: comment,
        rejectionReason: action === 'rejected' ? comment : undefined,
      };

      // If Agent Swapped
      if (action === 'reassign') {
        body.agentId = selectedAgentId;
        body.status = 'cleared';
      }

      // Upgrade info
      if (!isEligible) {
        body.metadata = {
          upgrade_flag: upgradeData.flag,
          upgrade_type: upgradeData.type,
          upgraded: upgradeData.upgraded
        };
      }

      const res = await fetch('/api/payments', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body)
      });

      if (res.ok) {
        toast('Action successful ✓');
        closeModal();
        onDone();
      } else {
        const err = await res.json();
        toast(err.message || 'Action failed');
      }
    } catch (e) { toast('Network error'); }
    setSaving(false);
  };

  const currentAgent = allAgents.find(u => u.id === selectedAgentId) || item.agent;

  return (
    <div style={{ padding: '12px 16px 24px', maxHeight: '85vh', overflowY: 'auto', fontSize: 11 }}>
      {/* Compact Info Header */}
      <div style={{ background: 'var(--bg3)', border: '1px solid var(--bdr)', borderRadius: 6, padding: '8px 12px', marginBottom: 10 }}>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(6, 1fr)', gap: '10px', fontSize: 11 }}>
          <div><span style={{ color: 'var(--txt3)', fontSize: 9, textTransform: 'uppercase', display: 'block' }}>Customer</span><b>{item.customer?.name}</b></div>
          <div><span style={{ color: 'var(--txt3)', fontSize: 9, textTransform: 'uppercase', display: 'block' }}>Account</span><b style={{ fontFamily: 'monospace' }}>{item.customer?.account_no}</b></div>
          <div><span style={{ color: 'var(--txt3)', fontSize: 9, textTransform: 'uppercase', display: 'block' }}>Amount</span><b style={{ color: 'var(--grn)' }}>₹{item.amount?.toLocaleString('en-IN')}</b></div>
          <div><span style={{ color: 'var(--txt3)', fontSize: 9, textTransform: 'uppercase', display: 'block' }}>Eligible</span><span className={`badge ${isEligible ? 'grn' : 'red'}`} style={{ fontSize: 8, padding: '1px 4px' }}>{isEligible ? 'YES' : 'NO'}</span></div>
          <div><span style={{ color: 'var(--txt3)', fontSize: 9, textTransform: 'uppercase', display: 'block' }}>Bucket</span><b style={{ color: 'var(--pur)' }}>{item.customer?.bkt_2 || '—'}</b></div>
          <div><span style={{ color: 'var(--txt3)', fontSize: 9, textTransform: 'uppercase', display: 'block' }}>Agent</span><b>{item.agent?.name}</b></div>
        </div>
      </div>

      {!isEligible && (
        <div style={{ background: 'rgba(239,68,68,0.04)', border: '1px solid rgba(239,68,68,0.15)', borderRadius: 6, padding: '8px 12px', marginBottom: 10 }}>
          <div style={{ color: '#ef4444', fontWeight: 700, fontSize: 10, marginBottom: 6, display: 'flex', alignItems: 'center', gap: 6 }}>
            ⚠️ INELIGIBLE UPGRADE
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 10 }}>
            <div className="ff" style={{ margin: 0 }}>
              <label style={{ fontSize: 8 }}>UPGRADE FLAG</label>
              <select className="finp" style={{ borderRadius: 4, height: 28, fontSize: 10, padding: '2px 6px' }} value={upgradeData.flag} onChange={e => setUpgradeData({ ...upgradeData, flag: e.target.value })}>
                <option value="">Select...</option>
                <option value="Yes">Yes</option>
                <option value="No">No</option>
              </select>
            </div>
            <div className="ff" style={{ margin: 0 }}>
              <label style={{ fontSize: 8 }}>UPGRADED</label>
              <select className="finp" style={{ borderRadius: 4, height: 28, fontSize: 10, padding: '2px 6px' }} value={upgradeData.upgraded} onChange={e => setUpgradeData({ ...upgradeData, upgraded: e.target.value })}>
                <option value="N">N</option>
                <option value="Y">Y</option>
              </select>
            </div>
            <div className="ff" style={{ margin: 0, gridColumn: 'span 2' }}>
              <label style={{ fontSize: 8 }}>UPGRADE TYPE</label>
              <select className="finp" style={{ borderRadius: 4, height: 28, fontSize: 10, padding: '2px 6px' }} value={upgradeData.type} onChange={e => setUpgradeData({ ...upgradeData, type: e.target.value })}>
                <option value="">— Select —</option>
                <option value="System">System</option>
                <option value="Payment Received">Payment Received</option>
                <option value="Money Collection">Money Collection</option>
                <option value="Reversal">Reversal</option>
              </select>
            </div>
          </div>
        </div>
      )}


      <div className="tabs" style={{ marginBottom: 10, padding: 2, background: 'var(--bg3)', borderRadius: 6, display: 'flex', gap: 4, border: '1px solid var(--bdr)' }}>
        {(['approved', 'reassign', 'flagged', 'rejected'] as const).map(a => (
          <div key={a} className={`tab ${action === a ? 'on' : ''}`} onClick={() => setAction(a)} 
            style={{ textTransform: 'capitalize', fontSize: 10, borderRadius: 4, flex: 1, textAlign: 'center', padding: '4px 0', cursor: 'pointer' }}>
            {a === 'approved' ? '✓ Approve' : a === 'reassign' ? '🔄 Swap' : a === 'flagged' ? '⚑ Flag' : '✕ Reject'}
          </div>
        ))}
      </div>

      {action === 'reassign' && (
        <div style={{ marginBottom: 12 }}>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
            <div>
              <div style={{ fontSize: 10, fontWeight: 700, marginBottom: 4 }}>🔄 Swap Agent</div>
              <input className="finp sm" placeholder="Search agent..." value={search} onChange={e => setSearch(e.target.value)} style={{ marginBottom: 6, borderRadius: 4, height: 28, fontSize: 10 }} />
              <div style={{ maxHeight: 90, overflowY: 'auto', border: '1px solid var(--bdr)', borderRadius: 4, background: 'var(--bg2)' }}>
                {filteredAgents.length === 0 ? (
                  <div style={{ padding: 6, fontSize: 10, color: 'var(--txt3)', textAlign: 'center' }}>No agents</div>
                ) : filteredAgents.map(u => (
                  <div key={u.id} 
                    onClick={() => setSelectedAgentId(u.id)}
                    style={{ 
                      padding: '4px 8px', borderBottom: '1px solid var(--faint)', cursor: 'pointer', fontSize: 10,
                      background: selectedAgentId === u.id ? 'var(--accbg)' : 'transparent',
                      display: 'flex', justifyContent: 'space-between', alignItems: 'center'
                    }}
                  >
                    <div>
                      <div style={{ fontWeight: 600, color: selectedAgentId === u.id ? 'var(--acc2)' : 'var(--txt)' }}>{u.name}</div>
                      <div style={{ fontSize: 8, color: 'var(--txt3)' }}>{u.empId}</div>
                    </div>
                    {u.id === item.agentId && <span style={{ fontSize: 8, color: 'var(--txt3)', fontStyle: 'italic' }}>Original</span>}
                  </div>
                ))}
              </div>
            </div>
            <div>
              {selectedAgentId !== item.agentId ? (
                <div style={{ marginTop: 18, padding: 10, background: 'rgba(79,125,255,0.06)', borderRadius: 6, fontSize: 10, border: '1px dashed var(--acc2)' }}>
                  <div style={{ color: 'var(--acc2)', fontWeight: 700, marginBottom: 2, fontSize: 8 }}>NEW SELECTION</div>
                  <div style={{ fontSize: 12, fontWeight: 700 }}>{currentAgent?.name}</div>
                  <div style={{ color: 'var(--txt3)', fontSize: 9 }}>ID: {currentAgent?.empId}</div>
                </div>
              ) : (
                <div style={{ marginTop: 18, padding: 10, background: 'var(--bg3)', borderRadius: 6, fontSize: 10, border: '1px solid var(--bdr)', color: 'var(--txt3)' }}>
                  Select an agent to swap.
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {(action === 'flagged' || action === 'rejected') && (
        <div className="ff" style={{ marginBottom: 14 }}>
          <label>{action === 'flagged' ? 'Flag Comment *' : 'Rejection Reason *'}</label>
          <textarea className="finp" rows={3} style={{ resize: 'vertical' }} value={comment} onChange={e => setComment(e.target.value)} />
        </div>
      )}

      <div style={{ display: 'flex', gap: 6, marginTop: 12 }}>
        <button className={`btn sm ${action === 'approved' ? 'gn' : action === 'reassign' ? 'pr' : action === 'rejected' ? 'dn' : 'am'}`}
          style={{ flex: 4, padding: '8px' }} onClick={handleSubmit} disabled={saving}>
          {saving ? 'Saving...' :
            action === 'approved' ? '✓ Confirm Approval' :
              action === 'reassign' ? '🔄 Swap & Clear' :
                action === 'rejected' ? '✕ Confirm Reject' : '⚑ Submit Flag'}
        </button>
        <button className="btn sm" style={{ flex: 1, padding: '8px' }} onClick={closeModal}>Cancel</button>
      </div>
    </div>
  );
};

/* ── Settlement Review Modal ──────────────────────────── */
const ReviewSettlementModal = ({ item, onDone }: { item: any, onDone: () => void }) => {
  const { toast, closeModal, user } = useApp();
  const [status, setStatus] = useState<'Approve' | 'Pending' | 'Rejected'>('Approve');
  const [remarks, setRemarks] = useState('');
  const [saving, setSaving] = useState(false);

  const handleSubmit = async () => {
    if (!item?.id) {
      toast('Error: Settlement ID missing'); return;
    }
    if (status === 'Rejected' && !remarks.trim()) {
      toast('Please enter a rejection reason in Remarks'); return;
    }
    setSaving(true);
    try {
      const res = await fetch('/api/settlements', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id: item.id,
          status,
          remarks,
          rejectionReason: status === 'Rejected' ? remarks : undefined,
          managerId: user?.id
        })
      });
      if (res.ok) {
        toast(`Settlement ${status} ✓`);
        closeModal();
        onDone();
      } else {
        toast('Action failed');
      }
    } catch (e) { toast('Network error'); }
    setSaving(false);
  };

  return (
    <div style={{ padding: '20px' }}>
      <div style={{ background: 'var(--bg3)', border: '1px solid var(--bdr)', borderRadius: 4, padding: '14px', marginBottom: 16, fontSize: 12 }}>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px 20px' }}>
          <div><span style={{ color: 'var(--txt3)' }}>Customer: </span><b>{item.customer?.name} ({item.customer?.account_no})</b></div>
          <div><span style={{ color: 'var(--txt3)' }}>Agent: </span><b>{item.agent?.name}</b></div>
          <div><span style={{ color: 'var(--txt3)' }}>Reason: </span><b style={{ color: 'var(--red)' }}>{item.reason} {item.subReason ? `(${item.subReason})` : ''}</b></div>
          <div><span style={{ color: 'var(--txt3)' }}>Status: </span><span className="badge amb">{item.status}</span></div>
        </div>
        <div style={{ marginTop: 12, padding: 10, background: 'var(--bg2)', borderRadius: 4, border: '1px solid var(--bdr)' }}>
          <div style={{ fontSize: 10, color: 'var(--txt3)', marginBottom: 4 }}>AGENT JUSTIFICATION</div>
          <div>{item.justification}</div>
        </div>
      </div>

      <div className="tabs" style={{ marginBottom: 14 }}>
        {(['Approve', 'Pending', 'Rejected'] as const).map(a => (
          <div key={a} className={`tab ${status === a ? 'on' : ''}`} onClick={() => setStatus(a)} style={{ fontSize: 11, borderRadius: 4 }}>
            {a === 'Approve' ? '✓ Approve' : a === 'Pending' ? '⏳ Pending' : '✕ Reject'}
          </div>
        ))}
      </div>

      <div className="ff">
        <label>Manager Remarks {status === 'Rejected' && '*'}</label>
        <textarea className="finp" rows={3} style={{ borderRadius: 4, resize: 'vertical' }} value={remarks} onChange={e => setRemarks(e.target.value)} placeholder="Provide remarks..." />
      </div>

      <button className={`btn ${status === 'Approve' ? 'gn' : status === 'Pending' ? 'pr' : 'dn'}`} style={{ width: '100%', padding: '12px', fontSize: 13, borderRadius: 4 }} onClick={handleSubmit} disabled={saving}>
        {saving ? 'Processing...' : status === 'Approve' ? 'Approve Settlement' : status === 'Pending' ? 'Set as Pending' : 'Reject Settlement'}
      </button>
    </div>
  );
};

/* ── PTP Flag Modal ───────────────────────────────────── */
const PTPFlagModal = ({ item, onDone }: { item: any, onDone: () => void }) => {
  const { toast, closeModal } = useApp();
  const [action, setAction] = useState<'approved' | 'flagged' | 'rejected'>('approved');
  const [comment, setComment] = useState('');
  const [saving, setSaving] = useState(false);

  const handleSubmit = async () => {
    if ((action === 'flagged' || action === 'rejected') && !comment.trim()) {
      toast('Please enter a comment / reason'); return;
    }
    setSaving(true);
    try {
      const res = await fetch('/api/ptps', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id: item.id,
          flag: action,
          flag_comment: action === 'flagged' ? comment : undefined,
          rejection_reason: action === 'rejected' ? comment : undefined,
        })
      });
      if (res.ok) {
        toast(action === 'approved' ? 'PTP approved ✓' : action === 'rejected' ? 'PTP rejected' : 'PTP flagged ⚑');
        closeModal();
        onDone();
      } else {
        toast('Action failed');
      }
    } catch (e) { toast('Network error'); }
    setSaving(false);
  };

  return (
    <div style={{ padding: '16px 20px 20px' }}>
      <div style={{ background: 'var(--bg3)', border: '1px solid var(--bdr)', borderRadius: 8, padding: '12px 14px', marginBottom: 14 }}>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '6px 16px', fontSize: 12 }}>
          <div><span style={{ color: 'var(--txt3)' }}>Customer: </span><b>{item.customer_name}</b></div>
          <div><span style={{ color: 'var(--txt3)' }}>Account: </span><b>{item.account_no}</b></div>
          <div><span style={{ color: 'var(--txt3)' }}>Amount: </span><b style={{ color: 'var(--amb)' }}>₹{item.ptp_amount?.toLocaleString('en-IN')}</b></div>
          <div><span style={{ color: 'var(--txt3)' }}>PTP Date: </span><b>{item.ptp_date}</b></div>
          <div><span style={{ color: 'var(--txt3)' }}>Agent: </span><b>{item.agent_name}</b></div>
        </div>
      </div>

      <div className="tabs" style={{ marginBottom: 14 }}>
        {(['approved', 'flagged', 'rejected'] as const).map(a => (
          <div key={a} className={`tab ${action === a ? 'on' : ''}`} onClick={() => setAction(a)} style={{ textTransform: 'capitalize' }}>
            {a === 'approved' ? '✓ Approve' : a === 'flagged' ? '⚑ Flag' : '✕ Reject'}
          </div>
        ))}
      </div>

      {action === 'flagged' && (
        <div className="ff" style={{ marginBottom: 14 }}>
          <label>Flag Comment / Reason for Agent *</label>
          <textarea className="finp" rows={3} style={{ resize: 'vertical' }} placeholder="Explain what needs to be clarified..." value={comment} onChange={e => setComment(e.target.value)} />
        </div>
      )}
      {action === 'rejected' && (
        <div className="ff" style={{ marginBottom: 14 }}>
          <label>Rejection Reason *</label>
          <textarea className="finp" rows={3} style={{ resize: 'vertical' }} placeholder="Explain why this PTP is rejected..." value={comment} onChange={e => setComment(e.target.value)} />
        </div>
      )}

      <div style={{ display: 'flex', gap: 8 }}>
        <button className={`btn ${action === 'approved' ? 'gn' : action === 'rejected' ? 'dn' : 'am'}`} style={{ flex: 4, padding: 10 }} onClick={handleSubmit} disabled={saving}>
          {saving ? 'Saving...' : action === 'approved' ? '✓ Confirm Approval' : action === 'rejected' ? '✕ Confirm Rejection' : '⚑ Submit Flag'}
        </button>
        <button className="btn" style={{ flex: 1, padding: 10 }} onClick={closeModal}>Cancel</button>
      </div>
    </div>
  );
};

/* ── Main Approvals Component ─────────────────────────── */
const LIMIT = 25;

const PaginationBar = ({ page, totalPages, total, limit, onPage }: { page: number, totalPages: number, total: number, limit: number, onPage: (p: number) => void }) => {
  if (totalPages <= 1) return null;
  const start = (page - 1) * limit + 1;
  const end = Math.min(page * limit, total);
  const pages = Array.from({ length: Math.min(5, totalPages) }, (_, i) => Math.max(1, Math.min(totalPages - 4, page - 2)) + i);
  const btn = (label: string, pg: number, disabled: boolean) => (
    <button key={label} onClick={() => onPage(pg)} disabled={disabled}
      style={{ padding: '3px 9px', borderRadius: 5, border: `1px solid ${pg === page ? 'var(--acc2)' : 'var(--bdr)'}`, background: pg === page ? 'var(--acc2)' : 'var(--bg2)', color: pg === page ? '#fff' : 'var(--txt3)', cursor: disabled ? 'not-allowed' : 'pointer', fontSize: 11, fontWeight: pg === page ? 700 : 400, opacity: disabled ? 0.4 : 1 }}>{label}</button>
  );
  return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '8px 16px', borderTop: '1px solid var(--bdr)', background: 'var(--bg3)' }}>
      <span style={{ fontSize: 11, color: 'var(--txt3)' }}>Showing {start}–{end} of {total}</span>
      <div style={{ display: 'flex', gap: 4 }}>
        {btn('«', 1, page === 1)}
        {btn('‹', page - 1, page === 1)}
        {pages.map(pg => btn(String(pg), pg, false))}
        {btn('›', page + 1, page === totalPages)}
        {btn('»', totalPages, page === totalPages)}
      </div>
    </div>
  );
};

const Approvals = () => {
  const { openModal, toast, user } = useApp();
  const [pending, setPending] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'payments' | 'ptps' | 'settlements'>('payments');
  const [filters, setFilters] = useState({ date: '', agent: '', account: '' });
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const [totalPages, setTotalPages] = useState(1);
  const [settlementStatus, setSettlementStatus] = useState('Raised');

  useEffect(() => { fetchPending(1); }, []);

  useEffect(() => {
    setPage(1);
    const timer = setTimeout(() => fetchPending(1), 400);
    return () => clearTimeout(timer);
  }, [filters, activeTab, settlementStatus]);

  useEffect(() => { fetchPending(page); }, [page]);

  const fetchPending = async (pg = page) => {
    setLoading(true);
    try {
      const q = new URLSearchParams({ date: filters.date, agent: filters.agent, account: filters.account, page: String(pg), limit: String(LIMIT) });
      if (activeTab === 'payments') {
        q.append('status', 'pending_approval');
        const res = await fetch(`/api/payments?${q.toString()}`);
        if (res.ok) { const j = await res.json(); setPending(j.data || []); setTotal(j.total || 0); setTotalPages(j.totalPages || 1); }
      } else if (activeTab === 'ptps') {
        q.append('flag', 'null');
        const res = await fetch(`/api/ptps?${q.toString()}`);
        if (res.ok) { const j = await res.json(); setPending(j.data || []); setTotal(j.total || 0); setTotalPages(j.totalPages || 1); }
      } else if (activeTab === 'settlements') {
        q.append('status', settlementStatus);
        const res = await fetch(`/api/settlements?${q.toString()}`);
        if (res.ok) { const data = await res.json(); setPending(data || []); setTotal(data.length || 0); setTotalPages(1); }
      }
    } catch (e) { console.error(e); }
    setLoading(false);
  };

  const quickApprove = async (item: any) => {
    // Force manager to review if payment upgrade is ineligible
    if (activeTab === 'payments' && item.customer?.eligible_upgrade !== 'Y') {
      openModal(`Review Payment (Ineligible Upgrade)`, <ReviewPaymentModal item={item} onDone={() => fetchPending(page)} />, 950);
      return;
    }

    const endpoint = activeTab === 'payments' ? '/api/payments' : '/api/ptps';
    const body = activeTab === 'payments'
      ? { id: item.id, status: 'cleared', flag: 'approved', flagBy: user?.id }
      : { id: item.id, flag: 'approved' };

    const res = await fetch(endpoint, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body)
    });
    if (res.ok) { toast(`${activeTab === 'payments' ? 'Payment' : 'PTP'} approved ✓`); fetchPending(page); }
  };

  const quickReject = async (id: number) => {
    const reason = prompt('Enter rejection reason:');
    if (!reason) return;

    const endpoint = activeTab === 'payments' ? '/api/payments' : '/api/ptps';
    const body = activeTab === 'payments'
      ? { id, status: 'rejected', flag: 'rejected', rejectionReason: reason, flagBy: user?.id }
      : { id, flag: 'rejected', rejection_reason: reason };

    const res = await fetch(endpoint, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body)
    });
    if (res.ok) { toast(`${activeTab === 'payments' ? 'Payment' : 'PTP'} rejected`); fetchPending(page); }
  };

  return (
    <div className="page on">
      <div className="ph">
        <div>
          <div className="ph-t">⏳ Pending Approvals</div>
          <div className="ph-s">Payments and PTPs awaiting your review</div>
        </div>
        <div className="ph-ml">
          {total > 0 && (
            <span className="badge amb">⏳ {total} Pending</span>
          )}
        </div>
      </div>

      <div className="page-body">
        {/* Stats Section */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 20, marginBottom: 25 }}>
          <div className="card" style={{ background: 'linear-gradient(135deg, rgba(79,125,255,0.1) 0%, rgba(79,125,255,0.02) 100%)', border: '1px solid rgba(79,125,255,0.2)', padding: '20px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
              <div>
                <div style={{ fontSize: 11, color: 'var(--acc2)', fontWeight: 700, letterSpacing: 0.5, marginBottom: 4, textTransform: 'uppercase' }}>{activeTab === 'payments' ? 'Payments' : activeTab === 'ptps' ? 'PTPs' : 'Settlements'} Pending</div>
                <div style={{ fontSize: 28, fontWeight: 800, color: 'var(--txt)' }}>{total}</div>
              </div>
              <div style={{ fontSize: 24, opacity: 0.5 }}>{activeTab === 'payments' ? '◈' : activeTab === 'ptps' ? '₹' : '⚖️'}</div>
            </div>
          </div>

          <div className="card" style={{ background: 'linear-gradient(135deg, rgba(46,204,138,0.1) 0%, rgba(46,204,138,0.02) 100%)', border: '1px solid rgba(46,204,138,0.2)', padding: '20px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
              <div>
                <div style={{ fontSize: 11, color: 'var(--grn)', fontWeight: 700, letterSpacing: 0.5, marginBottom: 4, textTransform: 'uppercase' }}>Pending Amount</div>
                <div style={{ fontSize: 28, fontWeight: 800, color: 'var(--txt)' }}>
                  ₹{pending.reduce((acc, p) => acc + (p.amount || p.ptp_amount || 0), 0).toLocaleString('en-IN')}
                </div>
              </div>
              <div style={{ fontSize: 24, opacity: 0.5 }}>💰</div>
            </div>
          </div>

          <div className="card" style={{ background: 'linear-gradient(135deg, rgba(245,166,35,0.1) 0%, rgba(245,166,35,0.02) 100%)', border: '1px solid rgba(245,166,35,0.2)', padding: '20px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
              <div>
                <div style={{ fontSize: 11, color: 'var(--amb)', fontWeight: 700, letterSpacing: 0.5, marginBottom: 4, textTransform: 'uppercase' }}>Avg Value</div>
                <div style={{ fontSize: 28, fontWeight: 800, color: 'var(--txt)' }}>
                  ₹{pending.length > 0 ? Math.round(pending.reduce((acc, p) => acc + (p.amount || p.ptp_amount || 0), 0) / pending.length).toLocaleString('en-IN') : 0}
                </div>
              </div>
              <div style={{ fontSize: 24, opacity: 0.5 }}>📈</div>
            </div>
          </div>
        </div>

        {/* Filters */}
        <div style={{ marginBottom: 20, display: 'flex', gap: 10, alignItems: 'center' }}>
          <input className="finp" type="date" style={{ width: 'auto' }} value={filters.date} onChange={e => setFilters({ ...filters, date: e.target.value })} />
          <input className="finp" placeholder="Agent name..." style={{ width: 160 }} value={filters.agent} onChange={e => setFilters({ ...filters, agent: e.target.value })} />
          <input className="finp" placeholder="Account / Customer..." style={{ width: 200 }} value={filters.account} onChange={e => setFilters({ ...filters, account: e.target.value })} />
          <button className="btn" style={{ background: 'var(--redbg)', color: 'var(--red)', border: '1px solid rgba(226,75,74,0.3)' }} onClick={() => { setFilters({ date: '', agent: '', account: '' }); setSettlementStatus('Raised'); }}>Clear</button>

          {activeTab === 'settlements' && (
            <div style={{ marginLeft: 'auto', display: 'flex', alignItems: 'center', gap: 10 }}>
              <label style={{ fontSize: 11, fontWeight: 700, color: 'var(--txt3)' }}>STATUS:</label>
              <select className="finp" style={{ width: 'auto', background: 'var(--bg3)', borderRadius: 8 }} value={settlementStatus} onChange={e => setSettlementStatus(e.target.value)}>
                <option value="all">All Statuses</option>
                <option value="Raised">Raised</option>
                <option value="Pending">Pending</option>
                <option value="Approve">Approved</option>
                <option value="Rejected">Rejected</option>
              </select>
            </div>
          )}
        </div>

        {/* Tab System */}
        <div style={{ display: 'flex', gap: 10, marginBottom: 20, background: 'rgba(255,255,255,0.03)', padding: 5, borderRadius: 12, width: 'fit-content', border: '1px solid var(--bdr)' }}>
          <div
            onClick={() => setActiveTab('payments')}
            style={{
              padding: '8px 20px', borderRadius: 8, fontSize: 13, fontWeight: 600, cursor: 'pointer', transition: 'all 0.2s',
              background: activeTab === 'payments' ? 'var(--acc2)' : 'transparent',
              color: activeTab === 'payments' ? '#fff' : 'var(--txt3)'
            }}
          >
            Payments {activeTab === 'payments' && pending.length > 0 && <span style={{ marginLeft: 6, background: 'rgba(255,255,255,0.2)', padding: '2px 6px', borderRadius: 6, fontSize: 10 }}>{pending.length}</span>}
          </div>
          <div
            onClick={() => setActiveTab('ptps')}
            style={{
              padding: '8px 20px', borderRadius: 8, fontSize: 13, fontWeight: 600, cursor: 'pointer', transition: 'all 0.2s',
              background: activeTab === 'ptps' ? 'var(--acc2)' : 'transparent',
              color: activeTab === 'ptps' ? '#fff' : 'var(--txt3)'
            }}
          >
            PTPs {activeTab === 'ptps' && pending.length > 0 && <span style={{ marginLeft: 6, background: 'rgba(255,255,255,0.2)', padding: '2px 6px', borderRadius: 6, fontSize: 10 }}>{pending.length}</span>}
          </div>
          <div
            onClick={() => setActiveTab('settlements')}
            style={{
              padding: '8px 20px', borderRadius: 8, fontSize: 13, fontWeight: 600, cursor: 'pointer', transition: 'all 0.2s',
              background: activeTab === 'settlements' ? 'var(--acc2)' : 'transparent',
              color: activeTab === 'settlements' ? '#fff' : 'var(--txt3)'
            }}
          >
            ⚖️ Settlements {activeTab === 'settlements' && pending.length > 0 && <span style={{ marginLeft: 6, background: 'rgba(255,255,255,0.2)', padding: '2px 6px', borderRadius: 6, fontSize: 10 }}>{pending.length}</span>}
          </div>
        </div>

        {activeTab === 'payments' && (
          <div className="card" style={{ padding: 0, overflow: 'hidden', background: 'var(--bg2)', border: '1px solid var(--bdr)', borderRadius: 16 }}>
            <div style={{ padding: '18px 24px', borderBottom: '1px solid var(--bdr)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div style={{ fontSize: 14, fontWeight: 700 }}>Payments Awaiting Approval</div>
              <div style={{ fontSize: 11, color: 'var(--txt3)' }}>Showing {pending.length} records</div>
            </div>
            <div style={{ overflowX: 'auto' }}>
              <table className="tbl" style={{ borderCollapse: 'collapse', width: '100%' }}>
                <thead>
                  <tr style={{ background: 'rgba(255,255,255,0.02)', borderBottom: '1px solid var(--bdr)' }}>
                    <th style={{ padding: '14px 20px', color: 'var(--txt3)', fontSize: 10, textTransform: 'uppercase', letterSpacing: 1, textAlign: 'left' }}>Date</th>
                    <th style={{ padding: '14px 20px', color: 'var(--txt3)', fontSize: 10, textTransform: 'uppercase', letterSpacing: 1, textAlign: 'left' }}>Account Details</th>
                    <th style={{ padding: '14px 20px', color: 'var(--txt3)', fontSize: 10, textTransform: 'uppercase', letterSpacing: 1, textAlign: 'left' }}>Amount</th>
                    <th style={{ padding: '14px 20px', color: 'var(--txt3)', fontSize: 10, textTransform: 'uppercase', letterSpacing: 1, textAlign: 'left' }}>Mode</th>
                    <th style={{ padding: '14px 20px', color: 'var(--txt3)', fontSize: 10, textTransform: 'uppercase', letterSpacing: 1, textAlign: 'left' }}>Agent Info</th>
                    <th style={{ padding: '14px 20px', color: 'var(--txt3)', fontSize: 10, textTransform: 'uppercase', letterSpacing: 1, textAlign: 'right' }}>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {loading ? (
                    Array.from({ length: 5 }).map((_, i) => (
                      <tr key={i} style={{ borderBottom: '1px solid var(--faint)' }}>
                        <td colSpan={6} style={{ padding: '15px 20px' }}><div className="skel" style={{ width: '100%', height: 20 }} /></td>
                      </tr>
                    ))
                  ) : pending.length === 0 ? (
                    <tr><td colSpan={6} style={{ textAlign: 'center', padding: 60, color: 'var(--txt3)' }}>
                      <div style={{ fontSize: 40, marginBottom: 15, opacity: 0.2 }}>✨</div>
                      <div style={{ fontSize: 14, fontWeight: 600 }}>All caught up!</div>
                      <div style={{ fontSize: 12, opacity: 0.6 }}>No payments are pending for your approval.</div>
                    </td></tr>
                  ) : pending.map(p => (
                    <tr key={p.id} className="tr-h" style={{ borderBottom: '1px solid rgba(255,255,255,0.04)', transition: 'background 0.2s' }}>
                      <td className="mn" style={{ padding: '16px 20px', fontSize: 13, color: 'var(--txt3)' }}>{p.date}</td>
                      <td style={{ padding: '16px 20px' }}>
                        <div style={{ fontSize: 13, fontWeight: 700, color: 'var(--txt)' }}>{p.customer?.name}</div>
                        <div style={{ fontSize: 11, color: 'var(--txt3)', fontFamily: 'monospace' }}>{p.customer?.account_no}</div>
                      </td>
                      <td className="mn" style={{ padding: '16px 20px', color: 'var(--grn)', fontWeight: 800, fontSize: 15 }}>₹{p.amount?.toLocaleString('en-IN')}</td>
                      <td style={{ padding: '16px 20px' }}>
                        <span style={{ padding: '4px 10px', borderRadius: 6, fontSize: 10, fontWeight: 700, background: 'rgba(79,125,255,0.1)', color: 'var(--acc2)', border: '1px solid rgba(79,125,255,0.2)', textTransform: 'uppercase' }}>{p.mode}</span>
                      </td>
                      <td style={{ padding: '16px 20px' }}>
                        <div style={{ fontSize: 12, color: 'var(--txt2)', fontWeight: 600 }}>{p.agent?.name}</div>
                        <div style={{ fontSize: 11, color: 'var(--txt3)', maxWidth: 150, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{p.remarks || 'No remarks'}</div>
                      </td>
                      <td style={{ padding: '16px 20px', textAlign: 'right' }}>
                        <div style={{ display: 'flex', gap: 6, justifyContent: 'flex-end' }}>
                          <button className="btn sm gn" style={{ padding: '6px 12px', fontSize: 11 }} onClick={() => quickApprove(p)}>Approve</button>
                          <button className="btn sm dn" style={{ padding: '6px 12px', fontSize: 11 }} onClick={() => quickReject(p.id)}>Reject</button>
                          <button className="btn sm am" style={{ padding: '6px 12px', fontSize: 11 }} onClick={() => openModal(`Review Payment`, <ReviewPaymentModal item={p} onDone={() => fetchPending(page)} />, 950)}>Flag</button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {activeTab === 'ptps' && (
          <div className="card" style={{ padding: 0, overflow: 'hidden', background: 'var(--bg2)', border: '1px solid var(--bdr)', borderRadius: 16 }}>
            <div style={{ padding: '18px 24px', borderBottom: '1px solid var(--bdr)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div style={{ fontSize: 14, fontWeight: 700 }}>PTPs Awaiting Review</div>
              <div style={{ fontSize: 11, color: 'var(--txt3)' }}>Showing {pending.length} records</div>
            </div>
            <div style={{ overflowX: 'auto' }}>
              <table className="tbl" style={{ borderCollapse: 'collapse', width: '100%' }}>
                <thead>
                  <tr style={{ background: 'rgba(255,255,255,0.02)', borderBottom: '1px solid var(--bdr)' }}>
                    <th style={{ padding: '14px 20px', color: 'var(--txt3)', fontSize: 10, textTransform: 'uppercase', letterSpacing: 1, textAlign: 'left' }}>Created</th>
                    <th style={{ padding: '14px 20px', color: 'var(--txt3)', fontSize: 10, textTransform: 'uppercase', letterSpacing: 1, textAlign: 'left' }}>Account Details</th>
                    <th style={{ padding: '14px 20px', color: 'var(--txt3)', fontSize: 10, textTransform: 'uppercase', letterSpacing: 1, textAlign: 'left' }}>PTP Amount</th>
                    <th style={{ padding: '14px 20px', color: 'var(--txt3)', fontSize: 10, textTransform: 'uppercase', letterSpacing: 1, textAlign: 'left' }}>Promise Date</th>
                    <th style={{ padding: '14px 20px', color: 'var(--txt3)', fontSize: 10, textTransform: 'uppercase', letterSpacing: 1, textAlign: 'left' }}>Agent Info</th>
                    <th style={{ padding: '14px 20px', color: 'var(--txt3)', fontSize: 10, textTransform: 'uppercase', letterSpacing: 1, textAlign: 'right' }}>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {loading ? (
                    Array.from({ length: 5 }).map((_, i) => (
                      <tr key={i} style={{ borderBottom: '1px solid var(--faint)' }}>
                        <td colSpan={6} style={{ padding: '15px 20px' }}><div className="skel" style={{ width: '100%', height: 20 }} /></td>
                      </tr>
                    ))
                  ) : pending.length === 0 ? (
                    <tr><td colSpan={6} style={{ textAlign: 'center', padding: 60, color: 'var(--txt3)' }}>
                      <div style={{ fontSize: 40, marginBottom: 15, opacity: 0.2 }}>✨</div>
                      <div style={{ fontSize: 14, fontWeight: 600 }}>All caught up!</div>
                      <div style={{ fontSize: 12, opacity: 0.6 }}>No PTPs are pending for your review.</div>
                    </td></tr>
                  ) : pending.map(p => (
                    <tr key={p.id} className="tr-h" style={{ borderBottom: '1px solid rgba(255,255,255,0.04)', transition: 'background 0.2s' }}>
                      <td className="mn" style={{ padding: '16px 20px', fontSize: 13, color: 'var(--txt3)' }}>{p.created}</td>
                      <td style={{ padding: '16px 20px' }}>
                        <div style={{ fontSize: 13, fontWeight: 700, color: 'var(--txt)' }}>{p.customer_name}</div>
                        <div style={{ fontSize: 11, color: 'var(--txt3)', fontFamily: 'monospace' }}>{p.account_no}</div>
                      </td>
                      <td className="mn" style={{ padding: '16px 20px', color: 'var(--amb)', fontWeight: 800, fontSize: 15 }}>₹{p.ptp_amount?.toLocaleString('en-IN')}</td>
                      <td className="mn" style={{ padding: '16px 20px', color: 'var(--txt2)', fontSize: 13 }}>{p.ptp_date}</td>
                      <td style={{ padding: '16px 20px' }}>
                        <div style={{ fontSize: 12, color: 'var(--txt2)', fontWeight: 600 }}>{p.agent_name}</div>
                      </td>
                      <td style={{ padding: '16px 20px', textAlign: 'right' }}>
                        <div style={{ display: 'flex', gap: 6, justifyContent: 'flex-end' }}>
                          <button className="btn sm gn" style={{ padding: '6px 12px', fontSize: 11 }} onClick={() => quickApprove(p)}>Approve</button>
                          <button className="btn sm dn" style={{ padding: '6px 12px', fontSize: 11 }} onClick={() => quickReject(p.id)}>Reject</button>
                          <button className="btn sm am" style={{ padding: '6px 12px', fontSize: 11 }} onClick={() => openModal(`Review PTP`, <PTPFlagModal item={p} onDone={fetchPending} />)}>Flag</button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {activeTab === 'settlements' && (
          <div className="card" style={{ padding: 0, overflow: 'hidden', background: 'var(--bg2)', border: '1px solid var(--bdr)', borderRadius: 16 }}>
            <div style={{ padding: '18px 24px', borderBottom: '1px solid var(--bdr)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div style={{ fontSize: 14, fontWeight: 700 }}>Settlements Awaiting Review</div>
              <div style={{ fontSize: 11, color: 'var(--txt3)' }}>Showing {pending.length} records</div>
            </div>
            <div style={{ overflowX: 'auto' }}>
              <table className="tbl" style={{ borderCollapse: 'collapse', width: '100%' }}>
                <thead>
                  <tr style={{ background: 'rgba(255,255,255,0.02)', borderBottom: '1px solid var(--bdr)' }}>
                    <th style={{ padding: '14px 20px', color: 'var(--txt3)', fontSize: 10, textTransform: 'uppercase', letterSpacing: 1, textAlign: 'left' }}>Date</th>
                    <th style={{ padding: '14px 20px', color: 'var(--txt3)', fontSize: 10, textTransform: 'uppercase', letterSpacing: 1, textAlign: 'left' }}>Customer</th>
                    <th style={{ padding: '14px 20px', color: 'var(--txt3)', fontSize: 10, textTransform: 'uppercase', letterSpacing: 1, textAlign: 'left' }}>Reason</th>
                    <th style={{ padding: '14px 20px', color: 'var(--txt3)', fontSize: 10, textTransform: 'uppercase', letterSpacing: 1, textAlign: 'left' }}>Agent Info</th>
                    <th style={{ padding: '14px 20px', color: 'var(--txt3)', fontSize: 10, textTransform: 'uppercase', letterSpacing: 1, textAlign: 'right' }}>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {loading ? (
                    Array.from({ length: 5 }).map((_, i) => (
                      <tr key={i} style={{ borderBottom: '1px solid var(--faint)' }}>
                        <td colSpan={5} style={{ padding: '15px 20px' }}><div className="skel" style={{ width: '100%', height: 20 }} /></td>
                      </tr>
                    ))
                  ) : pending.length === 0 ? (
                    <tr><td colSpan={5} style={{ textAlign: 'center', padding: 60, color: 'var(--txt3)' }}>
                      <div style={{ fontSize: 40, marginBottom: 15, opacity: 0.2 }}>✨</div>
                      <div style={{ fontSize: 14, fontWeight: 600 }}>All caught up!</div>
                      <div style={{ fontSize: 12, opacity: 0.6 }}>No Settlements are pending for your review.</div>
                    </td></tr>
                  ) : pending.map(p => (
                    <tr key={p.id} className="tr-h" style={{ borderBottom: '1px solid rgba(255,255,255,0.04)', transition: 'background 0.2s' }}>
                      <td className="mn" style={{ padding: '16px 20px', fontSize: 13, color: 'var(--txt3)' }}>{p.created}</td>
                      <td style={{ padding: '16px 20px' }}>
                        <div style={{ fontSize: 13, fontWeight: 700, color: 'var(--txt)' }}>{p.customer?.name}</div>
                        <div style={{ fontSize: 11, color: 'var(--txt3)', fontFamily: 'monospace' }}>{p.customer?.account_no}</div>
                      </td>
                      <td style={{ padding: '16px 20px' }}>
                        <span style={{ padding: '4px 10px', borderRadius: 6, fontSize: 10, fontWeight: 700, background: 'rgba(244,63,94,0.1)', color: 'var(--red)', border: '1px solid rgba(244,63,94,0.2)', textTransform: 'uppercase' }}>{p.reason}</span>
                        {p.subReason && <div style={{ fontSize: 10, color: 'var(--txt3)', marginTop: 4 }}>{p.subReason}</div>}
                      </td>
                      <td style={{ padding: '16px 20px' }}>
                        <div style={{ fontSize: 12, color: 'var(--txt2)', fontWeight: 600 }}>{p.agent?.name}</div>
                        <div style={{ fontSize: 11, color: 'var(--txt3)', maxWidth: 150, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{p.justification || 'No remarks'}</div>
                      </td>
                      <td style={{ padding: '16px 20px', textAlign: 'right' }}>
                        <div style={{ display: 'flex', gap: 6, justifyContent: 'flex-end' }}>
                          <button className="btn sm pr" style={{ padding: '6px 12px', fontSize: 11 }} onClick={() => openModal(`Review Settlement`, <ReviewSettlementModal item={p} onDone={() => fetchPending(page)} />)}>Review</button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default Approvals;
