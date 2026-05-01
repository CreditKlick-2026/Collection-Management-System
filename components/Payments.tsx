"use client";
import React, { useState, useEffect } from 'react';
import { useApp } from '@/context/AppContext';
import SButton from './SButton';

const DEFAULT_MODES = ['Cash', 'NEFT', 'IMPS', 'UPI', 'Cheque', 'DD'];

const RecordPaymentForm = ({ modes, onSuccess }: { modes: string[], onSuccess: () => void }) => {
  const { toast, closeModal, user } = useApp();
  const [form, setForm] = useState({ customerId: '', amount: '', mode: 'Cash', ref: '', date: new Date().toISOString().split('T')[0], remarks: '' });
  const [saving, setSaving] = useState(false);
  
  // Search state
  const [searchQuery, setSearchQuery] = useState('');
  const [suggestions, setSuggestions] = useState<any[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const suggestionRef = React.useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (suggestionRef.current && !suggestionRef.current.contains(event.target as Node)) {
        setShowSuggestions(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  useEffect(() => {
    if (searchQuery.length < 2) {
      setSuggestions([]);
      return;
    }

    const timer = setTimeout(async () => {
      setIsSearching(true);
      try {
        const res = await fetch(`/api/leads?q=${searchQuery}&searchType=account`);
        if (res.ok) {
          const data = await res.json();
          setSuggestions(data);
        }
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
    if (!user?.id) { toast('You must be logged in to record a payment'); return; }
    setSaving(true);
    try {
      const res = await fetch('/api/payments', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...form, amount: parseFloat(form.amount), agentId: user.id })
      });
      if (res.ok) {
        toast('Payment recorded — pending manager approval ✓');
        closeModal();
        onSuccess();
      } else {
        const err = await res.json();
        toast(err.message || 'Failed to record payment');
      }
    } catch (e) { toast('Network error'); }
    setSaving(false);
  };

  return (
    <div style={{ padding: '16px 20px 20px' }}>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 14 }}>
        <div className="ff" style={{ gridColumn: '1/-1', position: 'relative' }} ref={suggestionRef}>
          <label>Customer Account *</label>
          <div style={{ position: 'relative' }}>
            <input 
              className="finp" 
              placeholder="Search by Name or Account #..." 
              value={searchQuery}
              onChange={e => {
                setSearchQuery(e.target.value);
                setShowSuggestions(true);
                if (form.customerId) setForm({ ...form, customerId: '' }); 
              }}
              onFocus={() => searchQuery.length >= 2 && setShowSuggestions(true)}
            />
            {isSearching && <div style={{ position: 'absolute', right: 10, top: '50%', transform: 'translateY(-50%)', fontSize: 10, color: 'var(--txt3)' }}>Searching...</div>}
          </div>

          {showSuggestions && suggestions.length > 0 && (
            <div style={{ 
              position: 'absolute', top: '100%', left: 0, right: 0, zIndex: 100,
              background: 'var(--bg2)', border: '1px solid var(--bdr)', borderRadius: 8,
              marginTop: 4, boxShadow: '0 10px 25px rgba(0,0,0,0.3)', maxHeight: 200, overflowY: 'auto'
            }}>
              {suggestions.map(c => (
                <div 
                  key={c.id} 
                  style={{ padding: '10px 12px', cursor: 'pointer', borderBottom: '1px solid var(--faint)', transition: 'background 0.2s' }}
                  onClick={() => selectCustomer(c)}
                  onMouseOver={e => e.currentTarget.style.background = 'var(--bg3)'}
                  onMouseOut={e => e.currentTarget.style.background = 'transparent'}
                >
                  <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--txt)' }}>{c.name}</div>
                  <div style={{ fontSize: 11, color: 'var(--txt3)' }}>{c.account_no} · {c.mobile}</div>
                </div>
              ))}
            </div>
          )}
          {showSuggestions && searchQuery.length >= 2 && !isSearching && suggestions.length === 0 && (
            <div style={{ 
              position: 'absolute', top: '100%', left: 0, right: 0, zIndex: 100,
              background: 'var(--bg2)', border: '1px solid var(--bdr)', borderRadius: 8,
              marginTop: 4, padding: '12px', fontSize: 12, color: 'var(--txt3)', textAlign: 'center'
            }}>
              No customers found
            </div>
          )}
        </div>
        <div className="ff">
          <label>Amount (₹) *</label>
          <input className="finp" type="number" placeholder="0.00" value={form.amount} onChange={e => setForm({ ...form, amount: e.target.value })} />
        </div>
        <div className="ff">
          <label>Payment Mode</label>
          <select className="finp" value={form.mode} onChange={e => setForm({ ...form, mode: e.target.value })}>
            {modes.map(m => <option key={m} value={m}>{m}</option>)}
          </select>
        </div>
        <div className="ff">
          <label>Reference Number</label>
          <input className="finp" placeholder="UTR / Cheque No." value={form.ref} onChange={e => setForm({ ...form, ref: e.target.value })} />
        </div>
        <div className="ff">
          <label>Payment Date</label>
          <input className="finp" type="date" value={form.date} onChange={e => setForm({ ...form, date: e.target.value })} />
        </div>
        <div className="ff" style={{ gridColumn: '1/-1' }}>
          <label>Remarks</label>
          <textarea className="finp" rows={2} style={{ resize: 'vertical' }} value={form.remarks} onChange={e => setForm({ ...form, remarks: e.target.value })} />
        </div>
      </div>
      <div style={{ display: 'flex', gap: 10 }}>
        <SButton variant="primary" style={{ flex: 2 }} onClick={handleSubmit} loading={saving}>
          Record Payment
        </SButton>
        <SButton variant="secondary" style={{ flex: 1 }} onClick={closeModal}>
          Cancel
        </SButton>
      </div>
    </div>
  );
};

const PaymentDetailModal = ({ payment, onClose }: { payment: any, onClose: () => void }) => {
  const { toast } = useApp();
  const [remarks, setRemarks] = useState(payment?.remarks || '');

  return (
    <div style={{ padding: '16px 20px 20px' }}>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, marginBottom: 12 }}>
        <div className="ff"><label>Customer</label><input className="finp" value={payment.customer?.name || '—'} readOnly /></div>
        <div className="ff"><label>Account #</label><input className="finp" value={payment.customer?.account_no || '—'} readOnly /></div>
        <div className="ff"><label>Amount</label><input className="finp" value={`₹${payment.amount?.toLocaleString('en-IN')}`} readOnly style={{ color: 'var(--grn)', fontWeight: 700 }} /></div>
        <div className="ff"><label>Mode</label><input className="finp" value={payment.mode} readOnly /></div>
        <div className="ff"><label>Reference #</label><input className="finp" value={payment.ref || '—'} readOnly /></div>
        <div className="ff"><label>Date</label><input className="finp" value={payment.date} readOnly /></div>
        <div className="ff"><label>Agent</label><input className="finp" value={payment.agent?.name || '—'} readOnly /></div>
        <div className="ff"><label>Status</label><input className="finp" value={payment.status} readOnly /></div>
      </div>
      <div className="ff" style={{ marginBottom: 14 }}>
        <label>VOC / Remarks</label>
        <textarea className="finp" rows={2} style={{ resize: 'vertical' }} value={remarks} onChange={e => setRemarks(e.target.value)} />
      </div>
      {payment.flag === 'rejected' && (
        <div className="info-box red" style={{ marginBottom: 10, fontSize: 11 }}>✕ <b>Rejected:</b> {payment.rejectionReason || 'No reason provided'}</div>
      )}
      {payment.flag === 'flagged' && (
        <div className="info-box amb" style={{ marginBottom: 10, fontSize: 11 }}>⚑ <b>Flagged:</b> {payment.flagComment || 'No comment'}</div>
      )}
      <div style={{ display: 'flex', gap: 8 }}>
        <button className="btn pr" style={{ flex: 1, padding: 9 }} onClick={() => toast('Remarks saved ✓')}>✓ Save Remarks</button>
        <button className="btn dn" style={{ padding: '9px 16px' }} onClick={onClose}>Close</button>
      </div>
    </div>
  );
};

