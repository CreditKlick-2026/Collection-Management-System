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
      {/* Payment Summary */}
      <div style={{ background: 'var(--bg3)', border: '1px solid var(--bdr)', borderRadius: 8, padding: '12px 14px', marginBottom: 14 }}>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '6px 16px', fontSize: 12 }}>
          <div><span style={{ color: 'var(--txt3)' }}>Customer: </span><b>{item.customer?.name}</b></div>
          <div><span style={{ color: 'var(--txt3)' }}>Account: </span><b>{item.customer?.account_no}</b></div>
          <div><span style={{ color: 'var(--txt3)' }}>Amount: </span><b style={{ color: 'var(--grn)' }}>₹{item.amount?.toLocaleString('en-IN')}</b></div>
          <div><span style={{ color: 'var(--txt3)' }}>Mode: </span><b>{item.mode}</b></div>
          <div><span style={{ color: 'var(--txt3)' }}>Date: </span><b>{item.date}</b></div>
          <div><span style={{ color: 'var(--txt3)' }}>Agent: </span><b>{item.agent?.name}</b></div>
          {item.ref && <div style={{ gridColumn: '1/-1' }}><span style={{ color: 'var(--txt3)' }}>Ref #: </span><b>{item.ref}</b></div>}
          {item.remarks && <div style={{ gridColumn: '1/-1' }}><span style={{ color: 'var(--txt3)' }}>Agent Remarks: </span>{item.remarks}</div>}
        </div>
      </div>

      {/* Action Tabs */}
      <div className="tabs" style={{ marginBottom: 14 }}>
        {(['approved', 'flagged', 'rejected'] as const).map(a => (
          <div key={a} className={`tab ${action === a ? 'on' : ''}`} onClick={() => setAction(a)} style={{ textTransform: 'capitalize' }}>
            {a === 'approved' ? '✓ Approve' : a === 'flagged' ? '⚑ Flag' : '✕ Reject'}
          </div>
        ))}
      </div>

      {action === 'approved' && (
        <div className="info-box grn" style={{ fontSize: 11, marginBottom: 14 }}>✓ Approve this payment and mark it as <b>Cleared</b>.</div>
      )}
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
        <button
          className={`btn ${action === 'approved' ? 'gn' : action === 'rejected' ? 'dn' : 'am'}`}
          style={{ flex: 4, padding: 10 }}
          onClick={handleSubmit}
          disabled={saving}
        >
          {saving ? 'Saving...' : action === 'approved' ? '✓ Confirm Approval' : action === 'rejected' ? '✕ Confirm Rejection' : '⚑ Submit Flag'}
        </button>
        <button className="btn" style={{ flex: 1, padding: 10 }} onClick={() => { const { closeModal: cm } = useApp(); }}>Cancel</button>
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
  }, [filters]);

  const fetchPending = async () => {
    setLoading(true);
    try {
      const q = new URLSearchParams({
        status: 'pending_approval',
        date: filters.date,
        agent: filters.agent,
        account: filters.account
      }).toString();
      const res = await fetch(`/api/payments?${q}`);
      if (res.ok) setPending(await res.json());
    } catch (e) { console.error(e); }
    setLoading(false);
  };

  const quickApprove = async (id: number) => {
    const res = await fetch('/api/payments', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id, status: 'cleared', flag: 'approved', flagBy: user?.id })
    });
    if (res.ok) { toast('Payment approved ✓'); fetchPending(); }
  };

  const quickReject = async (id: number) => {
    const reason = prompt('Enter rejection reason:');
    if (!reason) return;
    const res = await fetch('/api/payments', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id, status: 'rejected', flag: 'rejected', rejectionReason: reason, flagBy: user?.id })
    });
    if (res.ok) { toast('Payment rejected'); fetchPending(); }
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

        {/* Filter Row */}
        <div style={{ marginBottom: 20, display: 'flex', gap: 10, alignItems: 'center' }}>
          <input className="finp" type="date" style={{ width: 'auto' }} value={filters.date} onChange={e => setFilters({ ...filters, date: e.target.value })} />
          <input className="finp" placeholder="Agent name..." style={{ width: 160 }} value={filters.agent} onChange={e => setFilters({ ...filters, agent: e.target.value })} />
          <input className="finp" placeholder="Account / Customer..." style={{ width: 200 }} value={filters.account} onChange={e => setFilters({ ...filters, account: e.target.value })} />
          <button className="btn dn" style={{ color: 'var(--red)', border: '1px solid rgba(226,75,74,0.3)' }} onClick={() => setFilters({ date: '', agent: '', account: '' })}>Clear</button>
        </div>
      </div>

      <div className="page-body">
        {/* Stats Cards */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20, marginBottom: 20 }}>
          <div className="card" style={{ background: 'var(--bg2)', border: '1px solid var(--bdr)' }}>
            <div style={{ fontSize: 10, color: 'var(--txt3)', fontWeight: 700, letterSpacing: 0.5, marginBottom: 8, textTransform: 'uppercase' }}>Payments Pending</div>
            <div style={{ fontSize: 20, fontWeight: 700, color: 'var(--amb)' }}>{pending.length}</div>
          </div>
          <div className="card" style={{ background: 'var(--bg2)', border: '1px solid var(--bdr)' }}>
            <div style={{ fontSize: 10, color: 'var(--txt3)', fontWeight: 700, letterSpacing: 0.5, marginBottom: 8, textTransform: 'uppercase' }}>Total Pending Amount</div>
            <div style={{ fontSize: 20, fontWeight: 700, color: 'var(--txt)' }}>
              ₹{pending.reduce((acc, p) => acc + (p.amount || 0), 0).toLocaleString('en-IN')}
            </div>
          </div>
        </div>

        <div className="tabs" style={{ marginBottom: 20 }}>
          <div className={`tab ${activeTab === 'payments' ? 'on' : ''}`} onClick={() => setActiveTab('payments')}>
            ◈ Payments {pending.length > 0 && <span className="badge red" style={{ marginLeft: 5, fontSize: 9 }}>{pending.length}</span>}
          </div>
          <div className={`tab ${activeTab === 'ptps' ? 'on' : ''}`} onClick={() => setActiveTab('ptps')}>₹ PTPs</div>
        </div>

        {activeTab === 'payments' && (
          <div className="card" style={{ padding: 0, overflow: 'hidden', background: 'var(--bg2)', border: '1px solid var(--bdr)' }}>
            <div style={{ padding: '16px 20px', borderBottom: '1px solid var(--bdr)', fontSize: 13, fontWeight: 700 }}>
              Payments Awaiting Approval
            </div>
            <div style={{ overflowX: 'auto', padding: '10px 20px 20px' }}>
              <table className="tbl" style={{ borderCollapse: 'collapse', width: '100%' }}>
                <thead>
                  <tr style={{ borderBottom: '1px solid var(--bdr)' }}>
                    <th style={{ background: 'transparent', border: 'none', padding: '12px 10px', color: 'var(--txt3)', fontSize: 10, textTransform: 'uppercase', letterSpacing: 0.5 }}>Date</th>
                    <th style={{ background: 'transparent', border: 'none', padding: '12px 10px', color: 'var(--txt3)', fontSize: 10, textTransform: 'uppercase', letterSpacing: 0.5 }}>Account</th>
                    <th style={{ background: 'transparent', border: 'none', padding: '12px 10px', color: 'var(--txt3)', fontSize: 10, textTransform: 'uppercase', letterSpacing: 0.5 }}>Customer</th>
                    <th style={{ background: 'transparent', border: 'none', padding: '12px 10px', color: 'var(--txt3)', fontSize: 10, textTransform: 'uppercase', letterSpacing: 0.5 }}>Amount</th>
                    <th style={{ background: 'transparent', border: 'none', padding: '12px 10px', color: 'var(--txt3)', fontSize: 10, textTransform: 'uppercase', letterSpacing: 0.5 }}>Mode</th>
                    <th style={{ background: 'transparent', border: 'none', padding: '12px 10px', color: 'var(--txt3)', fontSize: 10, textTransform: 'uppercase', letterSpacing: 0.5 }}>Agent</th>
                    <th style={{ background: 'transparent', border: 'none', padding: '12px 10px', color: 'var(--txt3)', fontSize: 10, textTransform: 'uppercase', letterSpacing: 0.5 }}>Remarks</th>
                    <th style={{ background: 'transparent', border: 'none', padding: '12px 10px', color: 'var(--txt3)', fontSize: 10, textTransform: 'uppercase', letterSpacing: 0.5 }}>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {loading ? (
                    Array.from({ length: 6 }).map((_, i) => (
                      <tr key={i} style={{ borderBottom: '1px solid var(--faint)' }}>
                        <td style={{ padding: '14px 10px' }}><div className="skel" style={{ width: '80px' }} /></td>
                        <td style={{ padding: '14px 10px' }}><div className="skel" style={{ width: '100px' }} /></td>
                        <td style={{ padding: '14px 10px' }}><div className="skel" style={{ width: '150px' }} /></td>
                        <td style={{ padding: '14px 10px' }}><div className="skel" style={{ width: '70px' }} /></td>
                        <td style={{ padding: '14px 10px' }}><div className="skel" style={{ width: '50px', height: 18, borderRadius: 12 }} /></td>
                        <td style={{ padding: '14px 10px' }}><div className="skel" style={{ width: '100px' }} /></td>
                        <td style={{ padding: '14px 10px' }}><div className="skel" style={{ width: '120px' }} /></td>
                        <td style={{ padding: '14px 10px' }}>
                          <div style={{ display: 'flex', gap: 6 }}>
                            <div className="skel" style={{ width: '60px', height: 24, borderRadius: 4 }} />
                            <div className="skel" style={{ width: '60px', height: 24, borderRadius: 4 }} />
                          </div>
                        </td>
                      </tr>
                    ))
                  ) : pending.length === 0 ? (
                    <tr><td colSpan={8} style={{ textAlign: 'center', padding: 40, color: 'var(--txt3)' }}>
                      <div style={{ fontSize: 20, marginBottom: 6, opacity: 0.3 }}>✓</div>
                      No pending approvals
                    </td></tr>
                  ) : pending.map(p => (
                    <tr key={p.id} style={{ borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
                      <td className="mn" style={{ color: 'var(--txt3)', padding: '12px 10px' }}>{p.date}</td>
                      <td className="mn" style={{ padding: '12px 10px' }}>{p.customer?.account_no}</td>
                      <td className="nm" style={{ padding: '12px 10px', color: 'var(--txt)' }}>{p.customer?.name}</td>
                      <td className="mn" style={{ padding: '12px 10px', color: 'var(--grn)', fontWeight: 700 }}>₹{p.amount?.toLocaleString('en-IN')}</td>
                      <td style={{ padding: '12px 10px' }}><span className="badge acc" style={{ background: 'rgba(79,125,255,0.1)', color: 'var(--acc2)', border: '1px solid rgba(79,125,255,0.2)' }}>{p.mode}</span></td>
                      <td style={{ padding: '12px 10px', fontSize: 12, color: 'var(--txt2)' }}>{p.agent?.name}</td>
                      <td style={{ padding: '12px 10px', fontSize: 12, color: 'var(--txt3)', maxWidth: 160, overflow: 'hidden', textOverflow: 'ellipsis' }}>{p.remarks || '—'}</td>
                      <td style={{ padding: '12px 10px' }}>
                        <div style={{ display: 'flex', gap: 8 }}>
                          <button className="btn sm" style={{ background: 'rgba(46,204,138,0.1)', color: 'var(--grn)', border: '1px solid rgba(46,204,138,0.2)' }} onClick={() => quickApprove(p.id)}>✓ Approve</button>
                          <button className="btn sm" style={{ background: 'rgba(226,75,74,0.1)', color: 'var(--red)', border: '1px solid rgba(226,75,74,0.2)' }} onClick={() => quickReject(p.id)}>✕ Reject</button>
                          <button className="btn sm" style={{ background: 'rgba(245,166,35,0.1)', color: 'var(--amb)', border: '1px solid rgba(245,166,35,0.2)' }} onClick={() => openModal(`Review Payment`, <FlagModal item={p} onDone={fetchPending} />)}>⚑ Flag</button>
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
          <div style={{ padding: 20, textAlign: 'center', color: 'var(--txt3)' }}>
            <div style={{ fontSize: 20, marginBottom: 6, opacity: 0.3 }}>₹</div>
            PTP approvals coming soon
          </div>
        )}
      </div>
    </div>
  );
};

export default Approvals;
