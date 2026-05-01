"use client";
import React, { useState, useEffect } from 'react';
import { useApp } from '@/context/AppContext';

/* ── Flag Modal ──────────────────────────────────────── */
const FlagModal = ({ item, onDone }: { item: any, onDone: () => void }) => {
  const { toast, closeModal, user } = useApp();
  const [action, setAction] = useState<'approved' | 'flagged' | 'rejected'>('approved');
  const [comment, setComment] = useState('');
  const [saving, setSaving] = useState(false);

  const handleSubmit = async () => {
    if ((action === 'flagged' || action === 'rejected') && !comment.trim()) {
      toast('Please enter a comment / reason'); return;
    }
    setSaving(true);
    try {
      const res = await fetch('/api/payments', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id: item.id,
          status: action === 'approved' ? 'cleared' : action === 'rejected' ? 'rejected' : 'pending_approval',
          flag: action,
          flagBy: user?.id,
          flagComment: action === 'flagged' ? comment : undefined,
          rejectionReason: action === 'rejected' ? comment : undefined,
        })
      });
      if (res.ok) {
        toast(action === 'approved' ? 'Payment approved ✓' : action === 'rejected' ? 'Payment rejected' : 'Payment flagged ⚑');
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
          <div><span style={{ color: 'var(--txt3)' }}>Customer: </span><b>{item.customer?.name}</b></div>
          <div><span style={{ color: 'var(--txt3)' }}>Account: </span><b>{item.customer?.account_no}</b></div>
          <div><span style={{ color: 'var(--txt3)' }}>Amount: </span><b style={{ color: 'var(--grn)' }}>₹{item.amount?.toLocaleString('en-IN')}</b></div>
          <div><span style={{ color: 'var(--txt3)' }}>Mode: </span><b>{item.mode}</b></div>
          <div><span style={{ color: 'var(--txt3)' }}>Date: </span><b>{item.date}</b></div>
          <div><span style={{ color: 'var(--txt3)' }}>Agent: </span><b>{item.agent?.name}</b></div>
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
          <textarea className="finp" rows={3} style={{ resize: 'vertical' }} placeholder="Explain why this payment is rejected..." value={comment} onChange={e => setComment(e.target.value)} />
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
const Approvals = () => {
  const { openModal, toast, user } = useApp();
  const [pending, setPending] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'payments' | 'ptps'>('payments');
  const [filters, setFilters] = useState({ date: '', agent: '', account: '' });

  useEffect(() => { fetchPending(); }, []);

  useEffect(() => {
    const timer = setTimeout(() => {
      fetchPending();
    }, 400);
    return () => clearTimeout(timer);
  }, [filters, activeTab]);

  const fetchPending = async () => {
    setLoading(true);
    try {
      const q = new URLSearchParams({
        date: filters.date,
        agent: filters.agent,
        account: filters.account
      });
      
      if (activeTab === 'payments') {
        q.append('status', 'pending_approval');
        const res = await fetch(`/api/payments?${q.toString()}`);
        if (res.ok) setPending(await res.json());
      } else {
        q.append('flag', 'null');
        const res = await fetch(`/api/ptps?${q.toString()}`);
        if (res.ok) setPending(await res.json());
      }
    } catch (e) { console.error(e); }
    setLoading(false);
  };

  const quickApprove = async (id: number) => {
    const endpoint = activeTab === 'payments' ? '/api/payments' : '/api/ptps';
    const body = activeTab === 'payments' 
      ? { id, status: 'cleared', flag: 'approved', flagBy: user?.id }
      : { id, flag: 'approved' };

    const res = await fetch(endpoint, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body)
    });
    if (res.ok) { toast(`${activeTab === 'payments' ? 'Payment' : 'PTP'} approved ✓`); fetchPending(); }
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
    if (res.ok) { toast(`${activeTab === 'payments' ? 'Payment' : 'PTP'} rejected`); fetchPending(); }
  };

  return (
    <div className="page on">
      <div className="ph">
        <div>
          <div className="ph-t">⏳ Pending Approvals</div>
          <div className="ph-s">Payments and PTPs awaiting your review</div>
        </div>
        <div className="ph-ml">
          {pending.length > 0 && (
            <span className="badge amb">⏳ {pending.length} Pending</span>
          )}
        </div>
      </div>

      <div className="page-body">
        {/* Stats Section */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 20, marginBottom: 25 }}>
          <div className="card" style={{ background: 'linear-gradient(135deg, rgba(79,125,255,0.1) 0%, rgba(79,125,255,0.02) 100%)', border: '1px solid rgba(79,125,255,0.2)', padding: '20px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
              <div>
                <div style={{ fontSize: 11, color: 'var(--acc2)', fontWeight: 700, letterSpacing: 0.5, marginBottom: 4, textTransform: 'uppercase' }}>{activeTab === 'payments' ? 'Payments' : 'PTPs'} Pending</div>
                <div style={{ fontSize: 28, fontWeight: 800, color: 'var(--txt)' }}>{pending.length}</div>
              </div>
              <div style={{ fontSize: 24, opacity: 0.5 }}>{activeTab === 'payments' ? '◈' : '₹'}</div>
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
          <button className="btn dn" style={{ color: 'var(--red)', border: '1px solid rgba(226,75,74,0.3)' }} onClick={() => setFilters({ date: '', agent: '', account: '' })}>Clear</button>
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
                          <button className="btn sm gn" style={{ padding: '6px 12px', fontSize: 11 }} onClick={() => quickApprove(p.id)}>Approve</button>
                          <button className="btn sm dn" style={{ padding: '6px 12px', fontSize: 11 }} onClick={() => quickReject(p.id)}>Reject</button>
                          <button className="btn sm am" style={{ padding: '6px 12px', fontSize: 11 }} onClick={() => openModal(`Review Payment`, <FlagModal item={p} onDone={fetchPending} />)}>Flag</button>
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
                          <button className="btn sm gn" style={{ padding: '6px 12px', fontSize: 11 }} onClick={() => quickApprove(p.id)}>Approve</button>
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
      </div>
    </div>
  );
};

export default Approvals;