const Payments = () => {
  const { openModal, closeModal } = useApp();
  const [payments, setPayments] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState({ date: '', agent: '', account: '', mode: '' });
  const [activeTab, setActiveTab] = useState('cleared'); 
  const [masterModes, setMasterModes] = useState<string[]>(DEFAULT_MODES);

  useEffect(() => {
    fetchPayments();
    fetchModes();
  }, []);

  useEffect(() => {
    const timer = setTimeout(() => {
      fetchPayments();
    }, 400);
    return () => clearTimeout(timer);
  }, [filters, activeTab]);

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

  const fetchPayments = async () => {
    setLoading(true);
    try {
      const q = new URLSearchParams({
        status: activeTab,
        date: filters.date,
        mode: filters.mode,
        agent: filters.agent,
        account: filters.account
      }).toString();
      const res = await fetch(`/api/payments?${q}`);
      if (res.ok) setPayments(await res.json());
    } catch (e) { console.error(e); }
    setLoading(false);
  };

  const openRecordModal = () => {
    openModal('Record Payment', <RecordPaymentForm modes={masterModes} onSuccess={fetchPayments} />);
  };

  const openDetailModal = (p: any) => {
    openModal(`Payment Detail — ${p.customer?.account_no || p.account}`, <PaymentDetailModal payment={p} onClose={closeModal} />);
  };

  return (
    <div id="pg-payments" className="page on">
      <div className="ph">
        <div>
          <div className="ph-t">◈ Payments</div>
          <div className="ph-s">Manage and track collections</div>
        </div>
        <div className="ph-ml">
          <div className="segmented-group" style={{ marginRight: 15 }}>
            <button className={`segmented-btn ${activeTab === 'cleared' ? 'on' : ''}`} onClick={() => setActiveTab('cleared')}>Cleared</button>
            <button className={`segmented-btn ${activeTab === 'pending_approval' ? 'on' : ''}`} onClick={() => setActiveTab('pending_approval')}>Pending</button>
          </div>
          <SButton variant="primary" onClick={openRecordModal}>+ Record Payment</SButton>
        </div>
      </div>

      <div className="page-body">
        {/* Stats Section */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr 1fr', gap: 20, marginBottom: 25 }}>
          <div className="card" style={{ background: 'linear-gradient(135deg, rgba(79,125,255,0.1) 0%, rgba(79,125,255,0.02) 100%)', border: '1px solid rgba(79,125,255,0.2)', padding: '20px' }}>
            <div style={{ fontSize: 11, color: 'var(--acc2)', fontWeight: 700, letterSpacing: 0.5, marginBottom: 4, textTransform: 'uppercase' }}>Cleared</div>
            <div style={{ fontSize: 24, fontWeight: 800 }}>{activeTab === 'cleared' ? payments.length : '—'}</div>
          </div>
          <div className="card" style={{ background: 'linear-gradient(135deg, rgba(46,204,138,0.1) 0%, rgba(46,204,138,0.02) 100%)', border: '1px solid rgba(46,204,138,0.2)', padding: '20px' }}>
            <div style={{ fontSize: 11, color: 'var(--grn)', fontWeight: 700, letterSpacing: 0.5, marginBottom: 4, textTransform: 'uppercase' }}>Collected</div>
            <div style={{ fontSize: 24, fontWeight: 800 }}>₹{payments.reduce((acc, p) => acc + (p.amount || 0), 0).toLocaleString('en-IN')}</div>
          </div>
          <div className="card" style={{ background: 'linear-gradient(135deg, rgba(245,166,35,0.1) 0%, rgba(245,166,35,0.02) 100%)', border: '1px solid rgba(245,166,35,0.2)', padding: '20px' }}>
            <div style={{ fontSize: 11, color: 'var(--amb)', fontWeight: 700, letterSpacing: 0.5, marginBottom: 4, textTransform: 'uppercase' }}>Pending Approval</div>
            <div style={{ fontSize: 24, fontWeight: 800 }}>{activeTab === 'pending_approval' ? payments.length : '—'}</div>
          </div>
          <div className="card" style={{ background: 'linear-gradient(135deg, rgba(226,75,74,0.1) 0%, rgba(226,75,74,0.02) 100%)', border: '1px solid rgba(226,75,74,0.2)', padding: '20px' }}>
            <div style={{ fontSize: 11, color: 'var(--red)', fontWeight: 700, letterSpacing: 0.5, marginBottom: 4, textTransform: 'uppercase' }}>Average</div>
            <div style={{ fontSize: 24, fontWeight: 800 }}>₹{payments.length > 0 ? Math.round(payments.reduce((acc, p) => acc + (p.amount || 0), 0) / payments.length).toLocaleString('en-IN') : 0}</div>
          </div>
        </div>

        {/* Filters */}
        <div style={{ marginBottom: 20, display: 'flex', gap: 10, alignItems: 'center' }}>
          <input className="finp" type="date" style={{ width: 'auto' }} value={filters.date} onChange={e => setFilters({ ...filters, date: e.target.value })} />
          <input className="finp" placeholder="Agent name..." style={{ width: 160 }} value={filters.agent} onChange={e => setFilters({ ...filters, agent: e.target.value })} />
          <input className="finp" placeholder="Account / Customer..." style={{ width: 200 }} value={filters.account} onChange={e => setFilters({ ...filters, account: e.target.value })} />
          <select className="finp" style={{ width: 'auto' }} value={filters.mode} onChange={e => setFilters({ ...filters, mode: e.target.value })}>
            <option value="">All Modes</option>
            {masterModes.map(m => <option key={m} value={m}>{m}</option>)}
          </select>
          <button className="btn dn" style={{ color: 'var(--red)', border: '1px solid rgba(226,75,74,0.3)' }} onClick={() => setFilters({ date: '', agent: '', account: '', mode: '' })}>Clear</button>
        </div>

        <div className="card" style={{ padding: 0, overflow: 'hidden', background: 'var(--bg2)', border: '1px solid var(--bdr)', borderRadius: 16 }}>
          <div style={{ overflowX: 'auto' }}>
            <table className="tbl" style={{ borderCollapse: 'collapse', width: '100%' }}>
              <thead>
                <tr style={{ background: 'rgba(255,255,255,0.02)', borderBottom: '1px solid var(--bdr)' }}>
                  <th style={{ padding: '14px 20px', color: 'var(--txt3)', fontSize: 10, textTransform: 'uppercase', letterSpacing: 1, textAlign: 'left' }}>Date</th>
                  <th style={{ padding: '14px 20px', color: 'var(--txt3)', fontSize: 10, textTransform: 'uppercase', letterSpacing: 1, textAlign: 'left' }}>Account Details</th>
                  <th style={{ padding: '14px 20px', color: 'var(--txt3)', fontSize: 10, textTransform: 'uppercase', letterSpacing: 1, textAlign: 'left' }}>Amount</th>
                  <th style={{ padding: '14px 20px', color: 'var(--txt3)', fontSize: 10, textTransform: 'uppercase', letterSpacing: 1, textAlign: 'left' }}>Mode</th>
                  <th style={{ padding: '14px 20px', color: 'var(--txt3)', fontSize: 10, textTransform: 'uppercase', letterSpacing: 1, textAlign: 'left' }}>Ref #</th>
                  <th style={{ padding: '14px 20px', color: 'var(--txt3)', fontSize: 10, textTransform: 'uppercase', letterSpacing: 1, textAlign: 'left' }}>Agent Info</th>
                  <th style={{ padding: '14px 20px', color: 'var(--txt3)', fontSize: 10, textTransform: 'uppercase', letterSpacing: 1, textAlign: 'left' }}>Status</th>
                  <th style={{ padding: '14px 20px', textAlign: 'right' }}></th>
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  Array.from({ length: 6 }).map((_, i) => (
                    <tr key={i} style={{ borderBottom: '1px solid var(--faint)' }}>
                      <td colSpan={8} style={{ padding: '15px 20px' }}><div className="skel" style={{ width: '100%', height: 20 }} /></td>
                    </tr>
                  ))
                ) : payments.length === 0 ? (
                  <tr><td colSpan={8} style={{ textAlign: 'center', padding: 60, color: 'var(--txt3)' }}>
                    <div style={{ fontSize: 40, marginBottom: 15, opacity: 0.2 }}>🔍</div>
                    <div style={{ fontSize: 14, fontWeight: 600 }}>No payments found</div>
                    <div style={{ fontSize: 12, opacity: 0.6 }}>Try adjusting your filters or record a new payment.</div>
                  </td></tr>
                ) : payments.map(p => (
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
                    <td className="mn" style={{ padding: '16px 20px', color: 'var(--txt3)', fontSize: 12 }}>{p.ref || '—'}</td>
                    <td style={{ padding: '16px 20px' }}>
                      <div style={{ fontSize: 12, color: 'var(--txt2)', fontWeight: 600 }}>{p.agent?.name}</div>
                    </td>
                    <td style={{ padding: '16px 20px' }}>
                      {p.flag === 'approved' && <span style={{ color: 'var(--grn)', fontSize: 11, fontWeight: 700 }}>✓ APPROVED</span>}
                      {p.flag === 'flagged' && <span style={{ color: 'var(--amb)', fontSize: 11, fontWeight: 700 }}>⚑ FLAGGED</span>}
                      {p.flag === 'rejected' && <span style={{ color: 'var(--red)', fontSize: 11, fontWeight: 700 }}>✕ REJECTED</span>}
                      {!p.flag && <span style={{ color: 'var(--txt3)', fontSize: 11 }}>PENDING</span>}
                    </td>
                    <td style={{ padding: '16px 20px', textAlign: 'right' }}>
                      <button className="btn sm" style={{ background: 'var(--bg3)', border: '1px solid var(--bdr)' }} onClick={() => openDetailModal(p)}>Details</button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Payments;
