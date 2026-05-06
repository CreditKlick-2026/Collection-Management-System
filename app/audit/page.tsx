"use client";
import React, { useState, useEffect } from 'react';
import { History, ArrowLeft } from 'lucide-react';
import AuditLogsTab from '@/components/admin/AuditLogsTab';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/hooks/useAuth';
import AuthenticatedLayout from '../layout_authenticated';

export default function AuditPage() {
  const { user } = useAuth();
  const router = useRouter();
  const [auditLogs, setAuditLogs] = useState<any[]>([]);
  const [users, setUsers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  // Filters & Pagination
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');
  const [action, setAction] = useState('all');
  const [filterUserId, setFilterUserId] = useState('all');
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  // Fetch subordinate users for Manager/Admin filter dropdown
  useEffect(() => {
    if (!user) return;
    const fetchUsers = async () => {
      if (user.role.toLowerCase() === 'agent') return;
      try {
        const res = await fetch(`/api/admin/users?requesterId=${user.id}`);
        if (res.ok) {
          const data = await res.json();
          setUsers(Array.isArray(data) ? data : []);
        }
      } catch (err) {
        console.error('Error fetching users:', err);
      }
    };
    fetchUsers();
  }, [user]);

  const fetchAuditLogs = async () => {
    if (!user) return;
    setLoading(true);
    try {
      const params = new URLSearchParams({ requesterId: user.id.toString() });
      if (dateFrom) params.append('dateFrom', dateFrom);
      if (dateTo) params.append('dateTo', dateTo);
      if (action !== 'all') params.append('action', action);
      if (filterUserId !== 'all') params.append('userId', filterUserId);
      params.append('page', page.toString());
      params.append('limit', '20');

      const res = await fetch(`/api/admin/audit-logs?${params.toString()}`);
      if (res.ok) {
        const data = await res.json();
        setAuditLogs(data.logs || []);
        setTotalPages(data.totalPages || 1);
      }
    } catch (err) {
      console.error('Error fetching audit logs:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAuditLogs();
  }, [user, dateFrom, dateTo, action, filterUserId, page]);

  if (!user) return null; // AuthenticatedLayout will handle redirect

  return (
    <AuthenticatedLayout>
      <div className="page on" style={{ padding: 20, background: 'transparent' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 20 }}>
          <button 
            onClick={() => router.back()} 
            className="btn" 
            style={{ background: 'var(--bg2)', border: '1px solid var(--bdr)', padding: '8px', color: 'var(--txt)' }}
          >
            <ArrowLeft size={16} />
          </button>
          <History size={24} color="var(--acc)" />
          <h1 style={{ fontSize: 24, fontWeight: 700, margin: 0 }}>System Audit Logs</h1>
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
            
            <div className="ff" style={{ margin: 0, minWidth: 150 }}>
              <label style={{ fontSize: 10, color: 'var(--txt3)', textTransform: 'uppercase' }}>Action Type</label>
              <select className="finp" value={action} onChange={e => { setAction(e.target.value); setPage(1); }}>
                <option value="all">All Actions</option>
                <option value="LOGIN">Logins</option>
                <option value="CREATE">Create</option>
                <option value="UPDATE">Update</option>
                <option value="DELETE">Delete</option>
              </select>
            </div>

            {user.role.toLowerCase() !== 'agent' && (
              <div className="ff" style={{ margin: 0, minWidth: 150 }}>
                <label style={{ fontSize: 10, color: 'var(--txt3)', textTransform: 'uppercase' }}>Filter By User</label>
                <select className="finp" value={filterUserId} onChange={e => { setFilterUserId(e.target.value); setPage(1); }}>
                  <option value="all">All Assigned Users</option>
                  {users.map(u => (
                    <option key={u.id} value={u.id}>{u.name} ({u.empId})</option>
                  ))}
                </select>
              </div>
            )}

            <button className="btn" onClick={() => {
              setDateFrom(''); setDateTo(''); setAction('all'); setFilterUserId('all'); setPage(1);
            }} style={{ background: 'var(--bg3)', border: '1px solid var(--bdr)', padding: '10px 16px', marginLeft: 'auto' }}>
              Clear Filters
            </button>
          </div>

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
                  <table className="tbl" style={{ minWidth: 800 }}>
                    <thead style={{ background: 'var(--bg2)', boxShadow: '0 1px 0 var(--bdr)' }}>
                      <tr>
                        <th>Timestamp</th>
                        <th>User</th>
                        <th>Action</th>
                        <th>Entity</th>
                        <th>Details</th>
                      </tr>
                    </thead>
                    <tbody>
                      {[...Array(6)].map((_, i) => (
                        <tr key={i}>
                          <td><div className="skel" style={{ height: 14, width: 130 }} /></td>
                          <td>
                            <div className="skel" style={{ height: 14, width: 100, marginBottom: 6 }} />
                            <div className="skel" style={{ height: 10, width: 60 }} />
                          </td>
                          <td><div className="skel" style={{ height: 20, width: 90, borderRadius: 12 }} /></td>
                          <td>
                            <div className="skel" style={{ height: 14, width: 70, marginBottom: 6 }} />
                            <div className="skel" style={{ height: 10, width: 40 }} />
                          </td>
                          <td><div className="skel" style={{ height: 14, width: 250 }} /></td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </>
          ) : (
            <>
              <AuditLogsTab auditLogs={auditLogs} />
              
              {/* Pagination Controls */}
              {totalPages > 1 && (
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
                    Page {page} of {totalPages}
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
            </>
          )}
        </div>
      </div>
    </AuthenticatedLayout>
  );
}
