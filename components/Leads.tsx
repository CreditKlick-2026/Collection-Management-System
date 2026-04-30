"use client";
import React, { useState, useEffect } from 'react';
import { useApp } from '@/context/AppContext';

const DISPOSITION_LOGIC: Record<string, Record<string, any[]>> = {
  "Right Party Connect": {
    "Customer Refused to Pay": [
      { name: "Financial Issue - Job Loss" },
      { name: "Financial Issue - Business Loss" },
      { name: "Financial Issue - Others" },
      { name: "Financial Issue - Medical Condition" },
      { name: "Dispute - Card No Usages" },
      { name: "Dispute - Card Not Received" },
      { name: "Dispute - Charges Related Issue" },
      { name: "Dispute - Fraud and Others" },
      { name: "Dispute - False Commitment" },
      { name: "Not Ready to Disclose" },
      { name: "Not Ready to Listen" },
    ],
    "Promised to Pay": [
      { name: "Full Outstanding Amount", date: true, amount: true },
      { name: "Minimum Amount", date: true, amount: true },
      { name: "Partial Amount", date: true, amount: true },
      { name: "Customer Wants Settlement", date: true, amount: true, settlement: true },
    ],
    "Follow-Up": [
      { name: "Requested for Waiver", date: true },
      { name: "Asking for some time", date: true },
      { name: "Requested for Statement", date: true },
      { name: "Call Back", date: true },
    ],
    "Customer Visit at Branch": [
      { name: "Customer Visit at Branch", date: true, amount: true }
    ]
  },
  "Third Party Connect": {
    "Customer Not Available": [
      { name: "Out of Country" },
      { name: "Out of City" },
      { name: "Customer Hospitalized" },
      { name: "Not Ready to Disclosed" },
      { name: "Not Ready to Listen" },
      { name: "Customer Deceased" }
    ],
    "Follow-up": [
      { name: "Call Back", date: true }
    ]
  },
  "Wrong Party Connect": {
    "Invalid Contact Number": []
  },
  "Not Connected": {
    "Wrong Number": [],
    "Incorrect Number": [],
    "Switched Off": [],
    "Ringing No Response": [],
    "IVR Call": [],
    "Temporary Out of Service": [],
    "Call Not Connected": []
  }
};

