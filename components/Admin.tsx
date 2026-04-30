"use client";
import React, { useState, useEffect } from 'react';

const Admin = () => {
  const [activeTab, setActiveTab] = useState('users');
  const [users, setUsers] = useState<any[]>([]);
  const [portfolios, setPortfolios] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  // Modals State
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [editUser, setEditUser] = useState<any>(null);
  const [isDeactivateModalOpen, setIsDeactivateModalOpen] = useState(false);
  const [deactivatingUser, setDeactivatingUser] = useState<any>(null);

  useEffect(() => {
    fetchData();
  }, [activeTab]);

  const fetchData = async () => {
    setLoading(true);
    if (activeTab === 'users') {
      const res = await fetch('/api/admin/users');
      setUsers(await res.json());
    } else {
      const res = await fetch('/api/admin/portfolios');
      setPortfolios(await res.json());
    }
    setLoading(false);
  };

  const handleEditClick = (u: any) => {
    setEditUser({ ...u });
    setIsEditModalOpen(true);
  };

  const handleDeactivateClick = (u: any) => {
    setDeactivatingUser(u);
    setIsDeactivateModalOpen(true);
  };

  const handleSave = async () => {
    const res = await fetch(`/api/admin/users/${editUser.id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(editUser)
    });
    if (res.ok) {
      setIsEditModalOpen(false);
      fetchData();
    }
  };

  const confirmDeactivate = async () => {
    const res = await fetch(`/api/admin/users/${deactivatingUser.id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ...deactivatingUser, active: false })
    });
    if (res.ok) {
      setIsDeactivateModalOpen(false);
      fetchData();
      alert('User deactivated!');
    }
  };

  const tabs = [
    { id: 'users', label: 'Users', icon: '👤' },
    { id: 'portfolios', label: 'Portfolios', icon: '📁' },
    { id: 'columns', label: 'Columns', icon: '▦' },
    { id: 'dashboard', label: 'Dashboard Fields', icon: '▣' },
    { id: 'bulk', label: 'Bulk Upload', icon: '↑' },
    { id: 'lists', label: 'Lists Config', icon: '⁝' },
    { id: 'role', label: 'Role Access', icon: '🔒' },
    { id: 'report', label: 'Report Access', icon: '📊' },
    { id: 'system', label: 'System', icon: '⚙' },
  ];

  return (
    <div className="page on" style={{ background: '#0d1117' }}>
      <div className="ph" style={{ padding: '16px 20px 12px', borderBottom: '1px solid var(--bdr)', background: 'var(--bg2)' }}>
        <div>
          <div className="ph-t" style={{ fontSize: 16, fontWeight: 700 }}>⚙ Admin Panel</div>
          <div className="ph-s" style={{ fontSize: 11, color: 'var(--txt3)', marginTop: 2 }}>Full system configuration — Admin only</div>
        </div>
      </div>
      
      <div className="admin-nav" style={{ padding: '8px 20px', background: '#161b27', borderBottom: '1px solid var(--bdr)', display: 'flex', gap: 5, overflowX: 'auto' }}>
        {tabs.map(t => (
          <div key={t.id} className={`admin-tab ${activeTab === t.id ? 'active' : ''}`} onClick={() => setActiveTab(t.id)} style={{ display: 'flex', alignItems: 'center', gap: 7, padding: '7px 14px', borderRadius: 6, fontSize: 11, fontWeight: 600, cursor: 'pointer', background: activeTab === t.id ? 'rgba(79,125,255,0.1)' : 'transparent', color: activeTab === t.id ? 'var(--acc2)' : 'var(--txt3)' }}>
            <span>{t.icon}</span> {t.label}
          </div>
        ))}
      </div>

      <div className="page-body" style={{ flex: 1, overflowY: 'auto', padding: '20px' }}>
        <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: 15 }}>
          <button className="btn pr" style={{ borderRadius: 6, padding: '7px 15px', fontSize: 11, background: '#4f7dff' }}>+ Add User</button>
        </div>

        {activeTab === 'users' && (
          <div className="card" style={{ padding: 0, overflow: 'hidden', background: '#161b27', border: 'none' }}>
            <table className="tbl" style={{ borderCollapse: 'separate', borderSpacing: '0 8px' }}>
              <thead>
                <tr style={{ background: 'transparent' }}>
                  <th style={{ background: 'transparent', border: 'none' }}>NAME</th>
                  <th style={{ background: 'transparent', border: 'none' }}>EMP ID</th>
                  <th style={{ background: 'transparent', border: 'none' }}>ROLE</th>
                  <th style={{ background: 'transparent', border: 'none' }}>MANAGER</th>
                  <th style={{ background: 'transparent', border: 'none' }}>DOJ</th>
                  <th style={{ background: 'transparent', border: 'none' }}>STATUS</th>
                  <th style={{ background: 'transparent', border: 'none' }}>ACTIONS</th>
                </tr>
              </thead>
              <tbody style={{ background: 'transparent' }}>
                {users.map(u => (
                  <tr key={u.id} style={{ background: 'rgba(255,255,255,0.02)' }}>
                    <td style={{ padding: '12px 10px', borderRadius: '8px 0 0 8px' }}>
                      <div style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
                        <div style={{ width: 28, height: 28, borderRadius: '50%', background: 'var(--accbg)', color: 'var(--acc2)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 10, fontWeight: 700 }}>{u.initials}</div>
                        <div>
                          <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--txt)' }}>{u.name}</div>
                          <div style={{ fontSize: 10, color: 'var(--txt3)' }}>{u.email}</div>
                        </div>
                      </div>
                    </td>
                    <td className="mn">{u.empId}</td>
                    <td><span className="badge" style={{ background: u.role === 'admin' ? 'var(--redbg)' : u.role === 'manager' ? 'var(--ambbg)' : 'var(--accbg)', color: u.role === 'admin' ? 'var(--red)' : u.role === 'manager' ? 'var(--amb)' : 'var(--acc2)', border: 'none' }}>{u.role}</span></td>
                    <td>{u.manager?.name || '—'}</td>
                    <td className="mn" style={{ color: 'var(--txt3)' }}>{u.doj || '—'}</td>
                    <td><span className={`badge ${u.active ? 'grn' : 'red'}`} style={{ padding: '4px 10px', borderRadius: 6 }}>{u.active ? 'Active' : 'Inactive'}</span></td>
                    <td style={{ borderRadius: '0 8px 8px 0' }}>
                      <div style={{ display: 'flex', gap: 5 }}>
                        <button className="btn sm" onClick={() => handleEditClick(u)}>Edit</button>
                        <button className="btn sm">🔑</button>
                        <button className="btn sm dn" style={{ fontSize: 10 }} onClick={() => handleDeactivateClick(u)}>{u.active ? 'Deactivate' : 'Activate'}</button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Edit Modal implementation (same as before) */}
      {isEditModalOpen && editUser && (
        <div className="modal-overlay" style={{ position: 'fixed', top: 0, left: 0, width: '100%', height: '100%', background: 'rgba(0,0,0,0.85)', zIndex: 100, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <div className="modal-content" style={{ background: '#161b27', border: '1px solid var(--bdr)', borderRadius: 12, width: '100%', maxWidth: '750px', maxHeight: '90vh', overflow: 'hidden', display: 'flex', flexDirection: 'column' }}>
            <div style={{ padding: '16px 20px', borderBottom: '1px solid var(--bdr)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div style={{ fontSize: 15, fontWeight: 700 }}>Edit User — {editUser.name}</div>
              <button style={{ background:'transparent', border:'none', color:'var(--txt3)', fontSize:20, cursor:'pointer' }} onClick={() => setIsEditModalOpen(false)}>✕</button>
            </div>
            
            <div style={{ flex: 1, overflowY: 'auto', padding: '20px' }}>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '15px' }}>
                <div className="ff"><label>Full Name</label><input className="finp" value={editUser.name} onChange={e=>setEditUser({...editUser, name:e.target.value})} /></div>
                <div className="ff"><label>Username</label><input className="finp" value={editUser.username} onChange={e=>setEditUser({...editUser, username:e.target.value})} /></div>
                <div className="ff"><label>Employee ID</label><input className="finp" value={editUser.empId} onChange={e=>setEditUser({...editUser, empId:e.target.value})} /></div>
                <div className="ff"><label>Role</label>
                  <select className="finp" value={editUser.role} onChange={e=>setEditUser({...editUser, role:e.target.value})}>
                    <option>admin</option><option>manager</option><option>agent</option>
                  </select>
                </div>
                <div className="ff"><label>Reports To</label>
                  <select className="finp" value={editUser.managerId || ''} onChange={e=>setEditUser({...editUser, managerId:e.target.value})}>
                    <option value="">— None —</option>
                    {users.filter(x => (x.role === 'manager' || x.role === 'admin') && x.id !== editUser.id).map(u => (
                      <option key={u.id} value={u.id}>{u.name} ({u.empId})</option>
                    ))}
                  </select>
                </div>
                <div className="ff"><label>Email</label><input className="finp" value={editUser.email || ''} onChange={e=>setEditUser({...editUser, email:e.target.value})} /></div>
                <div className="ff"><label>Contact</label><input className="finp" value={editUser.contact || ''} onChange={e=>setEditUser({...editUser, contact:e.target.value})} /></div>
                <div className="ff"><label>DOB</label><input className="finp" value={editUser.dob || ''} onChange={e=>setEditUser({...editUser, dob:e.target.value})} /></div>
                <div className="ff"><label>DOJ</label><input className="finp" value={editUser.doj || ''} onChange={e=>setEditUser({...editUser, doj:e.target.value})} /></div>
              </div>
              <div className="ff" style={{ marginTop: 15 }}><label>Address</label><input className="finp" value={editUser.address || ''} onChange={e=>setEditUser({...editUser, address:e.target.value})} /></div>
            </div>
            <div style={{ padding: '16px 20px', borderTop: '1px solid var(--bdr)', display: 'flex', gap: 10 }}>
              <button className="btn pr" style={{ flex: 4, padding: 12, fontSize: 13, background: '#4f7dff' }} onClick={handleSave}>✓ Save</button>
              <button className="btn" style={{ flex: 1, padding: 12, fontSize: 13, background: '#2e2e2e', color: '#ff4d4d', border: '1px solid #444' }} onClick={() => setIsEditModalOpen(false)}>Cancel</button>
            </div>
          </div>
        </div>
      )}

      {/* Deactivate User Modal */}
      {isDeactivateModalOpen && deactivatingUser && (
        <div className="modal-overlay" style={{ position: 'fixed', top: 0, left: 0, width: '100%', height: '100%', background: 'rgba(0,0,0,0.85)', zIndex: 100, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <div className="modal-content" style={{ background: '#161b27', border: '1px solid var(--bdr)', borderRadius: 12, width: '100%', maxWidth: '500px', padding: '20px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 20 }}>
              <div style={{ fontSize: 15, fontWeight: 700 }}>Deactivate User — {deactivatingUser.name}</div>
              <button style={{ background:'transparent', border:'none', color:'var(--txt3)', fontSize:20, cursor:'pointer' }} onClick={() => setIsDeactivateModalOpen(false)}>✕</button>
            </div>
            
            <div style={{ background: 'rgba(245,166,35,0.08)', border: '1px solid rgba(245,166,35,0.2)', padding: '12px 16px', borderRadius: 8, marginBottom: 20, color: 'var(--amb)', fontSize: 12 }}>
              Deactivating: <b>{deactivatingUser.name} ({deactivatingUser.empId})</b>
            </div>

            <div className="ff" style={{ marginBottom: 25 }}>
              <label>DEACTIVATION TYPE *</label>
              <select className="finp">
                <option>— Select Type —</option>
                <option>Resigned</option>
                <option>Terminated</option>
                <option>Absconding</option>
                <option>Other</option>
              </select>
            </div>

            <div style={{ display: 'flex', gap: 10 }}>
              <button className="btn" style={{ flex: 4, padding: 12, fontSize: 13, background: 'rgba(255,77,77,0.1)', color: '#ff4d4d', border: '1px solid rgba(255,77,77,0.2)' }} onClick={confirmDeactivate}>Deactivate</button>
              <button className="btn" style={{ flex: 1, padding: 12, fontSize: 13, background: 'transparent', color: 'var(--txt3)', border: '1px solid var(--bdr)' }} onClick={() => setIsDeactivateModalOpen(false)}>Cancel</button>
            </div>
          </div>
        </div>
      )}

      <style jsx>{`
        .ff label { display: block; font-size: 10px; color: var(--txt3); margin-bottom: 5px; text-transform: uppercase; letter-spacing: 0.5px; }
        .finp { width: 100%; background: #0d1117; border: 1px solid var(--bdr2); padding: 9px 12px; borderRadius: 8px; color: var(--txt); font-size: 13px; outline: none; }
        .finp:focus { border-color: var(--acc); }
      `}</style>
    </div>
  );
};

export default Admin;
