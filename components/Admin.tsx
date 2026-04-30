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
                  <th style={{ background: 'transparent', border: 'none' }}>PORTFOLIO</th>
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
                    <td style={{ fontSize: 12 }}>
                      {u.manager ? <><div style={{ color: 'var(--txt)' }}>{u.manager.name}</div><div style={{ fontSize: 10, color: 'var(--txt3)' }}>{u.manager.empId}</div></> : <span style={{ color: 'var(--txt3)' }}>—</span>}
                    </td>
                    <td style={{ color: 'var(--pur)', fontSize: 11, maxWidth: 250, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                      {/* Portfolios will be mapped here if we have them */}
                      {u.role !== 'admin' ? 'Rajasthan Personal Loans, Rajasthan Credit Cards' : '—'}
                    </td>
                    <td className="mn" style={{ color: 'var(--txt3)' }}>{u.doj || '—'}</td>
                    <td><span className={`badge ${u.active ? 'grn' : 'red'}`} style={{ padding: '4px 10px', borderRadius: 6, border: `1px solid ${u.active ? 'rgba(46,204,138,0.2)' : 'rgba(226,75,74,0.2)'}`, background: 'transparent' }}>{u.active ? 'Active' : 'Inactive'}</span></td>
                    <td style={{ borderRadius: '0 8px 8px 0' }}>
                      <div style={{ display: 'flex', gap: 5 }}>
                        <button className="btn sm" style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)' }} onClick={() => handleEditClick(u)}>Edit</button>
                        <button className="btn sm" style={{ background: 'rgba(245,166,35,0.1)', color: 'var(--amb)', border: '1px solid rgba(245,166,35,0.2)' }}>🔑</button>
                        <button className="btn sm" style={{ fontSize: 10, background: 'rgba(226,75,74,0.1)', color: 'var(--red)', border: '1px solid rgba(226,75,74,0.2)' }} onClick={() => handleDeactivateClick(u)}>{u.active ? 'Deactivate' : 'Activate'}</button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {activeTab === 'portfolios' && (
          <div>
            <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: 15 }}>
              <button className="btn pr" style={{ borderRadius: 6, padding: '7px 15px', fontSize: 11 }}>+ Add Portfolio</button>
            </div>
            {portfolios.map(p => (
              <div key={p.id} className="card" style={{ marginBottom: 15, background: '#161b27', border: '1px solid var(--bdr)' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 15 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                    <span className="badge pur" style={{ background: 'rgba(167,139,250,0.1)', color: 'var(--pur)', border: '1px solid rgba(167,139,250,0.2)', padding: '4px 8px', borderRadius: 12 }}>{p.id}</span>
                    <span style={{ fontSize: 14, fontWeight: 600 }}>{p.name}</span>
                  </div>
                  <button className="btn sm" style={{ background: 'rgba(226,75,74,0.1)', color: 'var(--red)', border: '1px solid rgba(226,75,74,0.2)' }}>Delete</button>
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20 }}>
                  <div>
                    <div style={{ fontSize: 10, color: 'var(--txt3)', fontWeight: 700, letterSpacing: 0.5, marginBottom: 10 }}>ASSIGNED AGENTS</div>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                      {/* Placeholder data for UI match */}
                      <label style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 12 }}><input type="checkbox" defaultChecked /> <span>Jenna Rivera <span style={{ color: 'var(--txt3)', fontSize: 10 }}>EMP003</span></span></label>
                      <label style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 12 }}><input type="checkbox" /> <span>Carlos Mendes <span style={{ color: 'var(--txt3)', fontSize: 10 }}>EMP004</span></span></label>
                      <label style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 12 }}><input type="checkbox" defaultChecked /> <span>Aisha Brown <span style={{ color: 'var(--txt3)', fontSize: 10 }}>EMP005</span></span></label>
                    </div>
                  </div>
                  <div>
                    <div style={{ fontSize: 10, color: 'var(--txt3)', fontWeight: 700, letterSpacing: 0.5, marginBottom: 10 }}>ASSIGNED MANAGERS</div>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                      <label style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 12 }}><input type="checkbox" defaultChecked /> <span>Rahul Sharma <span style={{ color: 'var(--txt3)', fontSize: 10 }}>EMP002</span></span></label>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {activeTab === 'columns' && (
          <div>
            <div style={{ background: 'rgba(79,125,255,0.05)', border: '1px solid rgba(79,125,255,0.2)', padding: '12px 16px', borderRadius: 8, marginBottom: 20, color: 'var(--acc2)', fontSize: 12 }}>
              Columns define data structure for upload, search list, and dashboard.
            </div>
            
            {[
              { id: 1, name: 'Account Number', key: 'account_no', search: true, dash: true, req: true },
              { id: 2, name: 'Customer Name', key: 'name', search: true, dash: false, req: true },
              { id: 3, name: 'Mobile Number', key: 'mobile', search: true, dash: true, req: true },
              { id: 4, name: 'Alt Mobile', key: 'alt_mobile', search: true, dash: true, req: false },
              { id: 5, name: 'Email', key: 'email', search: true, dash: true, req: false },
              { id: 6, name: 'PAN Number', key: 'pan', search: true, dash: true, req: false },
              { id: 7, name: 'Product Type', key: 'product', search: true, dash: true, req: false },
              { id: 8, name: 'Bank / Lender', key: 'bank', search: true, dash: true, req: false },
              { id: 9, name: 'Outstanding Amount', key: 'outstanding', search: true, dash: true, req: false },
              { id: 10, name: 'Days Past Due', key: 'dpd', search: true, dash: true, req: false },
              { id: 11, name: 'Status', key: 'status', search: true, dash: true, req: false },
            ].map(col => (
              <div key={col.id} style={{ display: 'flex', alignItems: 'center', background: '#161b27', border: '1px solid var(--bdr)', padding: '12px 16px', borderRadius: 8, marginBottom: 8 }}>
                <div style={{ width: 30, color: 'var(--txt3)', fontSize: 12 }}>{col.id}</div>
                <div style={{ flex: 1, fontSize: 13 }}>{col.name}</div>
                <div style={{ flex: 1, color: 'var(--txt3)', fontSize: 12 }}>{col.key}</div>
                <div style={{ display: 'flex', gap: 15, alignItems: 'center' }}>
                  <label style={{ display: 'flex', alignItems: 'center', gap: 5, fontSize: 11, color: 'var(--txt2)' }}><input type="checkbox" defaultChecked={col.search} /> Search</label>
                  <label style={{ display: 'flex', alignItems: 'center', gap: 5, fontSize: 11, color: 'var(--txt2)' }}><input type="checkbox" defaultChecked={col.dash} /> Dash</label>
                  {col.req ? (
                    <span className="badge red" style={{ background: 'rgba(226,75,74,0.1)', color: 'var(--red)', border: '1px solid rgba(226,75,74,0.2)', padding: '3px 8px' }}>Req</span>
                  ) : (
                    <button className="btn sm" style={{ background: 'rgba(226,75,74,0.1)', color: 'var(--red)', border: '1px solid rgba(226,75,74,0.2)', padding: '3px 8px' }}>✕</button>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}

        {activeTab === 'bulk' && (
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20 }}>
            <div className="card" style={{ background: '#161b27', border: 'none' }}>
              <div style={{ fontSize: 14, fontWeight: 600, marginBottom: 20 }}>Upload File</div>
              
              <div style={{ border: '1px dashed var(--txt3)', borderRadius: 8, padding: 40, textAlign: 'center', cursor: 'pointer', marginBottom: 20, background: 'rgba(255,255,255,0.02)' }}>
                <div style={{ fontSize: 20, color: 'var(--txt3)', marginBottom: 10 }}>↑</div>
                <div style={{ color: 'var(--txt2)' }}>Click to select .CSV or .XLSX</div>
              </div>
              
              <div style={{ display: 'flex', gap: 15, marginBottom: 20 }}>
                <div className="ff" style={{ flex: 1 }}>
                  <label>ASSIGN TO AGENT</label>
                  <select className="finp">
                    <option>Jenna Rivera (EMP003)</option>
                    <option>Carlos Mendes (EMP004)</option>
                    <option>Aisha Brown (EMP005)</option>
                  </select>
                </div>
                <div className="ff" style={{ flex: 1 }}>
                  <label>DUPLICATE HANDLING</label>
                  <select className="finp">
                    <option>Skip Duplicates</option>
                    <option>Overwrite</option>
                    <option>Update Missing Fields</option>
                  </select>
                </div>
              </div>
              
              <div style={{ display: 'flex', gap: 10 }}>
                <button className="btn pr" style={{ flex: 1, padding: 12, fontSize: 13, background: '#4f7dff' }}>↑ Start Upload</button>
                <button className="btn" style={{ padding: '12px 20px', fontSize: 13, background: 'rgba(46,204,138,0.1)', color: 'var(--grn)', border: '1px solid rgba(46,204,138,0.2)' }}>↓ Sample</button>
              </div>
            </div>

            <div className="card" style={{ background: '#161b27', border: 'none' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
                <div style={{ fontSize: 14, fontWeight: 600 }}>Column Mapping</div>
                <button className="btn pr sm" style={{ background: '#4f7dff' }}>+ Add</button>
              </div>
              
              {[
                { name: 'Account Number', key: 'account_no', req: true },
                { name: 'Customer Name', key: 'name', req: true },
                { name: 'Mobile Number', key: 'mobile', req: true },
                { name: 'Alt Mobile', key: 'alt_mobile', req: false },
                { name: 'Email', key: 'email', req: false },
                { name: 'PAN Number', key: 'pan', req: false },
                { name: 'Product Type', key: 'product', req: false },
                { name: 'Bank / Lender', key: 'bank', req: false },
                { name: 'Outstanding Amount', key: 'outstanding', req: false },
              ].map((col, i) => (
                <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 15, background: 'rgba(255,255,255,0.02)', border: '1px solid var(--bdr)', padding: '10px 14px', borderRadius: 8, marginBottom: 8 }}>
                  <div style={{ flex: 1, fontSize: 12, color: 'var(--txt2)' }}>{col.name}</div>
                  <div style={{ color: 'var(--txt3)' }}>→</div>
                  <div style={{ flex: 1, fontSize: 12 }}>{col.key}</div>
                  <div style={{ display: 'flex', gap: 5 }}>
                    <div style={{ width: 24, height: 24, borderRadius: 4, display: 'flex', alignItems: 'center', justifyContent: 'center', border: '1px solid rgba(46,204,138,0.2)', color: 'var(--grn)', fontSize: 10 }}>✓</div>
                    {!col.req && (
                      <div style={{ width: 24, height: 24, borderRadius: 4, display: 'flex', alignItems: 'center', justifyContent: 'center', border: '1px solid rgba(226,75,74,0.2)', color: 'var(--red)', fontSize: 10 }}>✕</div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {activeTab === 'lists' && (
          <div>
            <div style={{ background: 'rgba(79,125,255,0.05)', border: '1px solid rgba(79,125,255,0.2)', padding: '12px 16px', borderRadius: 8, marginBottom: 20, color: 'var(--acc2)', fontSize: 12 }}>
              Admin can add or delete payment modes, PTP statuses, dispute statuses, and flag options. Changes apply system-wide immediately.
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20 }}>
              {/* Payment Modes */}
              <div className="card" style={{ background: '#161b27', border: 'none' }}>
                <div style={{ fontSize: 13, fontWeight: 700, marginBottom: 15 }}>Payment Modes</div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                  {['NEFT', 'UPI', 'Cash', 'Cheque', 'Card', 'ACH', 'RTGS', 'IMPS'].map(item => (
                    <div key={item} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: 'rgba(255,255,255,0.02)', border: '1px solid var(--bdr)', padding: '10px 14px', borderRadius: 8 }}>
                      <span style={{ fontSize: 13, color: 'var(--acc2)' }}>{item}</span>
                      <button className="btn sm" style={{ padding: '4px 8px', background: 'rgba(226,75,74,0.1)', color: 'var(--red)', border: '1px solid rgba(226,75,74,0.2)' }}>✕</button>
                    </div>
                  ))}
                  <div style={{ display: 'flex', gap: 10, marginTop: 10 }}>
                    <input className="finp" placeholder="New payment modes item..." style={{ flex: 1 }} />
                    <button className="btn pr" style={{ padding: '0 15px', background: '#4f7dff' }}>+ Add</button>
                  </div>
                </div>
              </div>

              {/* PTP Statuses */}
              <div className="card" style={{ background: '#161b27', border: 'none' }}>
                <div style={{ fontSize: 13, fontWeight: 700, marginBottom: 15 }}>PTP Statuses</div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                  {['pending', 'kept', 'broken', 'partial', 'paid'].map(item => (
                    <div key={item} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: 'rgba(255,255,255,0.02)', border: '1px solid var(--bdr)', padding: '10px 14px', borderRadius: 8 }}>
                      <span style={{ fontSize: 13, color: 'var(--amb)' }}>{item}</span>
                      <button className="btn sm" style={{ padding: '4px 8px', background: 'rgba(226,75,74,0.1)', color: 'var(--red)', border: '1px solid rgba(226,75,74,0.2)' }}>✕</button>
                    </div>
                  ))}
                  <div style={{ display: 'flex', gap: 10, marginTop: 10 }}>
                    <input className="finp" placeholder="New ptp statuses item..." style={{ flex: 1 }} />
                    <button className="btn pr" style={{ padding: '0 15px', background: '#4f7dff' }}>+ Add</button>
                  </div>
                </div>
              </div>

              {/* Dispute Statuses */}
              <div className="card" style={{ background: '#161b27', border: 'none' }}>
                <div style={{ fontSize: 13, fontWeight: 700, marginBottom: 15 }}>Dispute Statuses</div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                  {['open', 'reviewing', 'resolved', 'escalated', 'closed'].map(item => (
                    <div key={item} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: 'rgba(255,255,255,0.02)', border: '1px solid var(--bdr)', padding: '10px 14px', borderRadius: 8 }}>
                      <span style={{ fontSize: 13, color: 'var(--pur)' }}>{item}</span>
                      <button className="btn sm" style={{ padding: '4px 8px', background: 'rgba(226,75,74,0.1)', color: 'var(--red)', border: '1px solid rgba(226,75,74,0.2)' }}>✕</button>
                    </div>
                  ))}
                  <div style={{ display: 'flex', gap: 10, marginTop: 10 }}>
                    <input className="finp" placeholder="New dispute statuses item..." style={{ flex: 1 }} />
                    <button className="btn pr" style={{ padding: '0 15px', background: '#4f7dff' }}>+ Add</button>
                  </div>
                </div>
              </div>

              {/* Flag Options */}
              <div className="card" style={{ background: '#161b27', border: 'none' }}>
                <div style={{ fontSize: 13, fontWeight: 700, marginBottom: 15 }}>Flag Options</div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                  {['flagged', 'approved', 'rejected', 'needs_info', 'escalated'].map(item => (
                    <div key={item} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: 'rgba(255,255,255,0.02)', border: '1px solid var(--bdr)', padding: '10px 14px', borderRadius: 8 }}>
                      <span style={{ fontSize: 13, color: 'var(--grn)' }}>{item}</span>
                      <button className="btn sm" style={{ padding: '4px 8px', background: 'rgba(226,75,74,0.1)', color: 'var(--red)', border: '1px solid rgba(226,75,74,0.2)' }}>✕</button>
                    </div>
                  ))}
                  <div style={{ display: 'flex', gap: 10, marginTop: 10 }}>
                    <input className="finp" placeholder="New flag options item..." style={{ flex: 1 }} />
                    <button className="btn pr" style={{ padding: '0 15px', background: '#4f7dff' }}>+ Add</button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
        {activeTab === 'dashboard' && (
          <div>
            <div style={{ background: 'rgba(79,125,255,0.05)', border: '1px solid rgba(79,125,255,0.2)', padding: '12px 16px', borderRadius: 8, marginBottom: 20, color: 'var(--acc2)', fontSize: 12 }}>
              All upload columns are available as dashboard fields.
            </div>
            
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 10, marginBottom: 20 }}>
              {[
                { label: 'Account Number', on: true },
                { label: 'Customer Name', on: false },
                { label: 'Mobile Number', on: true },
                { label: 'Alt Mobile', on: true },
                { label: 'Email', on: true },
                { label: 'PAN Number', on: true },
                { label: 'Product Type', on: true },
                { label: 'Bank / Lender', on: true },
                { label: 'Outstanding Amount', on: true },
                { label: 'Days Past Due', on: true },
                { label: 'Status', on: true },
                { label: 'City', on: true },
                { label: 'State', on: false },
                { label: 'Address', on: false },
                { label: 'Employer', on: false },
                { label: 'Salary', on: false },
                { label: 'Date of Birth', on: false },
                { label: 'Gender', on: false },
                { label: 'Portfolio', on: true }
              ].map((f, i) => (
                <div key={i} style={{ background: '#161b27', border: '1px solid var(--bdr)', padding: '12px 16px', borderRadius: 8, display: 'flex', alignItems: 'center', gap: 10 }}>
                  <input type="checkbox" defaultChecked={f.on} />
                  <span style={{ fontSize: 12, color: 'var(--txt)' }}>{f.label}</span>
                </div>
              ))}
            </div>
            <button className="btn pr" style={{ padding: '8px 20px', background: '#4f7dff' }}>✓ Save</button>
          </div>
        )}

        {activeTab === 'role' && (
          <div>
            <div style={{ background: 'rgba(79,125,255,0.05)', border: '1px solid rgba(79,125,255,0.2)', padding: '12px 16px', borderRadius: 8, marginBottom: 20, color: 'var(--acc2)', fontSize: 12 }}>
              Role-based access matrix.
            </div>
            
            <div className="card" style={{ padding: 0, overflow: 'hidden', background: '#161b27', border: 'none' }}>
              <table className="tbl" style={{ borderCollapse: 'collapse', width: '100%' }}>
                <thead>
                  <tr style={{ background: 'transparent', borderBottom: '1px solid var(--bdr)' }}>
                    <th style={{ background: 'transparent', border: 'none', paddingLeft: 20 }}>FEATURE</th>
                    <th style={{ background: 'transparent', border: 'none', textAlign: 'center' }}>ADMIN</th>
                    <th style={{ background: 'transparent', border: 'none', textAlign: 'center' }}>MANAGER</th>
                    <th style={{ background: 'transparent', border: 'none', textAlign: 'center' }}>AGENT</th>
                  </tr>
                </thead>
                <tbody style={{ background: 'transparent' }}>
                  {[
                    { feature: 'View Dashboard', a: true, m: true, g: true },
                    { feature: 'View All Leads', a: true, m: true, g: true },
                    { feature: 'Edit Customer', a: true, m: true, g: true },
                    { feature: 'Log Calls', a: true, m: true, g: true },
                    { feature: 'Create PTP', a: true, m: true, g: true },
                    { feature: 'Record Payment (Pending Approval)', a: true, m: true, g: true },
                    { feature: 'Approve/Reject Payments', a: true, m: true, g: false },
                    { feature: 'Bulk Upload', a: true, m: true, g: false },
                    { feature: 'Column Config', a: true, m: false, g: false },
                    { feature: 'Admin Panel', a: true, m: false, g: false },
                    { feature: 'Manager Panel', a: true, m: true, g: false },
                    { feature: 'Portfolio Assignment', a: true, m: false, g: false }
                  ].map((row, i) => (
                    <tr key={i} style={{ background: i % 2 === 0 ? 'transparent' : 'rgba(255,255,255,0.02)' }}>
                      <td style={{ padding: '12px 20px', color: 'var(--txt2)', fontSize: 13, borderBottom: '1px solid var(--bdr)' }}>{row.feature}</td>
                      <td style={{ textAlign: 'center', borderBottom: '1px solid var(--bdr)' }}>{row.a ? <span style={{ color: 'var(--grn)' }}>✓</span> : <span style={{ color: 'var(--red)' }}>✕</span>}</td>
                      <td style={{ textAlign: 'center', borderBottom: '1px solid var(--bdr)' }}>{row.m ? <span style={{ color: 'var(--grn)' }}>✓</span> : <span style={{ color: 'var(--red)' }}>✕</span>}</td>
                      <td style={{ textAlign: 'center', borderBottom: '1px solid var(--bdr)' }}>{row.g ? <span style={{ color: 'var(--grn)' }}>✓</span> : <span style={{ color: 'var(--red)' }}>✕</span>}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {activeTab === 'report' && (
          <div>
            <div style={{ background: 'rgba(245,166,35,0.05)', border: '1px solid rgba(245,166,35,0.2)', padding: '12px 16px', borderRadius: 8, marginBottom: 20, color: 'var(--amb)', fontSize: 12 }}>
              Admin controls which reports each role can access.
            </div>

            <div className="card" style={{ padding: 0, overflow: 'hidden', background: '#161b27', border: 'none', marginBottom: 20 }}>
              <table className="tbl" style={{ borderCollapse: 'collapse', width: '100%' }}>
                <thead>
                  <tr style={{ background: 'transparent', borderBottom: '1px solid var(--bdr)' }}>
                    <th style={{ background: 'transparent', border: 'none', paddingLeft: 20 }}>REPORT</th>
                    <th style={{ background: 'transparent', border: 'none' }}>DESCRIPTION</th>
                    <th style={{ background: 'transparent', border: 'none', textAlign: 'center' }}>ADMIN</th>
                    <th style={{ background: 'transparent', border: 'none', textAlign: 'center' }}>MANAGER</th>
                    <th style={{ background: 'transparent', border: 'none', textAlign: 'center' }}>AGENT</th>
                  </tr>
                </thead>
                <tbody style={{ background: 'transparent' }}>
                  {[
                    { report: 'Call Summary', desc: 'Call activity', a: true, m: true, g: true },
                    { report: 'PTP Summary', desc: 'PTP tracking', a: true, m: true, g: true },
                    { report: 'Payment Summary', desc: 'Collections', a: true, m: true, g: false },
                    { report: 'Team Performance', desc: 'Agent metrics', a: true, m: true, g: false },
                    { report: 'Portfolio Aging', desc: 'DPD analysis', a: true, m: false, g: false },
                    { report: 'Dispute Summary', desc: 'Dispute tracking', a: true, m: false, g: false },
                    { report: 'Audit Logs', desc: 'Full trail', a: true, m: false, g: false },
                    { report: 'System Reports', desc: 'Upload history', a: true, m: false, g: false }
                  ].map((row, i) => (
                    <tr key={i} style={{ background: i % 2 === 0 ? 'transparent' : 'rgba(255,255,255,0.02)' }}>
                      <td style={{ padding: '12px 20px', color: 'var(--txt2)', fontSize: 13, borderBottom: '1px solid var(--bdr)', fontWeight: 600 }}>{row.report}</td>
                      <td style={{ padding: '12px 10px', color: 'var(--txt3)', fontSize: 12, borderBottom: '1px solid var(--bdr)' }}>{row.desc}</td>
                      <td style={{ textAlign: 'center', borderBottom: '1px solid var(--bdr)' }}><input type="checkbox" defaultChecked={row.a} /></td>
                      <td style={{ textAlign: 'center', borderBottom: '1px solid var(--bdr)' }}><input type="checkbox" defaultChecked={row.m} /></td>
                      <td style={{ textAlign: 'center', borderBottom: '1px solid var(--bdr)' }}><input type="checkbox" defaultChecked={row.g} /></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <button className="btn pr" style={{ padding: '8px 20px', background: '#4f7dff' }}>✓ Save</button>
          </div>
        )}

        {activeTab === 'system' && (
          <div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 20, marginBottom: 20 }}>
              <div className="card" style={{ background: '#161b27', border: '1px solid var(--bdr)', padding: '16px 20px' }}>
                <div style={{ fontSize: 10, color: 'var(--txt3)', fontWeight: 700, letterSpacing: 0.5, marginBottom: 8, textTransform: 'uppercase' }}>Status</div>
                <div style={{ fontSize: 18, fontWeight: 700, color: 'var(--grn)' }}>Online</div>
              </div>
              <div className="card" style={{ background: '#161b27', border: '1px solid var(--bdr)', padding: '16px 20px' }}>
                <div style={{ fontSize: 10, color: 'var(--txt3)', fontWeight: 700, letterSpacing: 0.5, marginBottom: 8, textTransform: 'uppercase' }}>Database</div>
                <div style={{ fontSize: 15, fontWeight: 600, color: 'var(--txt)' }}>PostgreSQL 15.0</div>
              </div>
              <div className="card" style={{ background: '#161b27', border: '1px solid var(--bdr)', padding: '16px 20px' }}>
                <div style={{ fontSize: 10, color: 'var(--txt3)', fontWeight: 700, letterSpacing: 0.5, marginBottom: 8, textTransform: 'uppercase' }}>Last Backup</div>
                <div style={{ fontSize: 15, fontWeight: 600, color: 'var(--txt)' }}>2h ago</div>
              </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20 }}>
              <div className="card" style={{ background: '#161b27', border: 'none' }}>
                <div style={{ fontSize: 14, fontWeight: 600, marginBottom: 20 }}>General Settings</div>
                
                <div className="ff" style={{ marginBottom: 15 }}>
                  <label>COMPANY NAME</label>
                  <input className="finp" defaultValue="DebtRecover Solutions Pvt. Ltd." />
                </div>
                
                <div className="ff" style={{ marginBottom: 15 }}>
                  <label>TIMEZONE</label>
                  <select className="finp" defaultValue="Asia/Kolkata (IST)">
                    <option>Asia/Kolkata (IST)</option>
                    <option>UTC</option>
                    <option>America/New_York</option>
                  </select>
                </div>
                
                <div className="ff" style={{ marginBottom: 20 }}>
                  <label>SESSION TIMEOUT (HOURS)</label>
                  <input className="finp" type="number" defaultValue="8" />
                </div>

                <button className="btn pr" style={{ width: '100%', padding: 12, background: '#4f7dff' }}>✓ Save</button>
              </div>

              <div className="card" style={{ background: '#161b27', border: 'none' }}>
                <div style={{ fontSize: 14, fontWeight: 600, color: 'var(--red)', marginBottom: 20 }}>Danger Zone</div>
                
                <div style={{ background: 'rgba(226,75,74,0.05)', border: '1px solid rgba(226,75,74,0.2)', padding: '20px', borderRadius: 8 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10, color: 'var(--red)', fontSize: 14, fontWeight: 600, marginBottom: 15 }}>
                    <span>⚠</span> Flush All Data
                  </div>
                  <button className="btn" style={{ background: 'transparent', color: 'var(--red)', border: '1px solid rgba(226,75,74,0.3)', padding: '8px 16px' }}>Delete All Data</button>
                </div>
              </div>
            </div>
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

    </div>
  );
};

export default Admin;
