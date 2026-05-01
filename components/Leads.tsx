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

const CONNECT_STATUS_COLORS: Record<string, string> = {
  'Right Party Connect': '#22c55e',
  'Third Party Connect': '#f59e0b',
  'Wrong Party Connect': '#ef4444',
  'Not Connected': '#6b7280',
};

const PAGE_SIZE = 25;

const CallLogsModal = ({ lead }: { lead: any }) => {
  const [logs, setLogs] = useState<any[]>([]);
  const [totalCount, setTotalCount] = useState(0);
  const [stats, setStats] = useState({ rpcCount: 0, ptpCount: 0, ncCount: 0 });
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [filterCS, setFilterCS] = useState('');
  const [search, setSearch] = useState('');
  const [expanded, setExpanded] = useState<number | null>(null);

  useEffect(() => {
    const fetchLogs = async () => {
      setLoading(true);
      try {
        const query = new URLSearchParams({
          page: page.toString(),
          limit: PAGE_SIZE.toString()
        });
        if (filterCS) query.append('status', filterCS);
        if (search) query.append('search', search);

        const res = await fetch(`/api/leads/${lead.id}/call-logs?${query.toString()}`);
        const data = await res.json();

        if (data && data.logs) {
          setLogs(data.logs);
          setTotalCount(data.totalCount || 0);
          if (data.stats) setStats(data.stats);
        } else if (Array.isArray(data)) {
          // Fallback if API hasn't deployed properly
          setLogs(data);
          setTotalCount(data.length);
        }
      } catch (e) { console.error(e); }
      finally { setLoading(false); }
    };
    fetchLogs();
  }, [lead.id, page, filterCS, search]); // Re-fetch on page or filter change

  const totalPages = Math.max(1, Math.ceil(totalCount / PAGE_SIZE));

  return (
    <div style={{ padding: '0 20px 20px' }}>

      {/* Summary Stats */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 8, marginBottom: 16 }}>
        {[
          { label: 'Total Calls', val: totalCount, color: 'var(--acc2)', bg: 'rgba(79,125,255,0.06)' },
          { label: 'RPC', val: stats.rpcCount, color: '#22c55e', bg: 'rgba(34,197,94,0.06)' },
          { label: 'PTP', val: stats.ptpCount, color: '#f59e0b', bg: 'rgba(245,158,11,0.06)' },
          { label: 'Not Connected', val: stats.ncCount, color: '#6b7280', bg: 'rgba(107,114,128,0.06)' },
        ].map(s => (
          <div key={s.label} style={{ background: s.bg, border: `1px solid ${s.color}20`, borderRadius: 8, padding: '8px 12px', textAlign: 'center' }}>
            <div style={{ fontSize: 20, fontWeight: 800, color: s.color }}>{s.val}</div>
            <div style={{ fontSize: 9, color: 'var(--txt3)', textTransform: 'uppercase', letterSpacing: 0.5, marginTop: 2 }}>{s.label}</div>
          </div>
        ))}
      </div>

      {/* Filters Row */}
      <div style={{ display: 'flex', gap: 10, marginBottom: 12, alignItems: 'center' }}>
        <div style={{ flex: 1, position: 'relative' }}>
          <span style={{ position: 'absolute', left: 10, top: '50%', transform: 'translateY(-50%)', color: 'var(--txt3)', fontSize: 13 }}>⌕</span>
          <input
            style={{ width: '100%', background: 'var(--bg2)', border: '1px solid var(--bdr)', borderRadius: 6, padding: '6px 10px 6px 28px', fontSize: 11, color: 'var(--txt)', outline: 'none' }}
            placeholder="Search logs..."
            value={search}
            onChange={e => { setSearch(e.target.value); setPage(1); }}
          />
        </div>
        <select
          style={{ background: 'var(--bg2)', border: '1px solid var(--bdr)', borderRadius: 6, padding: '6px 10px', fontSize: 11, color: 'var(--txt)', outline: 'none' }}
          value={filterCS}
          onChange={e => { setFilterCS(e.target.value); setPage(1); }}
        >
          <option value="">All Statuses</option>
          {Object.keys(CONNECT_STATUS_COLORS).map(k => <option key={k} value={k}>{k}</option>)}
        </select>
        <div style={{ fontSize: 10, color: 'var(--txt3)', whiteSpace: 'nowrap' }}>
          {totalCount} records
        </div>
      </div>

      {/* Table */}
      <div style={{ border: '1px solid var(--bdr)', borderRadius: 8, overflow: 'hidden' }}>
        {/* Table Header */}
        <div style={{ display: 'grid', gridTemplateColumns: '30px 100px 1.3fr 1.3fr 1.6fr 110px 80px', background: 'var(--bg-top)', borderBottom: '1px solid var(--bdr)', padding: '6px 10px', gap: 6 }}>
          {['#', 'Date & Time', 'Connect Status', 'Disposition', 'Sub-Disposition', 'Agent', 'Amount'].map(h => (
            <div key={h} style={{ fontSize: 9, fontWeight: 700, color: 'var(--txt3)', textTransform: 'uppercase', letterSpacing: 0.4 }}>{h}</div>
          ))}
        </div>

        {/* Rows */}
        <div style={{ maxHeight: '55vh', overflowY: 'auto', background: 'var(--bg2)' }}>
          {loading ? (
            <div style={{ padding: '40px', textAlign: 'center', color: 'var(--txt3)' }}>
              <div style={{ fontSize: 24, marginBottom: 8 }}>⏳</div>Loading...
            </div>
          ) : !logs.length ? (
            <div style={{ padding: '40px', textAlign: 'center', color: 'var(--txt3)' }}>
              <div style={{ fontSize: 24, marginBottom: 8 }}>📭</div>No logs match your filter.
            </div>
          ) : (
            logs.map((log, idx) => {
              const d = log.details as any;
              const csColor = CONNECT_STATUS_COLORS[d?.connectStatus] || '#6b7280';
              const ts = new Date(log.timestamp);
              const dateStr = ts.toLocaleDateString('en-IN', { day: '2-digit', month: 'short' });
              const timeStr = ts.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' });
              const rowNum = (page - 1) * PAGE_SIZE + idx + 1;
              const isExp = expanded === log.id;

              return (
                <div key={log.id}
                  onClick={() => setExpanded(isExp ? null : log.id)}
                  style={{
                    display: 'flex', flexDirection: 'column',
                    borderBottom: idx < logs.length - 1 ? '1px solid var(--faint)' : 'none',
                    cursor: 'pointer',
                    background: isExp ? 'rgba(79,125,255,0.03)' : 'transparent',
                    transition: 'background 0.1s'
                  }}
                >
                  <div style={{ display: 'grid', gridTemplateColumns: '30px 100px 1.3fr 1.3fr 1.6fr 110px 80px', padding: '7px 10px', gap: 6, alignItems: 'center' }}>
                    <div style={{ fontSize: 10, color: 'var(--txt3)' }}>{rowNum}</div>
                    <div>
                      <div style={{ fontSize: 10, color: 'var(--txt)', fontWeight: 600 }}>{dateStr}</div>
                      <div style={{ fontSize: 9, color: 'var(--txt3)' }}>{timeStr}</div>
                    </div>
                    <div>
                      <span style={{ background: `${csColor}15`, color: csColor, border: `1px solid ${csColor}30`, borderRadius: 4, padding: '2px 6px', fontSize: 9, fontWeight: 700 }}>
                        {d?.connectStatus || '—'}
                      </span>
                    </div>
                    <div style={{ fontSize: 10, color: 'var(--txt2)' }}>{d?.disposition || '—'}</div>
                    <div style={{ fontSize: 10, color: 'var(--txt3)' }}>{d?.subDisposition || '—'}</div>
                    <div style={{ fontSize: 10, color: 'var(--txt2)', display: 'flex', flexDirection: 'column' }}>
                      <span>{log.user?.name || '—'}</span>
                      {log.user?.empId && <span style={{ color: 'var(--txt3)', fontSize: 9 }}>({log.user.empId})</span>}
                    </div>
                    <div style={{ fontSize: 10, color: d?.amount ? '#22c55e' : 'var(--txt3)', fontWeight: d?.amount ? 700 : 400 }}>
                      {d?.amount ? `₹${Number(d.amount).toLocaleString('en-IN')}` : '—'}
                    </div>
                  </div>

                  {/* Expanded remarks row - ALWAYS SHOWN */}
                  {(d && Object.keys(d).length > 0) && (
                    <div style={{ padding: '0 10px 8px 46px', display: 'flex', gap: 12, flexWrap: 'wrap' }}>
                      {d?.remarks && (
                        <div style={{ fontSize: 11, color: 'var(--txt3)', background: 'var(--bg3)', padding: '5px 8px', borderRadius: 4, borderLeft: '2px solid rgba(79,125,255,0.4)', fontStyle: 'italic', flex: 1 }}>
                          "{d.remarks}"
                        </div>
                      )}
                      <div style={{ display: 'flex', gap: 10, alignItems: 'center', flexShrink: 0, flexWrap: 'wrap' }}>
                        {d?.date && <span style={{ fontSize: 10, color: 'var(--txt3)' }}>📅 PTP Date: {d.date}</span>}
                        {d?.altNumber && <span style={{ fontSize: 10, color: 'var(--txt2)' }}>📱 Alt: {d.altNumber}</span>}
                        {d?.callDrop && d.callDrop !== 'No' && <span style={{ fontSize: 10, color: '#ef4444', background: 'rgba(239,68,68,0.1)', padding: '1px 5px', borderRadius: 3 }}>⚠ Call Drop: {d.callDrop}</span>}
                        {d?.upgradeFlag && (
                          <span style={{ fontSize: 10, color: 'var(--pur)', background: 'var(--purbg)', border: '1px solid rgba(167,139,250,0.3)', padding: '1px 5px', borderRadius: 3 }}>
                            ⭐ {d.upgradeFlag} {d.upgradeType ? `(${d.upgradeType})` : d.upgradeReason ? `(${d.upgradeReason})` : ''}
                          </span>
                        )}
                        {/* Dynamic render for any other fields not explicitly handled */}
                        {Object.entries(d || {})
                          .filter(([k, v]) => !['connectStatus', 'disposition', 'subDisposition', 'remarks', 'callDrop', 'altNumber', 'userId', 'amount', 'date', 'upgradeFlag', 'upgradeType', 'upgradeReason'].includes(k) && v !== null && v !== undefined && v !== '')
                          .map(([k, v]) => (
                            <span key={k} style={{ fontSize: 10, color: 'var(--txt2)', background: 'var(--faint)', border: '1px solid var(--bdr)', padding: '1px 5px', borderRadius: 3 }}>
                              {k.replace(/([A-Z])/g, ' $1').trim().toUpperCase()}: {String(v)}
                            </span>
                          ))
                        }
                      </div>
                    </div>
                  )}
                </div>
              );
            })
          )}
        </div>
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: 12 }}>
          <div style={{ fontSize: 10, color: 'var(--txt3)' }}>
            Page {page} of {totalPages}
          </div>
          <div style={{ display: 'flex', gap: 4 }}>
            <button className="btn sm" onClick={() => setPage(1)} disabled={page === 1} style={{ opacity: page === 1 ? 0.4 : 1, padding: '4px 8px', fontSize: 10 }}>«</button>
            <button className="btn sm" onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page === 1} style={{ opacity: page === 1 ? 0.4 : 1, padding: '4px 8px', fontSize: 10 }}>‹ Prev</button>
            {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
              const p = Math.max(1, Math.min(totalPages - 4, page - 2)) + i;
              return (
                <button key={p} className="btn sm"
                  onClick={() => setPage(p)}
                  style={{ background: p === page ? 'var(--acc)' : 'transparent', color: p === page ? '#fff' : 'var(--txt2)', border: '1px solid var(--bdr)', minWidth: 26, padding: '4px 0', fontSize: 10 }}>
                  {p}
                </button>
              );
            })}
            <button className="btn sm" onClick={() => setPage(p => Math.min(totalPages, p + 1))} disabled={page === totalPages} style={{ opacity: page === totalPages ? 0.4 : 1, padding: '4px 8px', fontSize: 10 }}>Next ›</button>
            <button className="btn sm" onClick={() => setPage(totalPages)} disabled={page === totalPages} style={{ opacity: page === totalPages ? 0.4 : 1, padding: '4px 8px', fontSize: 10 }}>»</button>
          </div>
        </div>
      )}
    </div>
  );
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
  const [upgradeFlag, setUpgradeFlag] = useState('');
  const [upgradeType, setUpgradeType] = useState('');
  const [upgradeReason, setUpgradeReason] = useState('');

  const dispositions = connectStatus && DISPOSITION_LOGIC[connectStatus] ? Object.keys(DISPOSITION_LOGIC[connectStatus]) : [];
  const subDispositions = connectStatus && disposition && DISPOSITION_LOGIC[connectStatus][disposition] ? DISPOSITION_LOGIC[connectStatus][disposition] : [];
  const activeLogic = subDispositions.find((s: any) => s.name === subDisposition) || {};

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
          remarks,
          upgradeFlag,
          upgradeType,
          upgradeReason
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
            {subDispositions.map((s: any) => <option key={s.name} value={s.name}>{s.name}</option>)}
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

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 15, marginBottom: 20 }}>
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

      {lead?.eligible_upgrade === 'Y' && (
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 15, marginBottom: 20 }}>
          <div className="ff">
            <label>UPGRADE FLAG</label>
            <select className="finp" value={upgradeFlag} onChange={e => { setUpgradeFlag(e.target.value); setUpgradeType(''); setUpgradeReason(''); }}>
              <option value="">— Select —</option>
              <option value="Upgraded">Upgraded</option>
              <option value="Pending For Upgrade">Pending For Upgrade</option>
            </select>
          </div>
          {upgradeFlag === 'Upgraded' && (
            <div className="ff">
              <label>UPGRADE TYPE</label>
              <select className="finp" value={upgradeType} onChange={e => setUpgradeType(e.target.value)}>
                <option value="">— Select —</option>
                <option value="System">System</option>
                <option value="Payment Received">Payment Received</option>
                <option value="Money Collection">Money Collection</option>
                <option value="Reversal">Reversal</option>
              </select>
            </div>
          )}
          {upgradeFlag === 'Pending For Upgrade' && (
            <div className="ff">
              <label>UPGRADE REASON</label>
              <select className="finp" value={upgradeReason} onChange={e => setUpgradeReason(e.target.value)}>
                <option value="">— Select —</option>
                <option value="Multi Card Payment Due">Multi Card Payment Due</option>
                <option value="ONE Card Write Off">ONE Card Write Off</option>
                <option value="Multi Card Write Off">Multi Card Write Off</option>
                <option value="Card Settlement">Card Settlement</option>
                <option value="Card Settlement (J5/J6)">Card Settlement (J5/J6)</option>
                <option value="Intrest Payment Due">Intrest Payment Due</option>
                <option value="Customer Refused to Pay">Customer Refused to Pay</option>
                <option value="Customer Not Contactable">Customer Not Contactable</option>
              </select>
            </div>
          )}
        </div>
      )}

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
  const [isTableMaximized, setIsTableMaximized] = useState(false);

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
      const res = await fetch(`/api/metadata?t=${Date.now()}`, { cache: 'no-store' });
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
      query.append('t', Date.now().toString());

      const res = await fetch(`/api/leads?${query.toString()}`, { cache: 'no-store' });
      const data = await res.json();
      if (Array.isArray(data)) {
        setLeads(data);
        if (data.length > 0) {
          // If current selection is not in the new data, pick the first one
          if (!selectedLead || !data.find((l: any) => l.id === selectedLead.id)) {
            setSelectedLead(data[0]);
          }
        } else {
          setSelectedLead(null);
        }
      } else {
        setLeads([]);
        setSelectedLead(null);
        console.error('API did not return an array:', data);
      }
    } catch (error) {
      console.error('Error fetching leads:', error);
      setLeads([]);
    } finally {
      setLoading(false);
    }
  };

  const tableCols = leadColumns.filter(c => c.visible !== false && c.key?.toLowerCase() !== 'eligible_for_update');
  const profileCols = leadColumns.filter(c => c.showInProfile !== false && c.key?.toLowerCase() !== 'eligible_for_update');

  if (!profileCols.find(c => c.key?.toLowerCase() === 'eligible_upgrade')) {
    profileCols.push({ key: 'eligible_upgrade', label: 'ELIGIBLE UPGRADE', type: 'text' });
  }
  if (!tableCols.find(c => c.key?.toLowerCase() === 'eligible_upgrade')) {
    tableCols.push({ key: 'eligible_upgrade', label: 'ELIGIBLE UPGRADE', type: 'text' });
  }

  return (
    <div id="pg-leads" className="page on">
      <div className="leads-outer">
        {/* CUSTOMER DASHBOARD HEADER */}
        {!isTableMaximized && (
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
                    <div key={i} style={{ background: 'var(--bg3)', padding: '8px 12px', borderRadius: 6, border: '1px solid var(--faint)' }}>
                      <div className="skel" style={{ width: '60%', height: 9, marginBottom: 4 }} />
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
                      {selectedLead.name?.split(' ').map((n: any) => n[0]).join('').substring(0, 2)}
                    </div>
                    <div>
                      <div style={{ fontSize: 18, fontWeight: 700, color: 'var(--txt)', marginBottom: 4 }}>{selectedLead.name}</div>
                      <div style={{ fontSize: 12, color: 'var(--txt3)' }}>
                        {selectedLead.account_no} - {selectedLead.product || 'Personal Loan'} - {selectedLead.bank || 'HDFC Bank'}
                      </div>
                    </div>
                  </div>
                  <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                    <div style={{ display: 'flex', gap: 6, alignItems: 'center', marginRight: 10 }}>
                      <select
                        className="finp"
                        style={{ fontSize: 11, padding: '4px 8px', width: 'auto', background: 'var(--bg3)', borderRadius: 16, border: '1px solid var(--bdr)' }}
                        value={filterMonth}
                        onChange={e => setFilterMonth(e.target.value)}
                      >
                        {Array.from({ length: 12 }).map((_, i) => <option key={i + 1} value={i + 1}>{new Date(2000, i, 1).toLocaleString('default', { month: 'short' })}</option>)}
                      </select>
                      <select
                        className="finp"
                        style={{ fontSize: 11, padding: '4px 8px', width: 'auto', background: 'var(--bg3)', borderRadius: 16, border: '1px solid var(--bdr)' }}
                        value={filterYear}
                        onChange={e => setFilterYear(e.target.value)}
                      >
                        {[0, 1, 2, 3, 4].map(y => {
                          const yr = new Date().getFullYear() - y;
                          return <option key={yr} value={yr}>{yr}</option>
                        })}
                      </select>
                    </div>
                    <button className="btn sm" style={{ background: 'transparent', border: '1px solid var(--bdr)', color: 'var(--grn)', padding: '6px 12px' }}>💳 Payment</button>
                    <button className="btn sm" style={{ background: 'transparent', border: '1px solid var(--bdr)', color: 'var(--amb)', padding: '6px 12px' }}
                      onClick={() => openModal(`📞 Call Logs — ${selectedLead.name}`, <CallLogsModal lead={selectedLead} />, 1100)}
                    >📞 Call Logs</button>
                    <button
                      className="btn sm"
                      style={{ background: 'rgba(79,125,255,0.1)', border: '1px solid rgba(79,125,255,0.3)', color: 'var(--acc2)', padding: '6px 12px' }}
                      onClick={() => openModal('Edit Lead Disposition', <EditLeadModal lead={selectedLead} onDone={fetchLeads} />)}
                    >
                      ✎ VOC UPDATE
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
                    const lowerKey = item.key?.toLowerCase();
                    const rawVal = selectedLead[item.key] ?? selectedLead[lowerKey]
                      ?? selectedLead.metadata?.[item.key] ?? selectedLead.metadata?.[lowerKey]
                      ?? selectedLead.metadata?.[item.label] ?? selectedLead.metadata?.[item.label?.toUpperCase()] ?? '—';
                    const val = (rawVal && typeof rawVal === 'object') ? (rawVal.name || rawVal.label || '—') : rawVal;
                    return (
                      <div key={i} style={{ background: 'var(--bg3)', padding: '8px 12px', borderRadius: 6, border: '1px solid var(--faint)', overflow: 'hidden' }}>
                        <div style={{ fontSize: 9, color: 'var(--txt3)', textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: 4, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }} title={item.label}>{item.label}</div>
                        <div style={{ fontSize: 12, color: item.type === 'amount' ? 'var(--red)' : 'var(--txt)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }} title={String(val)}>
                          {item.type === 'amount' ? `₹${Number(val).toLocaleString('en-IN')}` : String(val)}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}
          </div>
        )}

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
          <SButton size="slim" variant="secondary" onClick={() => setShowFilters(!showFilters)}>⊞ More {showFilters ? '▲' : '▼'}</SButton>
          <span style={{ fontSize: 12, color: 'var(--txt3)', marginLeft: 'auto', display: 'flex', alignItems: 'center', gap: 10 }}>
            {leads.length} records
            <button
              onClick={() => setIsTableMaximized(!isTableMaximized)}
              style={{ background: 'transparent', border: 'none', cursor: 'pointer', color: 'var(--txt2)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '4px', borderRadius: 4, transition: '0.2s', backgroundColor: 'var(--bg3)' }}
              title={isTableMaximized ? "Restore Layout" : "Maximize Table"}
            >
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                {isTableMaximized ? (
                  <>
                    <polyline points="4 14 12 22 20 14"></polyline>
                    <line x1="12" y1="2" x2="12" y2="22"></line>
                  </>
                ) : (
                  <>
                    <polyline points="4 10 12 2 20 10"></polyline>
                    <line x1="12" y1="2" x2="12" y2="22"></line>
                  </>
                )}
              </svg>
            </button>
          </span>
        </div>

        {/* FILTER ROW */}
        {showFilters && (
          <div id="fRow" style={{ display: 'flex', padding: '10px 20px', background: 'var(--bg2)', borderBottom: '1px solid var(--bdr)', gap: 10, flexWrap: 'wrap', alignItems: 'center' }}>
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
              setStatusFilter(''); setDpdMin(''); setDpdMax(''); setOutMin(''); setPortfolioFilter(''); setSearch(''); setFilterTab('all');
            }}>Clear Filters</SButton>
          </div>
        )}

        {/* RESULTS AREA */}
        <div className="result-area" style={{ flex: 1, overflow: 'auto', background: 'var(--bg2)' }}>
          <table className="tbl" style={{ width: '100%', borderCollapse: 'collapse', whiteSpace: 'nowrap' }}>
            <thead>
              <tr style={{ borderBottom: '1px solid var(--bdr)' }}>
                {tableCols.length > 0 ? tableCols.map(col => (
                  <th key={col.key} style={{ background: 'var(--bg2)', position: 'sticky', top: 0, zIndex: 10, border: 'none', padding: '12px 10px', color: 'var(--txt3)', fontSize: 10, textTransform: 'uppercase', letterSpacing: 0.5, textAlign: 'left' }}>
                    {col.label}
                  </th>
                )) : (
                  <>
                    <th style={{ background: 'var(--bg2)', position: 'sticky', top: 0, zIndex: 10, border: 'none', padding: '12px 20px', color: 'var(--txt3)', fontSize: 10, textTransform: 'uppercase', letterSpacing: 0.5 }}>Account Number</th>
                    <th style={{ background: 'var(--bg2)', position: 'sticky', top: 0, zIndex: 10, border: 'none', padding: '12px 10px', color: 'var(--txt3)', fontSize: 10, textTransform: 'uppercase', letterSpacing: 0.5 }}>Customer Name</th>
                    <th style={{ background: 'var(--bg2)', position: 'sticky', top: 0, zIndex: 10, border: 'none', padding: '12px 10px', color: 'var(--txt3)', fontSize: 10, textTransform: 'uppercase', letterSpacing: 0.5 }}>Mobile Number</th>
                    <th style={{ background: 'var(--bg2)', position: 'sticky', top: 0, zIndex: 10, border: 'none', padding: '12px 10px', color: 'var(--txt3)', fontSize: 10, textTransform: 'uppercase', letterSpacing: 0.5 }}>Outstanding</th>
                    <th style={{ background: 'var(--bg2)', position: 'sticky', top: 0, zIndex: 10, border: 'none', padding: '12px 10px', color: 'var(--txt3)', fontSize: 10, textTransform: 'uppercase', letterSpacing: 0.5 }}>Status</th>
                  </>
                )}
                <th style={{ background: 'var(--bg2)', position: 'sticky', top: 0, zIndex: 10, border: 'none', padding: '12px 20px', color: 'var(--txt3)', fontSize: 10, textTransform: 'uppercase', letterSpacing: 0.5 }}>Assigned To</th>
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
                    const lowerKey = col.key?.toLowerCase();
                    const rawVal = lead[col.key] ?? lead[lowerKey]
                      ?? lead.metadata?.[col.key] ?? lead.metadata?.[lowerKey]
                      ?? lead.metadata?.[col.label] ?? lead.metadata?.[col.label?.toUpperCase()] ?? '—';
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