const EditLeadModal = ({ lead, onDone }: { lead: any, onDone: () => void }) => {
  const { closeModal, toast } = useApp();
  const [loading, setLoading] = useState(false);
  const [connectStatus, setConnectStatus] = useState('');
  const [disposition, setDisposition] = useState('');
  const [subDisposition, setSubDisposition] = useState('');

  const [date, setDate] = useState('');
  const [amount, setAmount] = useState('');
  const [settlement, setSettlement] = useState('');
  const [callDrop, setCallDrop] = useState('No');
  const [altNumber, setAltNumber] = useState('');
  const [remarks, setRemarks] = useState('');

  const dispositions = connectStatus && DISPOSITION_LOGIC[connectStatus] ? Object.keys(DISPOSITION_LOGIC[connectStatus]) : [];
  const subDispositions = connectStatus && disposition && DISPOSITION_LOGIC[connectStatus][disposition] ? DISPOSITION_LOGIC[connectStatus][disposition] : [];
  const activeLogic = subDispositions.find(s => s.name === subDisposition) || {};

  // Reset dependent fields when parent changes
  useEffect(() => { setDisposition(''); setSubDisposition(''); }, [connectStatus]);
  useEffect(() => { setSubDisposition(''); }, [disposition]);

  const handleSubmit = () => {
    if (!connectStatus || !disposition) { toast('Please select Connect Status and Disposition'); return; }
    setLoading(true);
    setTimeout(() => {
      setLoading(false);
      toast('Lead disposition updated successfully');
      closeModal();
      onDone();
    }, 600);
  };

  const showAltNumber = ['Right Party Connect', 'Third Party Connect', 'Wrong Party Connect'].includes(connectStatus);

  return (
    <div style={{ padding: '0 20px 20px' }}>
      <div style={{ background: 'rgba(79,125,255,0.08)', border: '1px solid rgba(79,125,255,0.2)', padding: '12px 16px', borderRadius: 8, marginBottom: 20, color: 'var(--acc2)', fontSize: 13 }}>
        Updating Disposition for: <b>{lead?.name}</b> <span style={{ color: 'var(--txt3)' }}>·</span> <b>{lead?.account_no}</b>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 15, marginBottom: 15 }}>
        <div className="ff">
          <label>CONNECT STATUS *</label>
          <select className="finp" value={connectStatus} onChange={e => setConnectStatus(e.target.value)}>
            <option value="">— Select —</option>
            {Object.keys(DISPOSITION_LOGIC).map(k => <option key={k} value={k}>{k}</option>)}
          </select>
        </div>
        <div className="ff">
          <label>DISPOSITION *</label>
          <select className="finp" value={disposition} onChange={e => setDisposition(e.target.value)} disabled={!dispositions.length}>
            <option value="">— Select —</option>
            {dispositions.map(k => <option key={k} value={k}>{k}</option>)}
          </select>
        </div>
        <div className="ff">
          <label>SUB DISPOSITION</label>
          <select className="finp" value={subDisposition} onChange={e => setSubDisposition(e.target.value)} disabled={!subDispositions.length}>
            <option value="">— Select —</option>
            {subDispositions.map((s:any) => <option key={s.name} value={s.name}>{s.name}</option>)}
          </select>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 15, marginBottom: 15 }}>
        {activeLogic.date && (
          <div className="ff">
            <label>ACTION DATE</label>
            <input className="finp" type="date" value={date} onChange={e => setDate(e.target.value)} />
          </div>
        )}
        {activeLogic.amount && (
          <div className="ff">
            <label>AMOUNT (₹)</label>
            <input className="finp" type="number" placeholder="0" value={amount} onChange={e => setAmount(e.target.value)} />
          </div>
        )}
        {activeLogic.settlement && (
          <div className="ff">
            <label>SETTLEMENT AMOUNT (₹)</label>
            <input className="finp" type="number" placeholder="0" value={settlement} onChange={e => setSettlement(e.target.value)} />
          </div>
        )}
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 15, marginBottom: 20 }}>
        {showAltNumber && (
          <div className="ff">
            <label>CALL DROP?</label>
            <select className="finp" value={callDrop} onChange={e => setCallDrop(e.target.value)}>
              <option value="No">No</option>
              <option value="Yes">Yes</option>
            </select>
          </div>
        )}
        {showAltNumber && (
          <div className="ff">
            <label>ALTERNATE NUMBER</label>
            <input className="finp" placeholder="Enter alternate mobile..." value={altNumber} onChange={e => setAltNumber(e.target.value)} />
          </div>
        )}
      </div>

      <div className="ff" style={{ marginBottom: 25 }}>
        <label>REMARKS / CALL NOTES *</label>
        <textarea className="finp" rows={3} style={{ resize: 'vertical' }} placeholder="Enter detailed interaction notes..." value={remarks} onChange={e => setRemarks(e.target.value)} />
      </div>

      <button className="btn pr" style={{ width: '100%', padding: '12px', background: '#4f7dff' }} onClick={handleSubmit} disabled={loading}>
        {loading ? 'Saving...' : '✓ Save Disposition'}
      </button>
    </div>
  );
};

