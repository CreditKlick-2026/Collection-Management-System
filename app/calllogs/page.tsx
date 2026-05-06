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
  const [agentId, setAgentId] = useState('all');
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  
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
      if (agentId !== 'all') params.append('agentId', agentId);
      params.append('page', page.toString());
      params.append('limit', '20');

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
  }, [dateFrom, dateTo, agentId, page]);

  return (
    <AuthenticatedLayout>
      <div style={{ flex: 1, padding: '24px 32px', overflowY: 'auto' }}>
        
        {/* Header */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 16, marginBottom: 24 }}>
          <button 
            onClick={() => router.push('/')}
            className="btn" 
            style={{ background: 'var(--bg2)', border: '1px solid var(--bdr)', padding: '8px', color: 'var(--txt)' }}
          >
            <ArrowLeft size={16} />
          </button>
          <Phone size={24} color="var(--acc)" />
          <h1 style={{ fontSize: 24, fontWeight: 700, margin: 0 }}>Global Call Logs</h1>
        </div>

        <div style={{ background: 'var(--bg2)', borderRadius: 12, padding: 20, boxShadow: '0 4px 20px rgba(0,0,0,0.05)', border: '1px solid var(--bdr)' }}>
          
          {/* Filters */}
          <div style={{ display: 'flex', gap: 16, marginBottom: 20, flexWrap: 'wrap', alignItems: 'flex-end', paddingBottom: 16, borderBottom: '1px solid var(--bdr)' }}>
            <div className="ff" style={{ margin: 0, minWidth: 150 }}>
              <label style={{ fontSize: 10, color: 'var(--txt3)', textTransform: 'uppercase' }}>From Date</label>
              <input type="date" className="finp" value={dateFrom} onChange={e => { setDateFrom(e.target.value); setPage(1); }} />
            </div>
            <div className="ff" style={{ margin: 0, minWidth: 150 }}>
              <label style={{ fontSize: 10, color: 'var(--txt3)', textTransform: 'uppercase' }}>To Date</label>
              <input type="date" className="finp" value={dateTo} onChange={e => { setDateTo(e.target.value); setPage(1); }} />
            </div>
            
            {user?.role !== 'agent' && (
              <div className="ff" style={{ margin: 0, minWidth: 180 }}>
                <label style={{ fontSize: 10, color: 'var(--txt3)', textTransform: 'uppercase' }}>Filter By Agent</label>
                <select className="finp" value={agentId} onChange={e => { setAgentId(e.target.value); setPage(1); }}>
                  <option value="all">All Agents</option>
                  {agents.map(a => (
                    <option key={a.id} value={a.id}>{a.name} ({a.empId})</option>
                  ))}
                </select>
              </div>
            )}

            <button className="btn" onClick={() => {
              setDateFrom(''); setDateTo(''); setAgentId('all'); setPage(1);
            }} style={{ background: 'var(--bg3)', border: '1px solid var(--bdr)', padding: '10px 16px', marginLeft: 'auto' }}>
              Clear Filters
            </button>
          </div>

          {/* Table Area */}
          {loading ? (
            <>
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
              <div className="card" style={{ padding: 0, overflow: 'hidden', border: '1px solid var(--bdr)' }}>
                <div style={{ overflowX: 'auto' }}>
                  <table className="tbl" style={{ minWidth: 1200 }}>
                    <thead style={{ background: 'var(--bg2)', boxShadow: '0 1px 0 var(--bdr)' }}>
                      <tr>
                        <th>Log Time</th>
                        <th>Account No</th>
                        <th>Customer Name</th>
                        <th>Action Date (VOC)</th>
                        <th>Connect Status</th>
                        <th>Disposition</th>
                        <th>Agent</th>
                        <th>Amount</th>
                      </tr>
                    </thead>
                    <tbody>
                      {[...Array(8)].map((_, i) => (
                        <tr key={i}>
                          <td><div className="skel" style={{ height: 14, width: 120 }} /></td>
                          <td><div className="skel" style={{ height: 14, width: 100 }} /></td>
                          <td><div className="skel" style={{ height: 14, width: 130 }} /></td>
                          <td><div className="skel" style={{ height: 14, width: 100 }} /></td>
                          <td><div className="skel" style={{ height: 14, width: 110 }} /></td>
                          <td><div className="skel" style={{ height: 14, width: 110 }} /></td>
                          <td><div className="skel" style={{ height: 14, width: 100 }} /></td>
                          <td><div className="skel" style={{ height: 14, width: 60 }} /></td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </>
          ) : logs.length === 0 ? (
            <div style={{ padding: '60px 20px', textAlign: 'center' }}>
              <Phone size={48} color="var(--txt3)" style={{ margin: '0 auto 16px', opacity: 0.5 }} />
              <h3 style={{ fontSize: 18, fontWeight: 600, color: 'var(--txt)', marginBottom: 8 }}>No Call Logs Found</h3>
              <p style={{ color: 'var(--txt2)', maxWidth: 400, margin: '0 auto' }}>
                There are currently no call logs matching your filter criteria.
              </p>
            </div>
          ) : (
            <div className="card" style={{ padding: 0, overflow: 'hidden', border: '1px solid var(--bdr)' }}>
              <div style={{ overflowX: 'auto', maxHeight: 'calc(100vh - 350px)' }}>
                <table className="tbl" style={{ minWidth: 1200 }}>
                  <thead style={{ position: 'sticky', top: 0, zIndex: 10, background: 'var(--bg2)', boxShadow: '0 1px 0 var(--bdr)' }}>
                    <tr>
                      <th>Log Time</th>
                      <th>Account No</th>
                      <th>Customer Name</th>
                      <th>Action Date (VOC)</th>
                      <th>Connect Status</th>
                      <th>Disposition</th>
                      <th>Agent</th>
                      <th>Amount</th>
                      <th>Remarks</th>
                    </tr>
                  </thead>
                  <tbody>
                    {logs.map(log => (
                      <tr key={log.id}>
                        <td style={{ fontSize: 11, color: 'var(--txt3)' }}>
                          {new Date(log.timestamp).toLocaleString()}
                        </td>
                        <td style={{ fontWeight: 600 }}>{log.accountNo}</td>
                        <td>{log.customerName}</td>
                        <td style={{ color: 'var(--acc)', fontWeight: 600 }}>
                          {log.actionDate ? new Date(log.actionDate).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' }) : '—'}
                        </td>
                        <td>
                          <span className="badge" style={{ 
                            background: log.connectStatus?.includes('Right') ? 'rgba(46,204,138,0.1)' : 'rgba(79,125,255,0.1)',
                            color: log.connectStatus?.includes('Right') ? 'var(--grn)' : 'var(--acc2)',
                            fontSize: 10
                          }}>
                            {log.connectStatus}
                          </span>
                        </td>
                        <td>{log.disposition}</td>
                        <td>
                          <div style={{ fontSize: 12, fontWeight: 500 }}>{log.agent?.name}</div>
                          <div style={{ fontSize: 10, color: 'var(--txt3)' }}>{log.agent?.empId}</div>
                        </td>
                        <td style={{ fontWeight: 600 }}>{log.amount ? `₹${log.amount}` : '—'}</td>
                        <td style={{ fontSize: 11, color: 'var(--txt2)', maxWidth: 200 }}>
                          <div style={{ overflowX: 'auto', whiteSpace: 'nowrap' }}>
                            {log.remarks}
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* Pagination */}
          {!loading && totalPages > 1 && (
            <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', gap: 16, marginTop: 20 }}>
              <button 
                onClick={() => setPage(p => Math.max(1, p - 1))} 
                disabled={page === 1}
                className="btn" 
                style={{ padding: '8px 16px', background: 'var(--bg3)', border: '1px solid var(--bdr)', borderRadius: 6, opacity: page === 1 ? 0.5 : 1, cursor: page === 1 ? 'not-allowed' : 'pointer', color: 'var(--txt)' }}
              >
                Previous
              </button>
              <span style={{ fontSize: 13, color: 'var(--txt2)' }}>
                Page <b>{page}</b> of <b>{totalPages}</b>
              </span>
              <button 
                onClick={() => setPage(p => Math.min(totalPages, p + 1))} 
                disabled={page === totalPages}
                className="btn" 
                style={{ padding: '8px 16px', background: 'var(--bg3)', border: '1px solid var(--bdr)', borderRadius: 6, opacity: page === totalPages ? 0.5 : 1, cursor: page === totalPages ? 'not-allowed' : 'pointer', color: 'var(--txt)' }}
              >
                Next
              </button>
            </div>
          )}

        </div>
      </div>
    </AuthenticatedLayout>
  );
}
