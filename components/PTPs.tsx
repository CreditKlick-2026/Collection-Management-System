"use client";
import React, { useState, useEffect } from 'react';
import { useApp } from '@/context/AppContext';

const PTPs = () => {
  const { openModal } = useApp();
  const [ptps, setPtps] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchPtps();
  }, []);

  const fetchPtps = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/ptps');
      if (res.ok) {
        const data = await res.json();
        setPtps(data);
      }
    } catch (e) {
      console.error(e);
    }
    setLoading(false);
  };

  return (
    <div id="pg-ptp" className="page on">
      <div className="ph">
        <div>
          <div className="ph-t">₹ Promise to Pay</div>
          <div className="ph-s">PTP records and tracking</div>
        </div>
        <div className="ph-ml">
          <button className="btn sm pr" onClick={() => openModal('Promise to Pay', <div>Feature coming soon</div>)}>+ New PTP</button>
        </div>
      </div>
      <div className="page-body">
        <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
          <div style={{ overflowX: 'auto' }}>
            <table className="tbl">
              <thead>
                <tr>
                  <th>Account</th>
                  <th>Customer</th>
                  <th>Amount</th>
                  <th>PTP Date</th>
                  <th>Status</th>
                  <th>Agent</th>
                  <th>Created</th>
                  <th>Review</th>
                  <th>Action</th>
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  <tr><td colSpan={9} style={{ textAlign: 'center', padding: 20 }}>Loading...</td></tr>
                ) : ptps.map(p => (
                  <tr key={p.id}>
                    <td className="mn" style={{ color: 'var(--acc2)' }}>{p.account_no}</td>
                    <td className="nm">{p.customer_name}</td>
                    <td className="mn" style={{ color: 'var(--amb)' }}>₹{p.ptp_amount.toLocaleString()}</td>
                    <td className="mn">{p.ptp_date}</td>
                    <td>
                      <span className={`pill ${p.status === 'broken' ? 'ov' : p.status === 'kept' ? 'ac' : 'pd'}`}>
                        {p.status}
                      </span>
                    </td>
                    <td style={{ fontSize: 11 }}>{p.agent_name}</td>
                    <td style={{ fontSize: 11, color: 'var(--txt3)' }}>{p.created}</td>
                    <td>
                      {p.flag === 'rejected' ? <span className="badge red" title={p.rejection_reason}>Rejected</span> : 
                       p.flag === 'approved' ? <span className="badge grn">Approved</span> : 
                       p.flag === 'flagged' ? <span className="badge amb" title={p.flag_comment}>Flagged</span> : 
                       <span style={{ color: 'var(--txt3)', fontSize: 11 }}>—</span>}
                    </td>
                    <td>
                      <button className="btn sm" onClick={() => openModal(`Edit PTP`, <div>Edit PTP logic here</div>)}>Review / Edit</button>
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

export default PTPs;
