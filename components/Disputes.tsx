"use client";
import React, { useState, useEffect } from 'react';
import { useApp } from '@/context/AppContext';

const Disputes = () => {
  const { openModal } = useApp();
  const [disputes, setDisputes] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchDisputes();
  }, []);

  const fetchDisputes = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/disputes');
      if (res.ok) {
        const data = await res.json();
        setDisputes(data);
      }
    } catch (e) {
      console.error(e);
    }
    setLoading(false);
  };

  return (
    <div id="pg-disputes" className="page on">
      <div className="ph">
        <div>
          <div className="ph-t">△ Disputes</div>
          <div className="ph-s">Customer dispute cases</div>
        </div>
        <div className="ph-ml">
          <button className="btn sm pr" onClick={() => openModal('New Dispute', <div>Dispute form logic here</div>)}>+ New Dispute</button>
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
                  <th>Type</th>
                  <th>Raised Date</th>
                  <th>Status</th>
                  <th>Agent</th>
                  <th>Escalated</th>
                  <th>Review</th>
                  <th>Action</th>
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  <tr><td colSpan={9} style={{ textAlign: 'center', padding: 20 }}>Loading...</td></tr>
                ) : disputes.map(d => (
                  <tr key={d.id}>
                    <td className="mn" style={{ color: 'var(--acc2)' }}>{d.account_no}</td>
                    <td className="nm">{d.customer_name}</td>
                    <td style={{ fontSize: 11, color: 'var(--txt)' }}>{d.type}</td>
                    <td className="mn">{d.raised_date}</td>
                    <td>
                      <span className={`pill ${d.status === 'open' ? 'op' : d.status === 'resolved' ? 'rsl' : 'pd'}`}>
                        {d.status}
                      </span>
                    </td>
                    <td style={{ fontSize: 11 }}>{d.agent_name}</td>
                    <td>{d.escalated ? <span className="badge red">Yes</span> : <span style={{ color: 'var(--txt3)' }}>No</span>}</td>
                    <td>
                      {d.flag === 'rejected' ? <span className="badge red">Rejected</span> : 
                       d.flag === 'approved' ? <span className="badge grn">Approved</span> : 
                       d.flag === 'flagged' ? <span className="badge amb" title={d.flag_comment}>Flagged</span> : 
                       <span style={{ color: 'var(--txt3)', fontSize: 11 }}>—</span>}
                    </td>
                    <td>
                      <button className="btn sm" onClick={() => openModal(`Edit Dispute`, <div>Edit Dispute logic here</div>)}>Review / Edit</button>
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

export default Disputes;
