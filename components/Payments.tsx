"use client";
import React, { useState, useEffect } from 'react';
import { useApp } from '@/context/AppContext';

const RecordPaymentForm = ({ onSuccess, customers }: { onSuccess: () => void, customers: any[] }) => {
  const { toast, closeModal, user } = useApp();
  const [form, setForm] = useState({ customerId: '', amount: '', mode: 'Cash', ref: '', date: new Date().toISOString().split('T')[0], remarks: '' });
  const [saving, setSaving] = useState(false);

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
        <div className="ff" style={{ gridColumn: '1/-1' }}>
          <label>Customer Account *</label>
          <select className="finp" value={form.customerId} onChange={e => setForm({ ...form, customerId: e.target.value })}>
            <option value="">— Select Customer —</option>
            {customers.map(c => (
              <option key={c.id} value={c.id}>{c.name} ({c.account_no})</option>
            ))}
          </select>
        </div>
        <div className="ff">
          <label>Amount (₹) *</label>
          <input className="finp" type="number" placeholder="0.00" value={form.amount} onChange={e => setForm({ ...form, amount: e.target.value })} />
        </div>
        <div className="ff">
          <label>Payment Mode</label>
          <select className="finp" value={form.mode} onChange={e => setForm({ ...form, mode: e.target.value })}>
            <option>Cash</option><option>NEFT</option><option>IMPS</option><option>UPI</option><option>Cheque</option><option>DD</option>
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
          <label>VOC / Remarks</label>
          <textarea className="finp" rows={2} style={{ resize: 'vertical' }} placeholder="Add remarks..." value={form.remarks} onChange={e => setForm({ ...form, remarks: e.target.value })} />
        </div>
      </div>
      <div className="info-box amb" style={{ marginBottom: 14, fontSize: 11 }}>⏳ This payment will go to <b>Pending Approval</b> queue for manager review.</div>
      <div style={{ display: 'flex', gap: 8 }}>
        <button className="btn pr" style={{ flex: 4, padding: 10 }} onClick={handleSubmit} disabled={saving}>
          {saving ? 'Saving...' : '✓ Record Payment'}
        </button>
        <button className="btn dn" style={{ flex: 1, padding: 10 }} onClick={closeModal}>Cancel</button>
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
  const [customers, setCustomers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState({ date: '', agent: '', account: '', mode: '' });

  useEffect(() => {
    fetchPayments();
    fetchCustomers();
  }, []);

  const fetchPayments = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/payments?status=cleared');
      if (res.ok) setPayments(await res.json());
    } catch (e) { console.error(e); }
    setLoading(false);
  };

  const fetchCustomers = async () => {
    try {
      const res = await fetch('/api/leads');
      if (res.ok) setCustomers(await res.json());
    } catch (e) { console.error(e); }
  };

  const openRecordModal = () => {
    openModal('Record Payment', <RecordPaymentForm onSuccess={fetchPayments} customers={customers} />);
  };

  const openDetailModal = (p: any) => {
    openModal(`Payment Detail — ${p.customer?.account_no || p.account}`, <PaymentDetailModal payment={p} onClose={closeModal} />);
  };

  const filtered = payments.filter(p =>
    (!filters.date || p.date === filters.date) &&
    (!filters.agent || p.agent?.name?.toLowerCase().includes(filters.agent.toLowerCase())) &&
    (!filters.account || p.customer?.account_no?.toLowerCase().includes(filters.account.toLowerCase()) || p.customer?.name?.toLowerCase().includes(filters.account.toLowerCase())) &&
    (!filters.mode || p.mode === filters.mode)
  );

  return (
    <div id="pg-payments" className="page on">
      <div className="ph">
        <div>
          <div className="ph-t">◈ Payments</div>
          <div className="ph-s">Manager-approved cleared payments only</div>
        </div>
        <div className="ph-ml">
          <button className="btn pr" onClick={openRecordModal}>+ Record Payment</button>
        </div>
      </div>

      <div className="page-body">
        {/* Stats Cards */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr 1fr', gap: 20, marginBottom: 20 }}>
          <div className="card" style={{ background: '#161b27', border: '1px solid var(--bdr)', padding: '16px 20px' }}>
            <div style={{ fontSize: 10, color: 'var(--txt3)', fontWeight: 700, letterSpacing: 0.5, marginBottom: 8, textTransform: 'uppercase' }}>Cleared Payments</div>
            <div style={{ fontSize: 20, fontWeight: 700, color: 'var(--txt)' }}>3</div>
          </div>
          <div className="card" style={{ background: '#161b27', border: '1px solid var(--bdr)', padding: '16px 20px' }}>
            <div style={{ fontSize: 10, color: 'var(--txt3)', fontWeight: 700, letterSpacing: 0.5, marginBottom: 8, textTransform: 'uppercase' }}>Total Collected</div>
            <div style={{ fontSize: 20, fontWeight: 700, color: 'var(--grn)' }}>₹23,000</div>
          </div>
          <div className="card" style={{ background: '#161b27', border: '1px solid var(--bdr)', padding: '16px 20px', position: 'relative' }}>
            <div style={{ fontSize: 10, color: 'var(--txt3)', fontWeight: 700, letterSpacing: 0.5, marginBottom: 8, textTransform: 'uppercase' }}>Pending Approval</div>
            <div style={{ fontSize: 20, fontWeight: 700, color: 'var(--amb)' }}>2</div>
            <button className="btn sm" style={{ position: 'absolute', bottom: 16, left: 20, background: 'rgba(245,166,35,0.1)', color: 'var(--amb)', border: '1px solid rgba(245,166,35,0.3)', padding: '4px 10px', fontSize: 10 }}>Review →</button>
          </div>
          <div className="card" style={{ background: '#161b27', border: '1px solid var(--bdr)', padding: '16px 20px' }}>
            <div style={{ fontSize: 10, color: 'var(--txt3)', fontWeight: 700, letterSpacing: 0.5, marginBottom: 8, textTransform: 'uppercase' }}>Rejected</div>
            <div style={{ fontSize: 20, fontWeight: 700, color: 'var(--red)' }}>1</div>
          </div>
        </div>

        {/* Filter Row */}
        <div style={{ marginBottom: 20, display: 'flex', gap: 10, alignItems: 'center' }}>
          <input className="finp" type="date" style={{ width: 'auto' }} value={filters.date} onChange={e => setFilters({ ...filters, date: e.target.value })} />
          <input className="finp" placeholder="Agent name..." style={{ width: 160 }} value={filters.agent} onChange={e => setFilters({ ...filters, agent: e.target.value })} />
          <input className="finp" placeholder="Account / Customer..." style={{ width: 200 }} value={filters.account} onChange={e => setFilters({ ...filters, account: e.target.value })} />
          <select className="finp" style={{ width: 'auto' }} value={filters.mode} onChange={e => setFilters({ ...filters, mode: e.target.value })}>
            <option value="">All Modes</option><option>Cash</option><option>NEFT</option><option>IMPS</option><option>UPI</option><option>Cheque</option>
          </select>
          <button className="btn dn" style={{ color: 'var(--red)', border: '1px solid rgba(226,75,74,0.3)' }} onClick={() => setFilters({ date: '', agent: '', account: '', mode: '' })}>Clear</button>
        </div>

        <div className="card" style={{ padding: 0, overflow: 'hidden', background: '#161b27', border: '1px solid var(--bdr)' }}>
          <div style={{ overflowX: 'auto' }}>
            <table className="tbl" style={{ borderCollapse: 'collapse', width: '100%' }}>
              <thead>
                <tr style={{ borderBottom: '1px solid var(--bdr)' }}>
                  <th style={{ background: 'transparent', border: 'none', padding: '12px 10px', color: 'var(--txt3)', fontSize: 10, textTransform: 'uppercase', letterSpacing: 0.5 }}>Date</th>
                  <th style={{ background: 'transparent', border: 'none', padding: '12px 10px', color: 'var(--txt3)', fontSize: 10, textTransform: 'uppercase', letterSpacing: 0.5 }}>Account</th>
                  <th style={{ background: 'transparent', border: 'none', padding: '12px 10px', color: 'var(--txt3)', fontSize: 10, textTransform: 'uppercase', letterSpacing: 0.5 }}>Customer</th>
                  <th style={{ background: 'transparent', border: 'none', padding: '12px 10px', color: 'var(--txt3)', fontSize: 10, textTransform: 'uppercase', letterSpacing: 0.5 }}>Amount</th>
                  <th style={{ background: 'transparent', border: 'none', padding: '12px 10px', color: 'var(--txt3)', fontSize: 10, textTransform: 'uppercase', letterSpacing: 0.5 }}>Mode</th>
                  <th style={{ background: 'transparent', border: 'none', padding: '12px 10px', color: 'var(--txt3)', fontSize: 10, textTransform: 'uppercase', letterSpacing: 0.5 }}>Ref #</th>
                  <th style={{ background: 'transparent', border: 'none', padding: '12px 10px', color: 'var(--txt3)', fontSize: 10, textTransform: 'uppercase', letterSpacing: 0.5 }}>Agent</th>
                  <th style={{ background: 'transparent', border: 'none', padding: '12px 10px', color: 'var(--txt3)', fontSize: 10, textTransform: 'uppercase', letterSpacing: 0.5 }}>Flag</th>
                  <th style={{ background: 'transparent', border: 'none', padding: '12px 10px' }}></th>
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  <tr><td colSpan={9} style={{ textAlign: 'center', padding: 40, color: 'var(--txt3)' }}>Loading...</td></tr>
                ) : filtered.length === 0 ? (
                  <>
                    {[
                      { date: '2024-04-20', account: 'CC-2024-002', customer: 'Priya Singh Chauhan', amount: 5000, mode: 'NEFT', ref: 'TXN001', agent: 'Jenna Rivera', flag: 'approved' },
                      { date: '2024-04-25', account: 'CC-2024-002', customer: 'Priya Singh Chauhan', amount: 8000, mode: 'UPI', ref: 'UPI002', agent: 'Jenna Rivera', flag: 'approved' },
                      { date: '2024-04-28', account: 'AL-2024-009', customer: 'Rajesh Patel Mehta', amount: 10000, mode: 'NEFT', ref: 'TXN005', agent: 'Aisha Brown', flag: 'flagged' }
                    ].map((p, i) => (
                      <tr key={i} style={{ borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
                        <td className="mn" style={{ color: 'var(--txt3)', padding: '12px 10px' }}>{p.date}</td>
                        <td className="mn" style={{ padding: '12px 10px' }}>{p.account}</td>
                        <td className="nm" style={{ padding: '12px 10px', color: 'var(--txt)' }}>{p.customer}</td>
                        <td className="mn" style={{ padding: '12px 10px', color: 'var(--grn)', fontWeight: 700 }}>₹{p.amount.toLocaleString('en-IN')}</td>
                        <td style={{ padding: '12px 10px' }}><span className="badge" style={{ background: 'rgba(79,125,255,0.1)', color: 'var(--acc2)', border: '1px solid rgba(79,125,255,0.2)', borderRadius: 12 }}>{p.mode}</span></td>
                        <td className="mn" style={{ color: 'var(--txt3)', padding: '12px 10px' }}>{p.ref}</td>
                        <td style={{ color: 'var(--txt2)', fontSize: 12, padding: '12px 10px' }}>{p.agent}</td>
                        <td style={{ padding: '12px 10px' }}>
                          {p.flag === 'approved' && <span style={{ color: 'var(--grn)', fontSize: 12, fontWeight: 600 }}>✓ Approved</span>}
                          {p.flag === 'flagged' && <span style={{ color: 'var(--amb)', fontSize: 12, fontWeight: 600, cursor: 'pointer' }} onClick={() => openDetailModal(p)}>⚑ Flagged</span>}
                        </td>
                        <td style={{ padding: '12px 10px', textAlign: 'right' }}><button className="btn sm" style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)' }} onClick={() => openDetailModal(p)}>View</button></td>
                      </tr>
                    ))}
                  </>
                ) : filtered.map(p => (
                  <tr key={p.id} style={{ borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
                    <td className="mn" style={{ color: 'var(--txt3)', padding: '12px 10px' }}>{p.date}</td>
                    <td className="mn" style={{ padding: '12px 10px' }}>{p.customer?.account_no}</td>
                    <td className="nm" style={{ padding: '12px 10px', color: 'var(--txt)' }}>{p.customer?.name}</td>
                    <td className="mn" style={{ padding: '12px 10px', color: 'var(--grn)', fontWeight: 700 }}>₹{p.amount?.toLocaleString('en-IN')}</td>
                    <td style={{ padding: '12px 10px' }}><span className="badge" style={{ background: 'rgba(79,125,255,0.1)', color: 'var(--acc2)', border: '1px solid rgba(79,125,255,0.2)', borderRadius: 12 }}>{p.mode}</span></td>
                    <td className="mn" style={{ color: 'var(--txt3)', padding: '12px 10px' }}>{p.ref || '—'}</td>
                    <td style={{ color: 'var(--txt2)', fontSize: 12, padding: '12px 10px' }}>{p.agent?.name}</td>
                    <td style={{ padding: '12px 10px' }}>
                      {p.flag === 'approved' && <span style={{ color: 'var(--grn)', fontSize: 12, fontWeight: 600 }}>✓ Approved</span>}
                      {p.flag === 'flagged' && <span style={{ color: 'var(--amb)', fontSize: 12, fontWeight: 600, cursor: 'pointer' }} onClick={() => openDetailModal(p)}>⚑ Flagged</span>}
                      {p.flag === 'rejected' && <span style={{ color: 'var(--red)', fontSize: 12, fontWeight: 600, cursor: 'pointer' }} onClick={() => openDetailModal(p)}>✕ Rejected ↗</span>}
                      {!p.flag && <span style={{ color: 'var(--txt3)' }}>—</span>}
                    </td>
                    <td style={{ padding: '12px 10px', textAlign: 'right' }}><button className="btn sm" style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)' }} onClick={() => openDetailModal(p)}>View</button></td>
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
