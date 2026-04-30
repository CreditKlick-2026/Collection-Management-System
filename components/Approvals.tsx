"use client";
import React, { useState, useEffect } from 'react';

const Approvals = () => {
  const [pending, setPending] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchPending();
  }, []);

  const fetchPending = async () => {
    const res = await fetch('/api/payments?status=pending_approval');
    const data = await res.json();
    setPending(data);
    setLoading(false);
  };

  const handleAction = async (id: number, status: string) => {
    await fetch('/api/payments', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id, status })
    });
    fetchPending();
  };

  return (
    <div className="page on">
      <div className="ph" style={{ padding: '12px 16px 10px', borderBottom: '1px solid var(--bdr)', background: 'var(--bg2)', display: 'flex', alignItems: 'center', gap: 10 }}>
        <div><div className="ph-t" style={{ fontSize: 14, fontWeight: 600 }}>⏳ Approvals</div><div className="ph-s" style={{ fontSize: 11, color: 'var(--txt3)' }}>Payments awaiting manager review</div></div>
      </div>

      <div className="page-body" style={{ flex: 1, overflowY: 'auto', padding: 16 }}>
        <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
          <table className="tbl">
            <thead>
              <tr>
                <th>Date</th>
                <th>Customer</th>
                <th>Amount</th>
                <th>Agent</th>
                <th>Remarks</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr><td colSpan={6} style={{ textAlign: 'center', padding: 40 }}>Loading...</td></tr>
              ) : pending.length === 0 ? (
                <tr><td colSpan={6} style={{ textAlign: 'center', padding: 40, color: 'var(--txt3)' }}>No pending approvals</td></tr>
              ) : pending.map(p => (
                <tr key={p.id}>
                  <td className="mn">{p.date}</td>
                  <td className="nm">{p.customer?.name}</td>
                  <td className="mn" style={{ color: 'var(--grn)' }}>₹{p.amount?.toLocaleString('en-IN')}</td>
                  <td>{p.agent?.name}</td>
                  <td style={{ fontSize: 11, color: 'var(--txt3)' }}>{p.remarks}</td>
                  <td>
                    <div style={{ display: 'flex', gap: 5 }}>
                      <button className="btn sm gn" onClick={() => handleAction(p.id, 'cleared')}>Approve</button>
                      <button className="btn sm dn" onClick={() => handleAction(p.id, 'rejected')}>Reject</button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default Approvals;
