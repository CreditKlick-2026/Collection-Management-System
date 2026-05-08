"use client";
import React, { useState, useEffect } from 'react';
import { Phone, ArrowLeft, Search } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/hooks/useAuth';
import AuthenticatedLayout from '../layout_authenticated';

export default function CallLogsPage() {
  const { user } = useAuth();
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [logs, setLogs] = useState<any[]>([]);
  const [agents, setAgents] = useState<any[]>([]);

  // Filters & Pagination
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');
  const [actionDate, setActionDate] = useState('');
  const [agentId, setAgentId] = useState('all');
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [pageInput, setPageInput] = useState('1');
  
  // Fetch agents for filter
  useEffect(() => {
    if (!user) return;
    const fetchAgents = async () => {
      try {
        const res = await fetch(`/api/admin/users?requesterId=${user.id}`);
        if (res.ok) {
          const data = await res.json();
          setAgents(Array.isArray(data) ? data : []);
        }
      } catch (err) {
        console.error('Error fetching agents:', err);
      }
    };
    fetchAgents();
  }, [user]);

  const fetchLogs = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (dateFrom) params.append('dateFrom', dateFrom);
      if (dateTo) params.append('dateTo', dateTo);
      if (actionDate) params.append('actionDate', actionDate);
      if (agentId !== 'all') params.append('agentId', agentId);
      params.append('page', page.toString());
      params.append('limit', '50');

      const res = await fetch(`/api/admin/call-logs?${params.toString()}`);
      if (res.ok) {
        const data = await res.json();
        setLogs(data.logs || []);
        setTotalPages(data.totalPages || 1);
      }
    } catch (err) {
      console.error('Error fetching call logs:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLogs();
  }, [dateFrom, dateTo, actionDate, agentId, page]);

  useEffect(() => {
    setPageInput(String(page));
  }, [page]);

  const handleJump = () => {
    const val = parseInt(pageInput);
    if (!isNaN(val) && val >= 1 && val <= totalPages) {
      setPage(val);
    } else {
      setPageInput(String(page));
    }
  };

  const skeletonRows = [...Array(30)].map((_, i) => (
    <tr key={i} style={{ height: 45 }}>
      <td><div className="skel" style={{ height: 12, width: 100 }} /></td>
      <td><div className="skel" style={{ height: 12, width: 90 }} /></td>
      <td><div className="skel" style={{ height: 12, width: 120 }} /></td>
      <td><div className="skel" style={{ height: 12, width: 80 }} /></td>
      <td><div className="skel" style={{ height: 20, width: 100, borderRadius: 20 }} /></td>
      <td><div className="skel" style={{ height: 12, width: 100 }} /></td>
      <td><div className="skel" style={{ height: 12, width: 90 }} /></td>
      <td><div className="skel" style={{ height: 12, width: 50 }} /></td>
      <td><div className="skel" style={{ height: 12, width: 250, margin: '0 auto' }} /></td>
    </tr>
  ));

  return (
    <AuthenticatedLayout>
      <style>{`
        @keyframes pulse {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.4; }
        }
        .skel {
          background: var(--bg3);
          border-radius: 4px;
          animation: pulse 1.5s cubic-bezier(0.4, 0, 0.6, 1) infinite;
        }
      `}</style>
      <div style={{ flex: 1, padding: 0, overflowY: 'hidden', display: 'flex', flexDirection: 'column', height: '100vh' }}>
        
        {/* Compact Filter Bar */}
        <div style={{ 
          background: 'var(--bg1)', 
          padding: '10px 20px', 
          borderBottom: '1px solid var(--bdr)', 
          display: 'flex', 
          alignItems: 'flex-end', 
          gap: 15,
          zIndex: 20
        }}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
            <span style={{ fontSize: 9, fontWeight: 800, color: 'var(--txt3)', textTransform: 'uppercase', letterSpacing: 0.5 }}>From Date</span>
            <input type="date" value={dateFrom} onChange={(e) => setDateFrom(e.target.value)} style={{ padding: '6px 10px', background: 'var(--bg3)', border: '1px solid var(--bdr)', borderRadius: 6, fontSize: 11, color: 'var(--txt)', outline: 'none' }} />
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
            <span style={{ fontSize: 9, fontWeight: 800, color: 'var(--txt3)', textTransform: 'uppercase', letterSpacing: 0.5 }}>To Date</span>
            <input type="date" value={dateTo} onChange={(e) => setDateTo(e.target.value)} style={{ padding: '6px 10px', background: 'var(--bg3)', border: '1px solid var(--bdr)', borderRadius: 6, fontSize: 11, color: 'var(--txt)', outline: 'none' }} />
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
            <span style={{ fontSize: 9, fontWeight: 800, color: 'var(--txt3)', textTransform: 'uppercase', letterSpacing: 0.5 }}>Action Date (VOC)</span>
            <input type="date" value={actionDate} onChange={(e) => setActionDate(e.target.value)} style={{ padding: '6px 10px', background: 'var(--bg3)', border: '1px solid var(--bdr)', borderRadius: 6, fontSize: 11, color: 'var(--txt)', outline: 'none' }} />
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
            <span style={{ fontSize: 9, fontWeight: 800, color: 'var(--txt3)', textTransform: 'uppercase', letterSpacing: 0.5 }}>Filter by Agent</span>
            <select value={agentId} onChange={(e) => setAgentId(e.target.value)} style={{ padding: '6px 10px', background: 'var(--bg3)', border: '1px solid var(--bdr)', borderRadius: 6, fontSize: 11, color: 'var(--txt)', outline: 'none', minWidth: 150 }}>
              <option value="all">All Agents</option>
              {agents.map(a => <option key={a.id} value={a.id}>{a.name} ({a.empId})</option>)}
            </select>
          </div>
          <button 
            onClick={() => {
              setDateFrom('');
              setDateTo('');
              setActionDate('');
              setAgentId('all');
              setPage(1);
            }}
            className="btn"
            style={{ padding: '7px 15px', background: 'var(--bg3)', border: '1px solid var(--bdr)', borderRadius: 6, fontSize: 11, fontWeight: 700, color: 'var(--txt2)', marginLeft: 'auto' }}
          >
            Clear Filters
          </button>
        </div>

        <div style={{ flex: 1, background: 'var(--bg2)', display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
          
          {loading ? (
            <div style={{ padding: 0, overflow: 'hidden', border: 'none', flex: 1, display: 'flex', flexDirection: 'column' }}>
              <div style={{ overflowX: 'auto', flex: 1 }}>
                <table className="tbl" style={{ minWidth: 1200 }}>
                  <thead style={{ background: 'var(--bg2)', boxShadow: '0 1px 0 var(--bdr)' }}>
                    <tr>
                      <th style={{ fontSize: 10, textTransform: 'uppercase' }}>Log Time</th>
                      <th style={{ fontSize: 10, textTransform: 'uppercase' }}>Account No</th>
                      <th style={{ fontSize: 10, textTransform: 'uppercase' }}>Customer Name</th>
                      <th style={{ fontSize: 10, textTransform: 'uppercase' }}>Action Date (VOC)</th>
                      <th style={{ fontSize: 10, textTransform: 'uppercase' }}>Connect Status</th>
                      <th style={{ fontSize: 10, textTransform: 'uppercase' }}>Disposition</th>
                      <th style={{ fontSize: 10, textTransform: 'uppercase' }}>Agent</th>
                      <th style={{ fontSize: 10, textTransform: 'uppercase' }}>Amount</th>
                      <th style={{ fontSize: 10, textAlign: 'center', textTransform: 'uppercase' }}>Remarks</th>
                    </tr>
                  </thead>
                  <tbody>{skeletonRows}</tbody>
                </table>
              </div>
            </div>
          ) : logs.length === 0 ? (
            <div style={{ padding: '60px 20px', textAlign: 'center' }}>
              <Phone size={48} color="var(--txt3)" style={{ margin: '0 auto 16px', opacity: 0.5 }} />
              <h3 style={{ fontSize: 18, fontWeight: 600, color: 'var(--txt)', marginBottom: 8 }}>No Call Logs Found</h3>
              <p style={{ color: 'var(--txt2)', maxWidth: 400, margin: '0 auto' }}>There are currently no call logs available.</p>
            </div>
          ) : (
            <div style={{ padding: 0, overflow: 'hidden', border: 'none', flex: 1, display: 'flex', flexDirection: 'column' }}>
              <div style={{ overflowX: 'auto', flex: 1 }}>
                <table className="tbl" style={{ minWidth: 1200, borderCollapse: 'separate', borderSpacing: 0 }}>
                  <thead style={{ position: 'sticky', top: 0, zIndex: 10, background: 'var(--bg2)', boxShadow: '0 1px 0 var(--bdr)' }}>
                    <tr>
                      <th style={{ fontSize: 10, textTransform: 'uppercase' }}>Log Time</th>
                      <th style={{ fontSize: 10, textTransform: 'uppercase' }}>Account No</th>
                      <th style={{ fontSize: 10, textTransform: 'uppercase' }}>Customer Name</th>
                      <th style={{ fontSize: 10, textTransform: 'uppercase' }}>Action Date (VOC)</th>
                      <th style={{ fontSize: 10, textTransform: 'uppercase' }}>Connect Status</th>
                      <th style={{ fontSize: 10, textTransform: 'uppercase' }}>Disposition</th>
                      <th style={{ fontSize: 10, textTransform: 'uppercase' }}>Agent</th>
                      <th style={{ fontSize: 10, textTransform: 'uppercase' }}>Amount</th>
                      <th style={{ fontSize: 10, textAlign: 'center', textTransform: 'uppercase' }}>Remarks</th>
                    </tr>
                  </thead>
                  <tbody>
                    {logs.map(log => (
                      <tr key={log.id} style={{ height: 45 }}>
                        <td style={{ fontSize: 10.5, color: 'var(--txt3)' }}>{new Date(log.timestamp).toLocaleString()}</td>
                        <td style={{ fontWeight: 700, fontSize: 11.5 }}>{log.accountNo}</td>
                        <td style={{ fontSize: 11.5 }}>{log.customerName}</td>
                        <td style={{ color: 'var(--acc)', fontWeight: 700, fontSize: 11.5 }}>
                          {log.actionDate ? new Date(log.actionDate).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' }) : '—'}
                        </td>
                        <td>
                          <span className="badge" style={{ 
                            background: log.connectStatus?.includes('Right') ? 'rgba(46,204,138,0.12)' : 'rgba(79,125,255,0.12)',
                            color: log.connectStatus?.includes('Right') ? 'var(--grn)' : 'var(--acc2)',
                            fontSize: 8.5, fontWeight: 800, padding: '4px 10px', borderRadius: 20,
                            border: `1px solid ${log.connectStatus?.includes('Right') ? 'var(--grn)30' : 'var(--acc2)30'}`,
                            textTransform: 'uppercase', letterSpacing: 0.5
                          }}>{log.connectStatus}</span>
                        </td>
                        <td style={{ fontSize: 11, fontWeight: 500 }}>{log.disposition}</td>
                        <td>
                          <div style={{ fontSize: 11, fontWeight: 600 }}>{log.agent?.name}</div>
                          <div style={{ fontSize: 9, color: 'var(--txt3)', marginTop: -2 }}>{log.agent?.empId}</div>
                        </td>
                        <td style={{ fontWeight: 700, fontSize: 12, color: 'var(--txt)' }}>{log.amount ? `₹${log.amount}` : '—'}</td>
                        <td style={{ fontSize: 10.5, color: 'var(--txt2)', minWidth: 350, textAlign: 'center' }}>
                          <div style={{ wordBreak: 'break-word', lineHeight: '1.4', whiteSpace: 'normal', padding: '0 10px' }}>{log.remarks}</div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {!loading && totalPages > 1 && (
            <div style={{ display: 'flex', justifyContent: 'flex-end', alignItems: 'center', gap: 16, padding: '16px 24px', background: 'var(--bg2)', borderTop: '1px solid var(--bdr)' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginRight: 'auto' }}>
                <span style={{ fontSize: 12, color: 'var(--txt3)', fontWeight: 600, textTransform: 'uppercase', letterSpacing: 0.5 }}>Go to Page:</span>
                <input 
                  type="number" min={1} max={totalPages} value={pageInput}
                  onChange={(e) => setPageInput(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && handleJump()}
                  style={{ width: 70, padding: '8px 12px', background: 'var(--bg3)', border: '1px solid var(--bdr)', borderRadius: 6, fontSize: 13, color: 'var(--txt)', outline: 'none', textAlign: 'center', fontWeight: 600 }}
                />
                <button onClick={handleJump} className="btn" style={{ background: 'var(--acc)', color: '#fff', padding: '8px 16px', borderRadius: 6, fontSize: 12, fontWeight: 700, textTransform: 'uppercase' }}>Go</button>
              </div>
              <button onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page === 1} className="btn" style={{ padding: '8px 16px', background: 'var(--bg3)', border: '1px solid var(--bdr)', borderRadius: 6, opacity: page === 1 ? 0.5 : 1, cursor: page === 1 ? 'not-allowed' : 'pointer', color: 'var(--txt)' }}>Previous</button>
              <span style={{ fontSize: 13, color: 'var(--txt2)' }}>Page <b>{page}</b> of <b>{totalPages}</b></span>
              <button onClick={() => setPage(p => Math.min(totalPages, p + 1))} disabled={page === totalPages} className="btn" style={{ padding: '8px 16px', background: 'var(--bg3)', border: '1px solid var(--bdr)', borderRadius: 6, opacity: page === totalPages ? 0.5 : 1, cursor: page === totalPages ? 'not-allowed' : 'pointer', color: 'var(--txt)' }}>Next</button>
            </div>
          )}
        </div>
      </div>
    </AuthenticatedLayout>
  );
}
