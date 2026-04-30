"use client";
import React, { useState, useEffect } from 'react';

const Leads = () => {
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
        <div id="custDash" className={`cust-dash ${selectedLead ? 'filled' : 'empty'}`}>
          {!selectedLead ? (
            <><div style={{ fontSize: '20px', opacity: 0.3 }}>◉</div><div>Search and select a customer below to view details</div></>
          ) : (
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
              <div style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
                <div className="av" style={{ width: 42, height: 42, fontSize: 16, background: 'var(--accbg)', color: 'var(--acc2)', border: '1px solid rgba(79,125,255,0.3)' }}>
                  {selectedLead.name?.split(' ').map((n:any)=>n[0]).join('')}
                </div>
                <div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <div style={{ fontSize: 16, fontWeight: 700, color: 'var(--txt)' }}>{selectedLead.name}</div>
                    <span className={`pill ${selectedLead.status === 'overdue' ? 'ov' : 'ac'}`}>{selectedLead.status}</span>
                    <span className="badge pur">{selectedLead.portfolio?.name || 'Retail'}</span>
                  </div>
                  <div style={{ fontSize: 11, color: 'var(--txt3)', marginTop: 2 }}>
                    {selectedLead.account_no} • {selectedLead.product || 'Personal Loan'} • {selectedLead.bank || 'HDFC Bank'} • <span style={{ color: 'var(--grn)' }}>Paid: ₹0</span>
                  </div>
                </div>
              </div>
              <div style={{ display: 'flex', gap: 6 }}>
                <button className="btn sm pr">✎ Edit</button>
                <button className="btn sm">☏ Call Log</button>
                <button className="btn sm am">₹ PTP</button>
                <button className="btn sm gn">💳 Payment</button>
                <button className="btn sm">👤 Assign</button>
                <button className="btn sm pu">🕒 History</button>
              </div>
            </div>
          )}
        </div>

        {/* SEARCH BAR */}
        <div className="sbar">
          <div className="sinp-wrap">
            <span style={{ padding: '0 9px', color: 'var(--txt3)', fontSize: 14 }}>⌕</span>
            <input 
              className="sinp" 
              placeholder="Search by account, mobile, name, PAN..." 
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
          <div style={{ display: 'flex', gap: 4 }}>
            {['all', 'name', 'mobile', 'account', 'pan'].map(t => (
              <div key={t} className={`stab ${filterTab === t ? 'on' : ''}`} onClick={() => setFilterTab(t)} style={{ textTransform: 'capitalize' }}>{t}</div>
            ))}
          </div>
          <button className="btn sm" onClick={() => setShowFilters(!showFilters)}>⊞ Filters {showFilters ? '▲' : '▼'}</button>
          <span style={{ fontStyle: 'italic', fontSize: 11, color: 'var(--txt3)', marginLeft: 'auto' }}>{leads.length} records</span>
        </div>

        {/* FILTER ROW */}
        {showFilters && (
          <div id="fRow" style={{ display: 'flex', padding: '7px 14px', background: 'var(--bg2)', borderBottom: '1px solid var(--bdr)', gap: 7, flexWrap: 'wrap', alignItems: 'center' }}>
            <select className="finp" style={{ fontSize: 11, padding: '4px 8px', width: 'auto' }}><option value="">All Status</option></select>
            <input className="finp" type="number" placeholder="DPD Min" style={{ width: '80px' }} />
            <input className="finp" type="number" placeholder="DPD Max" style={{ width: '80px' }} />
            <input className="finp" type="number" placeholder="₹ Min" style={{ width: '90px' }} />
            <select className="finp" style={{ fontSize: 11, padding: '4px 8px', width: 'auto' }}><option value="">All Portfolios</option></select>
            <button className="btn sm dn">Clear</button>
          </div>
        )}

        {/* RESULTS AREA */}
        <div className="result-area">
          <table className="tbl">
            <thead>
              <tr>
                <th>Account Number</th>
                <th>Customer Name</th>
                <th>Mobile Number</th>
                <th>Product Type</th>
                <th>Outstanding Amount</th>
                <th>Days Past Due</th>
                <th>Status</th>
                <th>City</th>
                <th>Portfolio</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr><td colSpan={9} style={{ textAlign: 'center', padding: 50 }}>Loading...</td></tr>
              ) : leads.map(lead => (
                <tr key={lead.id} onClick={() => setSelectedLead(lead)} className={selectedLead?.id === lead.id ? 'sel' : ''}>
                  <td className="mn">{lead.account_no}</td>
                  <td className="nm">{lead.name}</td>
                  <td className="mn">{lead.mobile}</td>
                  <td style={{ fontSize: 11 }}>{lead.product || 'Personal Loan'}</td>
                  <td className="mn" style={{ color: 'var(--red)' }}>₹{lead.outstanding?.toLocaleString()}</td>
                  <td className="mn">{lead.dpd}d</td>
                  <td><span className={`pill ${lead.status === 'overdue' ? 'ov' : 'ac'}`}>{lead.status}</span></td>
                  <td>{lead.city || '—'}</td>
                  <td style={{ color: 'var(--pur)', fontSize: 11 }}>{lead.portfolio?.name || 'Retail'}</td>
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
