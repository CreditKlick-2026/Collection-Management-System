"use client";
import React, { useState, useEffect } from 'react';
import { useApp } from '@/context/AppContext';
import SButton from './SButton';

const NewPTPModal = ({ onDone }: { onDone: () => void }) => {
  const { closeModal, toast, user } = useApp();
  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState({ customerId: '', amount: '', date: '', remarks: '' });
  
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
    if (!form.customerId || !form.amount || !form.date) { toast('Please fill all required fields'); return; }
    setLoading(true);
    try {
      const res = await fetch('/api/ptps', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...form, agentId: user?.id })
      });
      if (res.ok) {
        toast('PTP recorded successfully');
        closeModal();
        onDone();
      }
    } catch (e) { toast('Error saving PTP'); }
    setLoading(false);
  };

  return (
    <div style={{ padding: '0 20px 20px' }}>
      <div style={{ background: 'rgba(245,166,35,0.08)', border: '1px solid rgba(245,166,35,0.2)', padding: '12px 16px', borderRadius: 8, marginBottom: 20, color: 'var(--amb)', fontSize: 13, display: 'flex', alignItems: 'center', gap: 8 }}>
        <span>⏳</span> PTP will be added to the active tracker for agent follow-up.
      </div>

      <div className="ff" style={{ marginBottom: 15, position: 'relative' }} ref={suggestionRef}>
        <label>CUSTOMER ACCOUNT *</label>
        <div style={{ position: 'relative' }}>
          <input 
            className="finp" 
            placeholder="Search Name or Account #..." 
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
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 15, marginBottom: 15 }}>
        <div className="ff">
          <label>PTP AMOUNT (₹) *</label>
          <input className="finp" type="number" placeholder="0" value={form.amount} onChange={e => setForm({ ...form, amount: e.target.value })} />
        </div>
        <div className="ff">
          <label>PTP DATE *</label>
          <input className="finp" type="date" value={form.date} onChange={e => setForm({ ...form, date: e.target.value })} />
        </div>
      </div>

      <div className="ff" style={{ marginBottom: 25 }}>
        <label>REMARKS / VOC</label>
        <textarea className="finp" rows={3} style={{ resize: 'vertical' }} placeholder="Customer notes..." value={form.remarks} onChange={e => setForm({ ...form, remarks: e.target.value })} />
      </div>

      <SButton variant="primary" style={{ width: '100%' }} onClick={handleSubmit} loading={loading}>
        Save Promise to Pay
      </SButton>
    </div>
  );
};

const EditPTPModal = ({ item, onDone }: { item: any, onDone: () => void }) => {
  const { closeModal, toast } = useApp();
  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState({
    amount: item?.ptp_amount || item?.amount,
    date: item?.ptp_date?.split('/').reverse().join('-') || '',
    status: item?.status,
    remarks: item?.remarks || '',
    voc: item?.voc || '',
    flag: item?.flag || '',
    flag_comment: item?.flag_comment || item?.rejection_reason || ''
  });

  const handleSubmit = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/ptps', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...form, id: item.id })
      });
      if (res.ok) {
        toast('PTP updated successfully');
        closeModal();
        onDone();
      } else {
        toast('Failed to update PTP');
      }
    } catch (e) {
      toast('Error saving PTP');
    }
    setLoading(false);
  };

  return (
    <div style={{ padding: '0 20px 20px' }}>
      <div style={{ background: 'rgba(79,125,255,0.08)', border: '1px solid rgba(79,125,255,0.2)', padding: '12px 16px', borderRadius: 8, marginBottom: 20, color: 'var(--acc2)', fontSize: 13 }}>
        Account: <b>{item?.account_no || item?.account}</b> <span style={{ color: 'var(--txt3)' }}>·</span> <b>{item?.customer_name || item?.customer}</b>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 15, marginBottom: 15 }}>
        <div className="ff">
          <label>PTP AMOUNT (₹)</label>
          <input className="finp" value={form.amount} onChange={e => setForm({ ...form, amount: e.target.value })} />
        </div>
        <div className="ff">
          <label>PTP DATE</label>
          <input className="finp" type="date" value={form.date} onChange={e => setForm({ ...form, date: e.target.value })} />
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 15, marginBottom: 15 }}>
        <div className="ff">
          <label>STATUS</label>
          <select className="finp" value={form.status} onChange={e => setForm({ ...form, status: e.target.value })}>
            <option value="pending">pending</option>
            <option value="partial">partial</option>
            <option value="kept">kept</option>
            <option value="broken">broken</option>
            <option value="paid">paid</option>
          </select>
        </div>
        <div className="ff">
          <label>REMARKS</label>
          <input className="finp" value={form.remarks} onChange={e => setForm({ ...form, remarks: e.target.value })} />
        </div>
      </div>

      <div className="ff" style={{ marginBottom: 25 }}>
        <label>VOC / CALL NOTES</label>
        <textarea className="finp" rows={3} style={{ resize: 'vertical' }} value={form.voc} onChange={e => setForm({ ...form, voc: e.target.value })} />
      </div>

      <div style={{ fontSize: 11, fontWeight: 700, color: 'var(--acc2)', letterSpacing: 0.5, marginBottom: 15, textTransform: 'uppercase' }}>
        MANAGER REVIEW
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 15, marginBottom: 25 }}>
        <div className="ff">
          <label>FLAG / REVIEW STATUS</label>
          <select className="finp" value={form.flag} onChange={e => setForm({ ...form, flag: e.target.value })}>
            <option value="">— Select Status —</option>
            <option value="approved">approved</option>
            <option value="flagged">flagged</option>
            <option value="rejected">rejected</option>
          </select>
        </div>
        <div className="ff">
          <label>FLAG COMMENT / REJECTION REASON</label>
          <input className="finp" value={form.flag_comment} onChange={e => setForm({ ...form, flag_comment: e.target.value })} placeholder="e.g. Customer history unreliable" />
        </div>
      </div>

      <button className="btn pr" style={{ width: '100%', padding: '12px', background: '#4f7dff' }} onClick={handleSubmit} disabled={loading}>
        {loading ? 'Saving...' : '✓ Save PTP'}
      </button>
    </div>
  );
};