const Leads = () => {
  const { openModal } = useApp();
  const [leads, setLeads] = useState<any[]>([]);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);
  const [selectedLead, setSelectedLead] = useState<any>(null);
  const [filterTab, setFilterTab] = useState('all');
  const [showFilters, setShowFilters] = useState(false);

  useEffect(() => {
    fetchLeads();
  }, [search]);

  const fetchLeads = async () => {
    setLoading(true);
    const res = await fetch(`/api/leads?q=${search}`);
    const data = await res.json();
    setLeads(data);
    if (data.length > 0 && !selectedLead) setSelectedLead(data[0]);
    setLoading(false);
  };

  return (
    <div id="pg-leads" className="page on">
      <div className="leads-outer">
        {/* CUSTOMER DASHBOARD HEADER */}
        <div id="custDash" className={`cust-dash ${selectedLead ? 'filled' : 'empty'}`} style={{ padding: '20px', background: '#161b27', borderBottom: '1px solid var(--bdr)' }}>
          {!selectedLead ? (
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, color: 'var(--txt3)' }}><div style={{ fontSize: '20px', opacity: 0.5 }}>◉</div><div>Search and select a customer below to view details</div></div>
          ) : (
            <div>
              {/* Top Row: Avatar, Name, Buttons */}
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 20 }}>
                <div style={{ display: 'flex', gap: 14, alignItems: 'center' }}>
                  <div className="av" style={{ width: 48, height: 48, fontSize: 18, background: 'rgba(79,125,255,0.1)', color: 'var(--acc2)', border: '1px solid rgba(79,125,255,0.3)', borderRadius: '50%' }}>
                    {selectedLead.name?.split(' ').map((n:any)=>n[0]).join('').substring(0,2)}
                  </div>
                  <div>
                    <div style={{ fontSize: 18, fontWeight: 700, color: 'var(--txt)', marginBottom: 4 }}>{selectedLead.name}</div>
                    <div style={{ fontSize: 12, color: 'var(--txt3)' }}>
                      {selectedLead.account_no} - {selectedLead.product || 'Personal Loan'} - {selectedLead.bank || 'HDFC Bank'}
                    </div>
                  </div>
                </div>
                <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                  <span className="badge" style={{ background: 'rgba(139,92,246,0.1)', color: 'var(--pur)', border: '1px solid rgba(139,92,246,0.3)', borderRadius: 12, padding: '4px 10px' }}><span style={{ fontSize: 8, marginRight: 4 }}>●</span> {selectedLead.status}</span>
                  <span className="badge" style={{ background: 'rgba(139,92,246,0.1)', color: 'var(--pur)', border: '1px solid rgba(139,92,246,0.3)', borderRadius: 12, padding: '4px 10px', marginRight: 8 }}>{selectedLead.portfolio?.name || 'Retail'}</span>
                  <button className="btn sm pr" style={{ background: '#4f7dff', border: 'none', padding: '6px 14px' }} onClick={() => openModal('Edit Disposition', <EditLeadModal lead={selectedLead} onDone={fetchLeads} />)}>✎ Edit</button>
                  <button className="btn sm" style={{ background: 'transparent', border: '1px solid var(--bdr)', color: 'var(--red)', padding: '6px 12px' }}>📞 Call Log</button>
                  <button className="btn sm" style={{ background: 'transparent', border: '1px solid var(--bdr)', color: 'var(--amb)', padding: '6px 12px' }}>₹ PTP</button>
                  <button className="btn sm" style={{ background: 'transparent', border: '1px solid var(--bdr)', color: 'var(--grn)', padding: '6px 12px' }}>💳 Payment</button>
                  <button className="btn sm" style={{ background: 'transparent', border: '1px solid var(--bdr)', color: 'var(--pur)', padding: '6px 12px' }}>👤 Assign</button>
                </div>
              </div>

              {/* Grid Info Boxes */}
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 10 }}>
                {[
                  { label: 'ACCOUNT NUMBER', value: selectedLead.account_no },
                  { label: 'MOBILE NUMBER', value: selectedLead.mobile },
                  { label: 'ALT MOBILE', value: '8612345678' },
                  { label: 'EMAIL', value: selectedLead.email || 'customer@gmail.com', style: { textTransform: 'lowercase' } },
                  { label: 'PAN NUMBER', value: selectedLead.pan || 'MNOPC3456P' },
                  { label: 'PRODUCT TYPE', value: selectedLead.product || 'Business Loan', isText: true },
                  { label: 'BANK / LENDER', value: selectedLead.bank || 'SBI', isText: true },
                  { label: 'OUTSTANDING AMOUNT', value: `₹${(selectedLead.outstanding || 0).toLocaleString('en-IN')}`, color: 'var(--red)' },
                  { label: 'DAYS PAST DUE', value: `${selectedLead.dpd || 0}d`, color: 'var(--red)' },
                  { label: 'STATUS', value: selectedLead.status, isText: true }
                ].map((item, i) => (
                  <div key={i} style={{ background: '#1e2433', padding: '12px 14px', borderRadius: 6, minWidth: 120, flex: '1 1 auto', border: '1px solid rgba(255,255,255,0.05)' }}>
                    <div style={{ fontSize: 10, color: 'var(--txt3)', textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: 6 }}>{item.label}</div>
                    <div className={item.isText ? 'nm' : 'mn'} style={{ fontSize: 13, color: item.color || 'var(--txt)', ...item.style }}>{item.value}</div>
                  </div>
                ))}
              </div>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 10, marginTop: 10 }}>
                {[
                  { label: 'CITY', value: selectedLead.city || 'Kota', isText: true },
                  { label: 'PORTFOLIO', value: selectedLead.portfolio?.name || 'Rajasthan Personal Loans', isText: true, color: 'var(--pur)' }
                ].map((item, i) => (
                  <div key={i} style={{ background: '#1e2433', padding: '12px 14px', borderRadius: 6, minWidth: 120, maxWidth: 200, flex: '1 1 auto', border: '1px solid rgba(255,255,255,0.05)' }}>
                    <div style={{ fontSize: 10, color: 'var(--txt3)', textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: 6 }}>{item.label}</div>
                    <div className={item.isText ? 'nm' : 'mn'} style={{ fontSize: 13, color: item.color || 'var(--txt)' }}>{item.value}</div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* SEARCH BAR */}
        <div className="sbar" style={{ padding: '12px 20px', borderBottom: '1px solid var(--bdr)', display: 'flex', gap: 12, alignItems: 'center' }}>
          <div className="sinp-wrap" style={{ flex: 1, maxWidth: 400, background: 'var(--bg2)', borderRadius: 20, border: '1px solid var(--bdr)' }}>
            <span style={{ padding: '0 12px', color: 'var(--txt3)', fontSize: 14 }}>⌕</span>
            <input 
              className="sinp" 
              style={{ background: 'transparent', border: 'none', padding: '8px 0' }}
              placeholder="Search by account, mobile, name, PAN..." 
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
          <div style={{ display: 'flex', gap: 4 }}>
            {['All', 'Name', 'Mobile', 'Account', 'PAN'].map(t => (
              <div key={t} className={`stab ${filterTab === t.toLowerCase() ? 'on' : ''}`} onClick={() => setFilterTab(t.toLowerCase())} style={{ borderRadius: 16, padding: '4px 12px', fontSize: 12 }}>{t}</div>
            ))}
          </div>
          <button className="btn sm" style={{ background: 'transparent', border: '1px solid var(--bdr)' }} onClick={() => setShowFilters(!showFilters)}>⊞ Filters {showFilters ? '▲' : '▼'}</button>
          <span style={{ fontSize: 12, color: 'var(--txt3)', marginLeft: 'auto' }}>{leads.length} records</span>
        </div>

        {/* FILTER ROW */}
        {showFilters && (
          <div id="fRow" style={{ display: 'flex', padding: '10px 20px', background: '#161b27', borderBottom: '1px solid var(--bdr)', gap: 10, flexWrap: 'wrap', alignItems: 'center' }}>
            <select className="finp" style={{ fontSize: 12, padding: '6px 10px', width: 'auto' }}><option value="">All Status</option></select>
            <input className="finp" type="number" placeholder="DPD Min" style={{ width: '90px', padding: '6px 10px' }} />
            <input className="finp" type="number" placeholder="DPD Max" style={{ width: '90px', padding: '6px 10px' }} />
            <input className="finp" type="number" placeholder="₹ Min" style={{ width: '100px', padding: '6px 10px' }} />
            <select className="finp" style={{ fontSize: 12, padding: '6px 10px', width: 'auto' }}><option value="">All Portfolios</option></select>
            <button className="btn sm dn" style={{ padding: '6px 12px' }}>Clear</button>
          </div>
        )}

        {/* RESULTS AREA */}
        <div className="result-area" style={{ background: '#161b27' }}>
          <table className="tbl" style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr style={{ borderBottom: '1px solid var(--bdr)' }}>
                <th style={{ background: 'transparent', border: 'none', padding: '12px 20px', color: 'var(--txt3)', fontSize: 10, textTransform: 'uppercase', letterSpacing: 0.5 }}>Account Number</th>
                <th style={{ background: 'transparent', border: 'none', padding: '12px 10px', color: 'var(--txt3)', fontSize: 10, textTransform: 'uppercase', letterSpacing: 0.5 }}>Customer Name</th>
                <th style={{ background: 'transparent', border: 'none', padding: '12px 10px', color: 'var(--txt3)', fontSize: 10, textTransform: 'uppercase', letterSpacing: 0.5 }}>Mobile Number</th>
                <th style={{ background: 'transparent', border: 'none', padding: '12px 10px', color: 'var(--txt3)', fontSize: 10, textTransform: 'uppercase', letterSpacing: 0.5 }}>Product Type</th>
                <th style={{ background: 'transparent', border: 'none', padding: '12px 10px', color: 'var(--txt3)', fontSize: 10, textTransform: 'uppercase', letterSpacing: 0.5 }}>Outstanding Amount</th>
                <th style={{ background: 'transparent', border: 'none', padding: '12px 10px', color: 'var(--txt3)', fontSize: 10, textTransform: 'uppercase', letterSpacing: 0.5 }}>Days Past Due</th>
                <th style={{ background: 'transparent', border: 'none', padding: '12px 10px', color: 'var(--txt3)', fontSize: 10, textTransform: 'uppercase', letterSpacing: 0.5 }}>Status</th>
                <th style={{ background: 'transparent', border: 'none', padding: '12px 10px', color: 'var(--txt3)', fontSize: 10, textTransform: 'uppercase', letterSpacing: 0.5 }}>City</th>
                <th style={{ background: 'transparent', border: 'none', padding: '12px 10px', color: 'var(--txt3)', fontSize: 10, textTransform: 'uppercase', letterSpacing: 0.5 }}>Portfolio</th>
                <th style={{ background: 'transparent', border: 'none', padding: '12px 20px', color: 'var(--txt3)', fontSize: 10, textTransform: 'uppercase', letterSpacing: 0.5 }}>Assigned To</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr><td colSpan={10} style={{ textAlign: 'center', padding: 50, color: 'var(--txt3)' }}>Loading...</td></tr>
              ) : leads.map(lead => (
                <tr key={lead.id} onClick={() => setSelectedLead(lead)} style={{ borderBottom: '1px solid rgba(255,255,255,0.03)', cursor: 'pointer', background: selectedLead?.id === lead.id ? 'rgba(79,125,255,0.08)' : 'transparent' }}>
                  <td className="mn" style={{ padding: '14px 20px', color: 'var(--txt3)' }}>{lead.account_no}</td>
                  <td className="nm" style={{ padding: '14px 10px', color: 'var(--txt)' }}>{lead.name}</td>
                  <td className="mn" style={{ padding: '14px 10px', color: 'var(--txt2)' }}>{lead.mobile}</td>
                  <td style={{ padding: '14px 10px', fontSize: 12, color: 'var(--txt3)' }}>{lead.product || 'Personal Loan'}</td>
                  <td className="mn" style={{ padding: '14px 10px', color: 'var(--red)', fontWeight: 600 }}>₹{lead.outstanding?.toLocaleString('en-IN')}</td>
                  <td className="mn" style={{ padding: '14px 10px', color: 'var(--red)' }}>{lead.dpd}d</td>
                  <td style={{ padding: '14px 10px' }}><span className="badge" style={{ background: lead.status === 'overdue' ? 'rgba(226,75,74,0.1)' : 'rgba(139,92,246,0.1)', color: lead.status === 'overdue' ? 'var(--red)' : 'var(--pur)', border: `1px solid ${lead.status === 'overdue' ? 'rgba(226,75,74,0.3)' : 'rgba(139,92,246,0.3)'}`, borderRadius: 12, padding: '4px 8px' }}><span style={{ fontSize: 8, marginRight: 4 }}>●</span> {lead.status}</span></td>
                  <td style={{ padding: '14px 10px', fontSize: 12, color: 'var(--txt2)' }}>{lead.city || '—'}</td>
                  <td style={{ padding: '14px 10px', color: 'var(--pur)', fontSize: 12 }}>{lead.portfolio?.name || 'Retail'}</td>
                  <td style={{ padding: '14px 20px', fontSize: 12, color: 'var(--txt2)' }}>Jenna Rivera</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* PAGER */}
        <div className="pager">
          <span style={{ fontSize: 11, color: 'var(--txt3)', flex: 1 }}>Page 1 of 1 • {leads.length} records</span>
          <div style={{ display: 'flex', gap: 3 }}>
            <button className="p-btn" disabled>«</button>
            <button className="p-btn" disabled>‹</button>
            <button className="p-btn cur">1</button>
            <button className="p-btn" disabled>›</button>
            <button className="p-btn" disabled>»</button>
          </div>
          <select className="finp" style={{ fontSize: 10, padding: '3px 6px', width: 'auto', marginLeft: 10 }}>
            <option value="25">25/page</option>
            <option value="50">50/page</option>
          </select>
        </div>
      </div>
    </div>
  );
};

export default Leads;
