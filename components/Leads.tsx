"use client";
import React, { useState, useEffect } from 'react';
import { useApp } from '@/context/AppContext';
import SButton from './SButton';

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
  const { user, closeModal, toast } = useApp();
  const [loading, setLoading] = useState(false);
  // ... rest of state ...
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

  const handleSubmit = async () => {
    if (!connectStatus || !disposition) { toast('Please select Connect Status and Disposition'); return; }
    setLoading(true);
    try {
      const res = await fetch(`/api/leads/${lead.id}/disposition`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId: user?.id,
          connectStatus,
          disposition,
          subDisposition,
          date,
          amount,
          settlement,
          callDrop,
          altNumber,
          remarks
        })
      });
      if (res.ok) {
        toast('Lead disposition updated successfully');
        closeModal();
        onDone();
      } else {
        toast('Failed to update disposition');
      }
    } catch (e) {
      console.error(e);
      toast('Error updating disposition');
    } finally {
      setLoading(false);
    }
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

      <button className="btn pr" style={{ width: '100%', padding: '12px', background: 'var(--acc)' }} onClick={handleSubmit} disabled={loading}>
        {loading ? 'Saving...' : '✓ Save Disposition'}
      </button>
    </div>
  );
};

const Leads = () => {
  const { openModal, user } = useApp();
  const [leads, setLeads] = useState<any[]>([]);
  const [leadColumns, setLeadColumns] = useState<any[]>([]);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);
  const [selectedLead, setSelectedLead] = useState<any>(null);
  const [filterTab, setFilterTab] = useState('all');
  const [showFilters, setShowFilters] = useState(false);
  const [statusOptions, setStatusOptions] = useState<string[]>([]);
  const [statusFilter, setStatusFilter] = useState('');
  const [portfolioOptions, setPortfolioOptions] = useState<any[]>([]);
  const [portfolioFilter, setPortfolioFilter] = useState('');
  const [dpdMin, setDpdMin] = useState('');
  const [dpdMax, setDpdMax] = useState('');
  const [outMin, setOutMin] = useState('');
  const [filterMonth, setFilterMonth] = useState(String(new Date().getMonth() + 1));
  const [filterYear, setFilterYear] = useState(String(new Date().getFullYear()));

  useEffect(() => {
    fetchMetadata();
  }, []);

  useEffect(() => {
    setLoading(true);
    const timer = setTimeout(() => {
      fetchLeads();
    }, 300);
    return () => clearTimeout(timer);
  }, [search, filterTab, statusFilter, portfolioFilter, dpdMin, dpdMax, outMin, filterMonth, filterYear]);

  const fetchMetadata = async () => {
    try {
      const res = await fetch('/api/metadata');
      const data = await res.json();
      if (data.leadColumns) setLeadColumns(data.leadColumns);
      if (data.lists?.leadStatuses) setStatusOptions(data.lists.leadStatuses);
      if (data.portfolios) setPortfolioOptions(data.portfolios);
    } catch (e) { console.error(e); }
  };

  const fetchLeads = async () => {
    setLoading(true);
    try {
      const query = new URLSearchParams({ q: search, searchType: filterTab, userId: user?.id || '' });
      if (statusFilter) query.append('status', statusFilter);
      if (portfolioFilter) query.append('portfolio', portfolioFilter);
      if (dpdMin) query.append('dpdMin', dpdMin);
      if (dpdMax) query.append('dpdMax', dpdMax);
      if (outMin) query.append('outMin', outMin);
      if (filterMonth) query.append('month', filterMonth);
      if (filterYear) query.append('year', filterYear);
      
      const res = await fetch(`/api/leads?${query.toString()}`);
      const data = await res.json();
      if (Array.isArray(data)) {
        setLeads(data);
        if (data.length > 0 && !selectedLead) setSelectedLead(data[0]);
      } else {
        setLeads([]);
        console.error('API did not return an array:', data);
      }
    } catch (error) {
      console.error('Error fetching leads:', error);
      setLeads([]);
    } finally {
      setLoading(false);
    }
  };

  const tableCols = leadColumns.filter(c => c.visible !== false);
  const profileCols = leadColumns.filter(c => c.showInProfile !== false);

  return (
    <div id="pg-leads" className="page on">
      <div className="leads-outer">
        {/* CUSTOMER DASHBOARD HEADER */}
        <div id="custDash" className="cust-dash filled" style={{ padding: '20px', background: 'var(--bg2)', borderBottom: '1px solid var(--bdr)' }}>
          {loading ? (
            /* ── Skeleton: same structure as filled state ── */
            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 20 }}>
                <div style={{ display: 'flex', gap: 14, alignItems: 'center' }}>
                  {/* Avatar skeleton */}
                  <div style={{ width: 48, height: 48, borderRadius: '50%', background: 'var(--faint)', flexShrink: 0 }} className="skel" />
                  <div>
                    <div className="skel" style={{ width: 180, height: 16, marginBottom: 8 }} />
                    <div className="skel" style={{ width: 260, height: 11 }} />
                  </div>
                </div>
                <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                  <div className="skel" style={{ width: 70, height: 24, borderRadius: 12 }} />
                  <div className="skel" style={{ width: 90, height: 24, borderRadius: 12 }} />
                  <div className="skel" style={{ width: 90, height: 28, borderRadius: 6 }} />
                  <div className="skel" style={{ width: 70, height: 28, borderRadius: 6 }} />
                </div>
              </div>
              {/* Info boxes skeleton — same grid as real data */}
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(150px, 1fr))', gap: 10 }}>
                {Array.from({ length: 8 }).map((_, i) => (
                  <div key={i} style={{ background: 'var(--bg3)', padding: '12px 14px', borderRadius: 6, border: '1px solid var(--faint)' }}>
                    <div className="skel" style={{ width: '60%', height: 9, marginBottom: 8 }} />
                    <div className="skel" style={{ width: '80%', height: 13 }} />
                  </div>
                ))}
              </div>
            </div>
          ) : !selectedLead ? (
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, color: 'var(--txt3)' }}>
              <div style={{ fontSize: '20px', opacity: 0.5 }}>◉</div>
              <div>Search and select a customer below to view details</div>
            </div>
          ) : (
            <div>
              {/* Top Row: Avatar, Name, Buttons */}
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 20 }}>
                <div style={{ display: 'flex', gap: 14, alignItems: 'center' }}>
                  <div className="av" style={{ width: 48, height: 48, fontSize: 18, background: 'var(--faint)', color: 'var(--acc2)', border: '1px solid var(--bdr)', borderRadius: '50%' }}>
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
                  <span className="badge" style={{ background: 'var(--purbg)', color: 'var(--pur)', border: '1px solid var(--purbg)', borderRadius: 12, padding: '4px 10px', marginRight: 8 }}><span style={{ fontSize: 8, marginRight: 4 }}>●</span> {selectedLead.status}</span>
                  <button className="btn sm" style={{ background: 'transparent', border: '1px solid var(--bdr)', color: 'var(--grn)', padding: '6px 12px' }}>💳 Payment</button>
                  <button className="btn sm" style={{ background: 'transparent', border: '1px solid var(--bdr)', color: 'var(--amb)', padding: '6px 12px' }}>📞 Call Logs</button>
                  <button
                    className="btn sm"
                    style={{ background: 'rgba(79,125,255,0.1)', border: '1px solid rgba(79,125,255,0.3)', color: 'var(--acc2)', padding: '6px 12px' }}
                    onClick={() => openModal('Edit Lead Disposition', <EditLeadModal lead={selectedLead} onDone={fetchLeads} />)}
                  >
                    ✎ Edit
                  </button>
                </div>
              </div>

              {/* Grid Info Boxes */}
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(150px, 1fr))', gap: 10 }}>
                {(profileCols.length > 0 ? profileCols : [
                  { label: 'ACCOUNT NUMBER', key: 'account_no' },
                  { label: 'MOBILE NUMBER', key: 'mobile' },
                  { label: 'OUTSTANDING', key: 'outstanding', type: 'amount' },
                  { label: 'STATUS', key: 'status' }
                ]).map((item: any, i: number) => {
                  const rawVal = selectedLead[item.key] ?? selectedLead.metadata?.[item.key] ?? '—';
                  const val = (rawVal && typeof rawVal === 'object') ? (rawVal.name || rawVal.label || '—') : rawVal;
                  return (
                    <div key={i} style={{ background: 'var(--bg3)', padding: '12px 14px', borderRadius: 6, border: '1px solid var(--faint)' }}>
                      <div style={{ fontSize: 10, color: 'var(--txt3)', textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: 6 }}>{item.label}</div>
                      <div style={{ fontSize: 13, color: item.type === 'amount' ? 'var(--red)' : 'var(--txt)' }}>
                        {item.type === 'amount' ? `₹${Number(val).toLocaleString('en-IN')}` : String(val)}
                      </div>
                    </div>
                  );
                })}
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
          <SButton size="slim" variant="secondary" onClick={() => setShowFilters(!showFilters)}>⊞ Filters {showFilters ? '▲' : '▼'}</SButton>
          <span style={{ fontSize: 12, color: 'var(--txt3)', marginLeft: 'auto' }}>{leads.length} records</span>
        </div>

        {/* FILTER ROW */}
        {showFilters && (
          <div id="fRow" style={{ display: 'flex', padding: '10px 20px', background: 'var(--bg2)', borderBottom: '1px solid var(--bdr)', gap: 10, flexWrap: 'wrap', alignItems: 'center' }}>
            <select className="finp" style={{ fontSize: 12, padding: '6px 10px', width: 'auto' }} value={filterMonth} onChange={e => setFilterMonth(e.target.value)}>
              <option value="">All Months</option>
              {Array.from({length: 12}).map((_, i) => <option key={i+1} value={i+1}>{new Date(2000, i, 1).toLocaleString('default', { month: 'short' })}</option>)}
            </select>
            <select className="finp" style={{ fontSize: 12, padding: '6px 10px', width: 'auto' }} value={filterYear} onChange={e => setFilterYear(e.target.value)}>
              <option value="">All Years</option>
              {[0, 1, 2, 3, 4].map(y => {
                const yr = new Date().getFullYear() - y;
                return <option key={yr} value={yr}>{yr}</option>
              })}
            </select>
            <select 
              className="finp" 
              style={{ fontSize: 12, padding: '6px 10px', width: 'auto' }}
              value={statusFilter}
              onChange={e => setStatusFilter(e.target.value)}
            >
              <option value="">All Status</option>
              {statusOptions.map(st => <option key={st} value={st}>{st}</option>)}
            </select>
            <input className="finp" type="number" placeholder="DPD Min" style={{ width: '90px', padding: '6px 10px' }} value={dpdMin} onChange={e => setDpdMin(e.target.value)} />
            <input className="finp" type="number" placeholder="DPD Max" style={{ width: '90px', padding: '6px 10px' }} value={dpdMax} onChange={e => setDpdMax(e.target.value)} />
            <input className="finp" type="number" placeholder="₹ Min" style={{ width: '100px', padding: '6px 10px' }} value={outMin} onChange={e => setOutMin(e.target.value)} />
            <select className="finp" style={{ fontSize: 12, padding: '6px 10px', width: 'auto' }} value={portfolioFilter} onChange={e => setPortfolioFilter(e.target.value)}>
              <option value="">All Portfolios</option>
              {portfolioOptions.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
            </select>
            <SButton size="slim" variant="critical" onClick={() => {
              setStatusFilter(''); setDpdMin(''); setDpdMax(''); setOutMin(''); setPortfolioFilter(''); setSearch(''); setFilterTab('all'); setFilterMonth(''); setFilterYear('');
            }}>Clear</SButton>
          </div>
        )}

        {/* RESULTS AREA */}
        <div className="result-area" style={{ background: 'var(--bg2)' }}>
          <table className="tbl" style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr style={{ borderBottom: '1px solid var(--bdr)' }}>
                {tableCols.length > 0 ? tableCols.map(col => (
                  <th key={col.key} style={{ background: 'transparent', border: 'none', padding: '12px 10px', color: 'var(--txt3)', fontSize: 10, textTransform: 'uppercase', letterSpacing: 0.5, textAlign: 'left' }}>
                    {col.label}
                  </th>
                )) : (
                  <>
                    <th style={{ background: 'transparent', border: 'none', padding: '12px 20px', color: 'var(--txt3)', fontSize: 10, textTransform: 'uppercase', letterSpacing: 0.5 }}>Account Number</th>
                    <th style={{ background: 'transparent', border: 'none', padding: '12px 10px', color: 'var(--txt3)', fontSize: 10, textTransform: 'uppercase', letterSpacing: 0.5 }}>Customer Name</th>
                    <th style={{ background: 'transparent', border: 'none', padding: '12px 10px', color: 'var(--txt3)', fontSize: 10, textTransform: 'uppercase', letterSpacing: 0.5 }}>Mobile Number</th>
                    <th style={{ background: 'transparent', border: 'none', padding: '12px 10px', color: 'var(--txt3)', fontSize: 10, textTransform: 'uppercase', letterSpacing: 0.5 }}>Outstanding</th>
                    <th style={{ background: 'transparent', border: 'none', padding: '12px 10px', color: 'var(--txt3)', fontSize: 10, textTransform: 'uppercase', letterSpacing: 0.5 }}>Status</th>
                  </>
                )}
                <th style={{ background: 'transparent', border: 'none', padding: '12px 20px', color: 'var(--txt3)', fontSize: 10, textTransform: 'uppercase', letterSpacing: 0.5 }}>Assigned To</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                Array.from({ length: 10 }).map((_, i) => (
                  <tr key={i} style={{ borderBottom: '1px solid var(--faint)' }}>
                    {Array.from({ length: (tableCols.length || 5) + 1 }).map((_, j) => (
                      <td key={j} style={{ padding: '14px 10px' }}>
                        <div className="skel" style={{ width: `${Math.floor(Math.random() * 40) + 40}%` }} />
                      </td>
                    ))}
                  </tr>
                ))
              ) : leads.map(lead => (
                <tr key={lead.id} onClick={() => setSelectedLead(lead)} style={{ borderBottom: '1px solid var(--faint)', cursor: 'pointer', background: selectedLead?.id === lead.id ? 'var(--accbg)' : 'transparent' }}>
                  {tableCols.length > 0 ? tableCols.map(col => {
                    const rawVal = lead[col.key] ?? lead.metadata?.[col.key] ?? '—';
                    const val = (rawVal && typeof rawVal === 'object') ? (rawVal.name || rawVal.label || '—') : rawVal;
                    return (
                      <td key={col.key} style={{ padding: '14px 10px', fontSize: 12, color: col.type === 'amount' ? 'var(--red)' : 'var(--txt2)' }}>
                        {col.type === 'amount' ? `₹${Number(val).toLocaleString('en-IN')}` : 
                         col.type === 'badge' ? <span className="badge" style={{ background: 'var(--purbg)', color: 'var(--pur)', border: '1px solid var(--purbg)', borderRadius: 12, padding: '2px 8px' }}>{String(val)}</span> :
                         String(val)}
                      </td>
                    );
                  }) : (
                    <>
                      <td className="mn" style={{ padding: '14px 20px', color: 'var(--txt3)' }}>{lead.account_no}</td>
                      <td className="nm" style={{ padding: '14px 10px', color: 'var(--txt)' }}>{lead.name}</td>
                      <td className="mn" style={{ padding: '14px 10px', color: 'var(--txt2)' }}>{lead.mobile}</td>
                      <td className="mn" style={{ padding: '14px 10px', color: 'var(--red)', fontWeight: 600 }}>₹{lead.outstanding?.toLocaleString('en-IN')}</td>
                      <td><span className="badge">{lead.status}</span></td>
                    </>
                  )}
                  <td style={{ padding: '14px 20px', fontSize: 12, color: 'var(--txt2)' }}>{lead.assignedAgent?.name || 'Unassigned'}</td>
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
