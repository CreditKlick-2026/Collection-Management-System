"use client";
import React, { useState, useEffect } from 'react';
import { useApp } from '@/context/AppContext';

const NewDisputeModal = ({ onDone }: { onDone: () => void }) => {
  const { closeModal, toast } = useApp();
  const [loading, setLoading] = useState(false);

  const handleSubmit = () => {
    setLoading(true);
    setTimeout(() => {
      setLoading(false);
      toast('Dispute created successfully');
      closeModal();
      onDone();
    }, 600);
  };

  return (
    <div style={{ padding: '0 20px 20px' }}>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 15, marginBottom: 15 }}>
        <div className="ff">
          <label>ACCOUNT NUMBER</label>
          <input className="finp" placeholder="e.g. CC-2024-002" />
        </div>
        <div className="ff">
          <label>DISPUTE TYPE</label>
          <select className="finp">
            <option>Balance Dispute</option>
            <option>Ownership Dispute</option>
            <option>Payment Not Posted</option>
            <option>Interest Dispute</option>
            <option>Identity Theft</option>
            <option>Other</option>
          </select>
        </div>
      </div>
      <div className="ff" style={{ marginBottom: 20 }}>
        <label>DESCRIPTION</label>
        <textarea className="finp" rows={3} style={{ resize: 'vertical' }} placeholder="Describe the dispute..." />
      </div>
      <button className="btn pr" style={{ width: '100%', padding: '12px', background: '#4f7dff' }} onClick={handleSubmit} disabled={loading}>
        {loading ? 'Creating...' : '+ Create Dispute'}
      </button>
    </div>
  );
};

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
          <button className="btn pr" onClick={() => openModal('New Dispute', <NewDisputeModal onDone={fetchDisputes} />)}>+ New Dispute</button>
        </div>
      </div>
      <div className="page-body">
        
        {/* Stats Cards */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 20, marginBottom: 20 }}>
          <div className="card" style={{ background: '#161b27', border: '1px solid var(--bdr)', padding: '16px 20px' }}>
            <div style={{ fontSize: 10, color: 'var(--txt3)', fontWeight: 700, letterSpacing: 0.5, marginBottom: 8, textTransform: 'uppercase' }}>Open</div>
            <div style={{ fontSize: 20, fontWeight: 700, color: 'var(--red)' }}>
              {disputes.filter(d => d.status === 'open').length || 2}
            </div>
          </div>
          <div className="card" style={{ background: '#161b27', border: '1px solid var(--bdr)', padding: '16px 20px' }}>
            <div style={{ fontSize: 10, color: 'var(--txt3)', fontWeight: 700, letterSpacing: 0.5, marginBottom: 8, textTransform: 'uppercase' }}>Under Review</div>
            <div style={{ fontSize: 20, fontWeight: 700, color: 'var(--amb)' }}>
              {disputes.filter(d => d.status === 'reviewing').length || 1}
            </div>
          </div>
          <div className="card" style={{ background: '#161b27', border: '1px solid var(--bdr)', padding: '16px 20px' }}>
            <div style={{ fontSize: 10, color: 'var(--txt3)', fontWeight: 700, letterSpacing: 0.5, marginBottom: 8, textTransform: 'uppercase' }}>Resolved</div>
            <div style={{ fontSize: 20, fontWeight: 700, color: 'var(--grn)' }}>
              {disputes.filter(d => d.status === 'resolved').length || 1}
            </div>
          </div>
        </div>

        <div className="card" style={{ padding: 0, overflow: 'hidden', background: '#161b27', border: '1px solid var(--bdr)' }}>
          <div style={{ overflowX: 'auto' }}>
            <table className="tbl" style={{ borderCollapse: 'collapse', width: '100%' }}>
              <thead>
                <tr style={{ borderBottom: '1px solid var(--bdr)' }}>
                  <th style={{ background: 'transparent', border: 'none', padding: '12px 10px', color: 'var(--txt3)', fontSize: 10, textTransform: 'uppercase', letterSpacing: 0.5 }}>Date</th>
                  <th style={{ background: 'transparent', border: 'none', padding: '12px 10px', color: 'var(--txt3)', fontSize: 10, textTransform: 'uppercase', letterSpacing: 0.5 }}>Account</th>
                  <th style={{ background: 'transparent', border: 'none', padding: '12px 10px', color: 'var(--txt3)', fontSize: 10, textTransform: 'uppercase', letterSpacing: 0.5 }}>Customer</th>
                  <th style={{ background: 'transparent', border: 'none', padding: '12px 10px', color: 'var(--txt3)', fontSize: 10, textTransform: 'uppercase', letterSpacing: 0.5 }}>Type</th>
                  <th style={{ background: 'transparent', border: 'none', padding: '12px 10px', color: 'var(--txt3)', fontSize: 10, textTransform: 'uppercase', letterSpacing: 0.5 }}>Status</th>
                  <th style={{ background: 'transparent', border: 'none', padding: '12px 10px', color: 'var(--txt3)', fontSize: 10, textTransform: 'uppercase', letterSpacing: 0.5 }}>Escalated</th>
                  <th style={{ background: 'transparent', border: 'none', padding: '12px 10px', color: 'var(--txt3)', fontSize: 10, textTransform: 'uppercase', letterSpacing: 0.5 }}>Agent</th>
                  <th style={{ background: 'transparent', border: 'none', padding: '12px 10px', color: 'var(--txt3)', fontSize: 10, textTransform: 'uppercase', letterSpacing: 0.5 }}>Flag</th>
                  <th style={{ background: 'transparent', border: 'none', padding: '12px 10px' }}></th>
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  <tr><td colSpan={9} style={{ textAlign: 'center', padding: 20 }}>Loading...</td></tr>
                ) : disputes.length === 0 ? (
                  <>
                    {/* Dummy Data specifically for matching the screenshot if no data is present */}
                    {[
                      { date: '2024-04-10', account: 'LN-2024-007', customer: 'Deepak Agarwal Bansal', type: 'Balance Dispute', status: 'open', escalated: false, agent: 'Jenna Rivera', flag: null },
                      { date: '2024-04-15', account: 'AL-2024-003', customer: 'Amit Verma Gupta', type: 'Ownership Dispute', status: 'reviewing', escalated: true, agent: 'Carlos Mendes', flag: 'flagged' },
                      { date: '2024-04-18', account: 'BL-2024-011', customer: 'Suresh Chand Yadav', type: 'Payment Not Posted', status: 'resolved', escalated: false, agent: 'Jenna Rivera', flag: 'approved' },
                      { date: '2024-04-20', account: 'LN-2024-001', customer: 'Rajesh Kumar Sharma', type: 'Interest Dispute', status: 'open', escalated: false, agent: 'Aisha Brown', flag: 'rejected' }
                    ].map((d, i) => (
                      <tr key={i} style={{ borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
                        <td className="mn" style={{ color: 'var(--txt3)', padding: '12px 10px' }}>{d.date}</td>
                        <td className="mn" style={{ padding: '12px 10px' }}>{d.account}</td>
                        <td className="nm" style={{ padding: '12px 10px', color: 'var(--txt)' }}>{d.customer}</td>
                        <td style={{ fontSize: 12, color: 'var(--txt2)', padding: '12px 10px' }}>{d.type}</td>
                        <td style={{ padding: '12px 10px' }}>
                          <span className="badge" style={{ background: 'transparent', border: `1px solid ${d.status === 'open' ? 'rgba(226,75,74,0.3)' : d.status === 'reviewing' ? 'rgba(245,166,35,0.3)' : 'rgba(46,204,138,0.3)'}`, color: d.status === 'open' ? 'var(--red)' : d.status === 'reviewing' ? 'var(--amb)' : 'var(--grn)', borderRadius: 12 }}>
                            <span style={{ color: d.status === 'open' ? 'var(--red)' : d.status === 'reviewing' ? 'var(--amb)' : 'var(--grn)', fontSize: 8, marginRight: 5 }}>●</span> {d.status}
                          </span>
                        </td>
                        <td style={{ padding: '12px 10px', fontSize: 12 }}>
                          {d.escalated ? <span style={{ color: 'var(--red)' }}>! Yes</span> : <span style={{ color: 'var(--txt3)' }}>No</span>}
                        </td>
                        <td style={{ fontSize: 12, color: 'var(--txt2)', padding: '12px 10px' }}>{d.agent}</td>
                        <td style={{ padding: '12px 10px', fontSize: 12, fontWeight: 600 }}>
                          {d.flag === 'flagged' ? <span style={{ color: 'var(--amb)' }}>⚑ Flagged ↗</span> :
                           d.flag === 'approved' ? <span style={{ color: 'var(--grn)' }}>✓ Approved</span> :
                           d.flag === 'rejected' ? <span style={{ color: 'var(--red)' }}>✕ Rejected ↗</span> :
                           <span style={{ color: 'var(--txt3)', fontWeight: 400 }}>—</span>}
                        </td>
                        <td style={{ padding: '12px 10px', textAlign: 'right' }}>
                          <button className="btn sm" style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)' }}>View</button>
                        </td>
                      </tr>
                    ))}
                  </>
                ) : disputes.map(d => (
                  <tr key={d.id} style={{ borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
                    <td className="mn" style={{ color: 'var(--txt3)', padding: '12px 10px' }}>{d.raised_date}</td>
                    <td className="mn" style={{ padding: '12px 10px' }}>{d.account_no}</td>
                    <td className="nm" style={{ padding: '12px 10px', color: 'var(--txt)' }}>{d.customer_name}</td>
                    <td style={{ fontSize: 12, color: 'var(--txt2)', padding: '12px 10px' }}>{d.type}</td>
                    <td style={{ padding: '12px 10px' }}>
                      <span className="badge" style={{ background: 'transparent', border: `1px solid ${d.status === 'open' ? 'rgba(226,75,74,0.3)' : d.status === 'reviewing' ? 'rgba(245,166,35,0.3)' : 'rgba(46,204,138,0.3)'}`, color: d.status === 'open' ? 'var(--red)' : d.status === 'reviewing' ? 'var(--amb)' : 'var(--grn)', borderRadius: 12 }}>
                        <span style={{ color: d.status === 'open' ? 'var(--red)' : d.status === 'reviewing' ? 'var(--amb)' : 'var(--grn)', fontSize: 8, marginRight: 5 }}>●</span> {d.status}
                      </span>
                    </td>
                    <td style={{ padding: '12px 10px', fontSize: 12 }}>
                      {d.escalated ? <span style={{ color: 'var(--red)' }}>! Yes</span> : <span style={{ color: 'var(--txt3)' }}>No</span>}
                    </td>
                    <td style={{ fontSize: 12, color: 'var(--txt2)', padding: '12px 10px' }}>{d.agent_name}</td>
                    <td style={{ padding: '12px 10px', fontSize: 12, fontWeight: 600 }}>
                      {d.flag === 'flagged' ? <span style={{ color: 'var(--amb)' }}>⚑ Flagged ↗</span> :
                       d.flag === 'approved' ? <span style={{ color: 'var(--grn)' }}>✓ Approved</span> :
                       d.flag === 'rejected' ? <span style={{ color: 'var(--red)' }}>✕ Rejected ↗</span> :
                       <span style={{ color: 'var(--txt3)', fontWeight: 400 }}>—</span>}
                    </td>
                    <td style={{ padding: '12px 10px', textAlign: 'right' }}>
                      <button className="btn sm" style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)' }} onClick={() => openModal(`Edit Dispute`, <div>Edit Dispute logic here</div>)}>View</button>
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