const PTPs = () => {
  const { openModal } = useApp();
  const [subTab, setSubTab] = useState<'ptp' | 'settlement'>('ptp');
  const [ptps, setPtps] = useState<any[]>([]);
  const [settlements, setSettlements] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState({ date: '', agent: '', account: '' });
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalRecords, setTotalRecords] = useState(0);
  const LIMIT = 25;

  useEffect(() => {
    if (subTab === 'ptp') fetchPtps();
    else fetchSettlements();
  }, [subTab, page]);

  useEffect(() => {
    const timer = setTimeout(() => {
      if (page === 1) {
        if (subTab === 'ptp') fetchPtps(1);
        else fetchSettlements(1);
      } else {
        setPage(1);
      }
    }, 500);
    return () => clearTimeout(timer);
  }, [filters.date, filters.agent, filters.account]);

  const fetchPtps = async (pg = page) => {
    setLoading(true);
    try {
      const q = new URLSearchParams({
        date: filters.date,
        agent: filters.agent,
        account: filters.account,
        page: String(pg),
        limit: String(LIMIT)
      }).toString();
      const res = await fetch(`/api/ptps?${q}`);
      if (res.ok) {
        const json = await res.json();
        const dataArray = Array.isArray(json) ? json : (json.data || []);
        setPtps(dataArray);
        setTotalRecords(json.total || dataArray.length);
        setTotalPages(json.totalPages || 1);
      }
    } catch (e) { console.error(e); }
    setLoading(false);
  };

  const fetchSettlements = async (pg = page) => {
    setLoading(true);
    try {
      const q = new URLSearchParams({
        status: 'all',
        date: filters.date,
        agent: filters.agent,
        account: filters.account,
        page: String(pg),
        limit: String(LIMIT)
      }).toString();
      const res = await fetch(`/api/settlements?${q}`);
      if (res.ok) {
        const json = await res.json();
        const dataArray = Array.isArray(json) ? json : (json.data || []);
        setSettlements(dataArray);
        setTotalRecords(json.total || dataArray.length);
        setTotalPages(json.totalPages || 1);
      }
    } catch (e) { console.error(e); }
    setLoading(false);
  };

  return (
    <div id="pg-ptp" className="page on">
      <div className="ph" style={{ borderBottom: 'none' }}>
        <div>
          <div className="ph-t" style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <span>₹ {subTab === 'ptp' ? 'Promise to Pay' : 'Settlements'}</span>
          </div>
          <div className="ph-s">{subTab === 'ptp' ? 'PTP records and tracking' : 'Raised settlements for approval'}</div>
        </div>

        <div style={{ display: 'flex', gap: 6, background: 'var(--bg3)', padding: 4, borderRadius: 10, border: '1px solid var(--bdr)', marginLeft: 40 }}>
          <button 
            onClick={() => setSubTab('ptp')}
            style={{ 
              padding: '6px 20px', borderRadius: 8, fontSize: 13, fontWeight: 700, cursor: 'pointer', transition: 'all 0.2s',
              background: subTab === 'ptp' ? 'var(--acc2)' : 'transparent',
              color: subTab === 'ptp' ? '#fff' : 'var(--txt3)',
              border: 'none'
            }}
          >
            PTPs
          </button>
          <button 
            onClick={() => setSubTab('settlement')}
            style={{ 
              padding: '6px 20px', borderRadius: 8, fontSize: 13, fontWeight: 700, cursor: 'pointer', transition: 'all 0.2s',
              background: subTab === 'settlement' ? 'var(--acc2)' : 'transparent',
              color: subTab === 'settlement' ? '#fff' : 'var(--txt3)',
              border: 'none',
              display: 'flex', alignItems: 'center', gap: 6
            }}
          >
            ⚖️ Settlements
          </button>
        </div>

        <div className="ph-ml" style={{ marginLeft: 'auto' }}>
          {subTab === 'ptp' && (
            <SButton variant="primary" onClick={() => openModal('Record Promise to Pay', <NewPTPModal onDone={fetchPtps} />)}>+ New PTP</SButton>
          )}
        </div>
      </div>
      <div className="page-body">

        {/* Stats Cards - Only for PTP */}
        {subTab === 'ptp' && (
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr 1fr', gap: 20, marginBottom: 20 }}>
            <div className="card" style={{ background: 'var(--bg2)', border: '1px solid var(--bdr)', padding: '16px 20px' }}>
              <div style={{ fontSize: 10, color: 'var(--txt3)', fontWeight: 700, letterSpacing: 0.5, marginBottom: 8, textTransform: 'uppercase' }}>Total PTPs</div>
              <div style={{ fontSize: 20, fontWeight: 700, color: 'var(--txt)' }}>{totalRecords}</div>
            </div>
            <div className="card" style={{ background: 'var(--bg2)', border: '1px solid var(--bdr)', padding: '16px 20px' }}>
              <div style={{ fontSize: 10, color: 'var(--txt3)', fontWeight: 700, letterSpacing: 0.5, marginBottom: 8, textTransform: 'uppercase' }}>Pending</div>
              <div style={{ fontSize: 20, fontWeight: 700, color: 'var(--amb)' }}>{ptps.filter(p => p.status === 'pending').length}</div>
            </div>
            <div className="card" style={{ background: 'var(--bg2)', border: '1px solid var(--bdr)', padding: '16px 20px' }}>
              <div style={{ fontSize: 10, color: 'var(--txt3)', fontWeight: 700, letterSpacing: 0.5, marginBottom: 8, textTransform: 'uppercase' }}>Paid / Kept</div>
              <div style={{ fontSize: 20, fontWeight: 700, color: 'var(--grn)' }}>{ptps.filter(p => p.status === 'paid' || p.status === 'kept').length}</div>
            </div>
            <div className="card" style={{ background: 'var(--bg2)', border: '1px solid var(--bdr)', padding: '16px 20px' }}>
              <div style={{ fontSize: 10, color: 'var(--txt3)', fontWeight: 700, letterSpacing: 0.5, marginBottom: 8, textTransform: 'uppercase' }}>Broken</div>
              <div style={{ fontSize: 20, fontWeight: 700, color: 'var(--red)' }}>{ptps.filter(p => p.status === 'broken').length}</div>
            </div>
          </div>
        )}

        {/* Filter Row - Shared for PTP & Settlements */}
        <div style={{ marginBottom: 20, display: 'flex', gap: 10, alignItems: 'center' }}>
          <input className="finp" type="date" style={{ width: 'auto' }} value={filters.date} onChange={e => setFilters({ ...filters, date: e.target.value })} />
          <input className="finp" placeholder="Agent name..." style={{ width: 160 }} value={filters.agent} onChange={e => setFilters({ ...filters, agent: e.target.value })} />
          <input className="finp" placeholder="Account / Customer..." style={{ width: 200 }} value={filters.account} onChange={e => setFilters({ ...filters, account: e.target.value })} />
          <button className="btn" style={{ background: 'var(--redbg)', color: 'var(--red)', border: '1px solid rgba(226,75,74,0.3)' }} onClick={() => setFilters({ date: '', agent: '', account: '' })}>Clear</button>
        </div>

        <div className="card" style={{ padding: 0, overflow: 'hidden', background: 'var(--bg2)', border: '1px solid var(--bdr)' }}>
          <div style={{ overflowX: 'auto' }}>
            {subTab === 'ptp' ? (
              <table className="tbl" style={{ borderCollapse: 'collapse', width: '100%' }}>
                <thead>
                  <tr style={{ borderBottom: '1px solid var(--bdr)' }}>
                    <th style={{ background: 'transparent', border: 'none', padding: '12px 10px', color: 'var(--txt3)', fontSize: 10, textTransform: 'uppercase', letterSpacing: 0.5 }}>Date</th>
                    <th style={{ background: 'transparent', border: 'none', padding: '12px 10px', color: 'var(--txt3)', fontSize: 10, textTransform: 'uppercase', letterSpacing: 0.5 }}>Account</th>
                    <th style={{ background: 'transparent', border: 'none', padding: '12px 10px', color: 'var(--txt3)', fontSize: 10, textTransform: 'uppercase', letterSpacing: 0.5 }}>Customer</th>
                    <th style={{ background: 'transparent', border: 'none', padding: '12px 10px', color: 'var(--txt3)', fontSize: 10, textTransform: 'uppercase', letterSpacing: 0.5 }}>PTP Amount</th>
                    <th style={{ background: 'transparent', border: 'none', padding: '12px 10px', color: 'var(--txt3)', fontSize: 10, textTransform: 'uppercase', letterSpacing: 0.5 }}>PTP Date</th>
                    <th style={{ background: 'transparent', border: 'none', padding: '12px 10px', color: 'var(--txt3)', fontSize: 10, textTransform: 'uppercase', letterSpacing: 0.5 }}>Status</th>
                    <th style={{ background: 'transparent', border: 'none', padding: '12px 10px', color: 'var(--txt3)', fontSize: 10, textTransform: 'uppercase', letterSpacing: 0.5 }}>Agent</th>
                    <th style={{ background: 'transparent', border: 'none', padding: '12px 10px', color: 'var(--txt3)', fontSize: 10, textTransform: 'uppercase', letterSpacing: 0.5 }}>VOC</th>
                    <th style={{ background: 'transparent', border: 'none', padding: '12px 10px' }}></th>
                  </tr>
                </thead>
                <tbody>
                  {loading ? (
                    Array.from({ length: 8 }).map((_, i) => (
                      <tr key={i} style={{ borderBottom: '1px solid var(--faint)' }}>
                        <td style={{ padding: '14px 10px' }}><div className="skel" style={{ width: '80px' }} /></td>
                        <td style={{ padding: '14px 10px' }}><div className="skel" style={{ width: '100px' }} /></td>
                        <td style={{ padding: '14px 10px' }}><div className="skel" style={{ width: '150px' }} /></td>
                        <td style={{ padding: '14px 10px' }}><div className="skel" style={{ width: '70px' }} /></td>
                        <td style={{ padding: '14px 10px' }}><div className="skel" style={{ width: '80px' }} /></td>
                        <td style={{ padding: '14px 10px' }}><div className="skel" style={{ width: '80px', height: 18, borderRadius: 12 }} /></td>
                        <td style={{ padding: '14px 10px' }}><div className="skel" style={{ width: '100px' }} /></td>
                        <td style={{ padding: '14px 10px' }}><div className="skel" style={{ width: '120px' }} /></td>
                        <td style={{ padding: '14px 10px', textAlign: 'right' }}><div className="skel" style={{ width: '45px', height: 26, borderRadius: 6, display: 'inline-block' }} /></td>
                      </tr>
                    ))
                  ) : ptps.length === 0 ? (
                    <tr>
                      <td colSpan={9} style={{ padding: '40px', textAlign: 'center' }}>
                        <div style={{ color: 'var(--txt3)', fontSize: 14 }}>
                          <div style={{ fontSize: 24, marginBottom: 10 }}>📂</div>
                          No PTP records found for the selected filters.
                        </div>
                      </td>
                    </tr>
                  ) : ptps.map(p => (
                    <tr key={p.id} style={{ borderBottom: '1px solid var(--faint)' }}>
                      <td className="mn" style={{ color: 'var(--txt3)', padding: '12px 10px' }}>{p.created}</td>
                      <td className="mn" style={{ padding: '12px 10px' }}>{p.account_no}</td>
                      <td className="nm" style={{ padding: '12px 10px', color: 'var(--txt)' }}>{p.customer_name}</td>
                      <td className="mn" style={{ padding: '12px 10px', color: 'var(--amb)', fontWeight: 700 }}>₹{p.ptp_amount?.toLocaleString('en-IN')}</td>
                      <td className="mn" style={{ color: 'var(--txt3)', padding: '12px 10px' }}>{p.ptp_date}</td>
                      <td style={{ padding: '12px 10px' }}>
                        {p.flag === 'approved' ? (
                          <span className="badge" style={{ background: 'rgba(46,204,138,0.1)', border: '1px solid rgba(46,204,138,0.3)', color: 'var(--grn)', borderRadius: 12 }}>
                            <span style={{ fontSize: 8, marginRight: 5 }}>●</span> Approved
                          </span>
                        ) : p.flag === 'rejected' ? (
                          <span className="badge" style={{ background: 'rgba(226,75,74,0.1)', border: '1px solid rgba(226,75,74,0.3)', color: 'var(--red)', borderRadius: 12 }}>
                            <span style={{ fontSize: 8, marginRight: 5 }}>●</span> Rejected
                          </span>
                        ) : p.flag === 'flagged' ? (
                          <span className="badge" style={{ background: 'rgba(245,166,35,0.1)', border: '1px solid rgba(245,166,35,0.3)', color: 'var(--amb)', borderRadius: 12 }}>
                            <span style={{ fontSize: 8, marginRight: 5 }}>⚑</span> Flagged
                          </span>
                        ) : (
                          <span className="badge" style={{ background: 'transparent', border: `1px solid ${p.status === 'broken' ? 'rgba(226,75,74,0.3)' : (p.status === 'paid' || p.status === 'kept') ? 'rgba(46,204,138,0.3)' : 'rgba(245,166,35,0.3)'}`, color: p.status === 'broken' ? 'var(--red)' : (p.status === 'paid' || p.status === 'kept') ? 'var(--grn)' : 'var(--amb)', borderRadius: 12 }}>
                            <span style={{ fontSize: 8, marginRight: 5 }}>●</span> {p.status}
                          </span>
                        )}
                      </td>
                      <td style={{ fontSize: 12, color: 'var(--txt2)', padding: '12px 10px' }}>{p.agent_name}</td>
                      <td style={{ fontSize: 12, color: 'var(--txt3)', padding: '12px 10px', maxWidth: 180, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{p.voc || '—'}</td>
                      <td style={{ padding: '12px 10px', textAlign: 'right' }}>
                        <button className="btn sm" style={{ background: 'var(--faint)', border: '1px solid var(--faint)' }} onClick={() => openModal(`PTP — ${p.account_no}`, <EditPTPModal item={p} onDone={fetchPtps} />)}>Edit</button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            ) : (
              <table className="tbl" style={{ borderCollapse: 'collapse', width: '100%' }}>
                <thead>
                  <tr style={{ borderBottom: '1px solid var(--bdr)' }}>
                    <th style={{ background: 'transparent', border: 'none', padding: '12px 10px', color: 'var(--txt3)', fontSize: 10, textTransform: 'uppercase', letterSpacing: 0.5 }}>Date</th>
                    <th style={{ background: 'transparent', border: 'none', padding: '12px 10px', color: 'var(--txt3)', fontSize: 10, textTransform: 'uppercase', letterSpacing: 0.5 }}>Account</th>
                    <th style={{ background: 'transparent', border: 'none', padding: '12px 10px', color: 'var(--txt3)', fontSize: 10, textTransform: 'uppercase', letterSpacing: 0.5 }}>Customer</th>
                    <th style={{ background: 'transparent', border: 'none', padding: '12px 10px', color: 'var(--txt3)', fontSize: 10, textTransform: 'uppercase', letterSpacing: 0.5 }}>Settlement Amount</th>
                    <th style={{ background: 'transparent', border: 'none', padding: '12px 10px', color: 'var(--txt3)', fontSize: 10, textTransform: 'uppercase', letterSpacing: 0.5 }}>Settlement Date</th>
                    <th style={{ background: 'transparent', border: 'none', padding: '12px 10px', color: 'var(--txt3)', fontSize: 10, textTransform: 'uppercase', letterSpacing: 0.5 }}>Status</th>
                    <th style={{ background: 'transparent', border: 'none', padding: '12px 10px', color: 'var(--txt3)', fontSize: 10, textTransform: 'uppercase', letterSpacing: 0.5 }}>Agent</th>
                    <th style={{ background: 'transparent', border: 'none', padding: '12px 10px', color: 'var(--txt3)', fontSize: 10, textTransform: 'uppercase', letterSpacing: 0.5 }}>Reason</th>
                  </tr>
                </thead>
                <tbody>
                  {loading ? (
                     Array.from({ length: 5 }).map((_, i) => (
                      <tr key={i} style={{ borderBottom: '1px solid var(--faint)' }}>
                        <td colSpan={8} style={{ padding: '14px 10px' }}><div className="skel" style={{ width: '100%' }} /></td>
                      </tr>
                    ))
                  ) : settlements.length === 0 ? (
                    <tr>
                      <td colSpan={8} style={{ padding: '40px', textAlign: 'center' }}>
                        <div style={{ color: 'var(--txt3)', fontSize: 14 }}>
                          <div style={{ fontSize: 24, marginBottom: 10 }}>⚖️</div>
                          No settlements found.
                        </div>
                      </td>
                    </tr>
                  ) : settlements.map(s => (
                    <tr key={s.id} style={{ borderBottom: '1px solid var(--faint)' }}>
                      <td className="mn" style={{ color: 'var(--txt3)', padding: '12px 10px' }}>{s.created}</td>
                      <td className="mn" style={{ padding: '12px 10px' }}>{s.customer?.account_no}</td>
                      <td className="nm" style={{ padding: '12px 10px' }}>{s.customer?.name}</td>
                      <td className="mn" style={{ padding: '12px 10px', color: 'var(--acc2)', fontWeight: 700 }}>₹{s.amount?.toLocaleString('en-IN')}</td>
                      <td className="mn" style={{ color: 'var(--txt3)', padding: '12px 10px' }}>{s.created}</td>
                      <td style={{ padding: '12px 10px' }}>
                        <span className="badge" style={{ background: 'transparent', border: `1px solid ${s.status === 'Rejected' ? 'rgba(226,75,74,0.3)' : s.status === 'Approve' ? 'rgba(46,204,138,0.3)' : 'rgba(245,166,35,0.3)'}`, color: s.status === 'Rejected' ? 'var(--red)' : s.status === 'Approve' ? 'var(--grn)' : 'var(--amb)', borderRadius: 12 }}>
                          <span style={{ color: s.status === 'Rejected' ? 'var(--red)' : s.status === 'Approve' ? 'var(--grn)' : 'var(--amb)', fontSize: 8, marginRight: 5 }}>●</span> {s.status}
                        </span>
                      </td>
                      <td style={{ fontSize: 12, color: 'var(--txt2)', padding: '12px 10px' }}>{s.agent?.name}</td>
                      <td style={{ fontSize: 12, color: 'var(--txt3)', padding: '12px 10px', maxWidth: 180, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                        {s.reason} {s.subReason ? `(${s.subReason})` : ''}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>

          {/* Pagination */}
          {totalPages > 1 && (
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '12px 20px', borderTop: '1px solid var(--bdr)', background: 'rgba(255,255,255,0.01)' }}>
              <div style={{ fontSize: 12, color: 'var(--txt3)' }}>
                Showing {((page - 1) * LIMIT) + 1}–{Math.min(page * LIMIT, totalRecords)} of {totalRecords}
              </div>
              <div style={{ display: 'flex', gap: 6 }}>
                <button className="btn sm" disabled={page === 1} onClick={() => setPage(p => Math.max(1, p - 1))}>Previous</button>
                <div style={{ display: 'flex', gap: 4 }}>
                  {Array.from({ length: Math.min(5, totalPages) }).map((_, i) => {
                    const pg = Math.max(1, Math.min(totalPages - 4, page - 2)) + i;
                    if (pg > totalPages || pg < 1) return null;
                    return (
                      <button key={pg} 
                        onClick={() => setPage(pg)}
                        style={{ 
                          width: 32, height: 32, borderRadius: 8, border: '1px solid var(--bdr)', 
                          background: page === pg ? 'var(--acc2)' : 'var(--bg2)',
                          color: page === pg ? '#fff' : 'var(--txt2)',
                          fontSize: 12, fontWeight: 600, cursor: 'pointer'
                        }}
                      >
                        {pg}
                      </button>
                    );
                  })}
                </div>
                <button className="btn sm" disabled={page === totalPages} onClick={() => setPage(p => Math.min(totalPages, p + 1))}>Next</button>
              </div>
            </div>
          )}
        </div>

      </div>
    </div>
  );
};

export default PTPs;
