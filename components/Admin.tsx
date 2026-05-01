"use client";
import React, { useState, useEffect } from 'react';
import * as XLSX from 'xlsx';
import { useApp } from '@/context/AppContext';

const Admin = () => {
  const { toast } = useApp();
  const [columns, setColumns] = useState<any[]>([]);
  const [activeTab, setActiveTab] = useState('users');
  const [users, setUsers] = useState<any[]>([]);
  const [portfolios, setPortfolios] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  // Modals State
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [editUser, setEditUser] = useState<any>(null);
  const [isDeactivateModalOpen, setIsDeactivateModalOpen] = useState(false);
  const [deactivatingUser, setDeactivatingUser] = useState<any>(null);

  // Bulk Upload State
  const [uploadFile, setUploadFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [uploadAgent, setUploadAgent] = useState('');
  const [uploadPortfolio, setUploadPortfolio] = useState('');
  const [duplicateHandling, setDuplicateHandling] = useState('Skip Duplicates');
  const [previewRows, setPreviewRows] = useState<any[]>([]);
  const [previewHeaders, setPreviewHeaders] = useState<string[]>([]);
  const [uploadResult, setUploadResult] = useState<any>(null);
  const [validationError, setValidationError] = useState<string | null>(null);

  // Column State
  const [isAddingColumn, setIsAddingColumn] = useState(false);
  const [newColumn, setNewColumn] = useState({ label: '', key: '', type: 'string' });

  // Portfolio State
  const [isAddingPortfolio, setIsAddingPortfolio] = useState(false);
  const [newPortfolio, setNewPortfolio] = useState({ id: '', name: '' });

  // Audit Log State
  const [auditLogs, setAuditLogs] = useState<any[]>([]);

  useEffect(() => {
    fetchData();
  }, [activeTab]);

  const fetchData = async () => {
    setLoading(true);
    if (activeTab === 'users' || activeTab === 'bulk') {
      const res = await fetch('/api/admin/users');
      setUsers(await res.json());
    }
    if (activeTab === 'portfolios' || activeTab === 'bulk') {
      const res = await fetch('/api/admin/portfolios');
      setPortfolios(await res.json());
    }
    if (activeTab === 'columns') {
      const res = await fetch('/api/admin/columns');
      setColumns(await res.json());
    }
    if (activeTab === 'audit') {
      const res = await fetch('/api/admin/audit-logs');
      setAuditLogs(await res.json());
    }
    setLoading(false);
  };

  const handleAssignmentChange = async (portfolioId: string, userId: number, role: string, isChecked: boolean) => {
    const action = isChecked ? 'connect' : 'disconnect';
    const res = await fetch('/api/admin/portfolios', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id: portfolioId, userId, role, action })
    });
    if (res.ok) {
      fetchData();
      toast(isChecked ? 'Access Granted' : 'Access Removed');
    } else {
      toast('Failed to update assignment');
    }
  };

  const handleToggleVisibility = async (col: any) => {
    const res = await fetch('/api/admin/columns', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id: col.id, visible: !col.visible })
    });
    if (res.ok) fetchData();
  };

  const handleToggleProfileVisibility = async (col: any) => {
    const res = await fetch('/api/admin/columns', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id: col.id, showInProfile: !col.showInProfile })
    });
    if (res.ok) fetchData();
  };

  const handleSaveColumn = async (col: any) => {
    const res = await fetch('/api/admin/columns', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(col)
    });
    if (res.ok) fetchData();
  };

  const handleAddColumn = async () => {
    if (!newColumn.label) return alert('Column Name is required');

    // Auto-generate key from label
    const generatedKey = newColumn.label.toLowerCase().replace(/[^a-z0-9]+/g, '_').replace(/^_+|_+$/g, '');

    const res = await fetch('/api/admin/columns', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        label: newColumn.label,
        type: newColumn.type,
        key: generatedKey,
        visible: true,
        order: columns.length
      })
    });
    if (res.ok) {
      setNewColumn({ label: '', key: '', type: 'string' });
      setIsAddingColumn(false);
      fetchData();
    } else {
      alert('Error adding column');
    }
  };

  const handleAddPortfolio = async () => {
    if (!newPortfolio.id || !newPortfolio.name) return alert('Portfolio ID and Name are required');
    const res = await fetch('/api/admin/portfolios', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(newPortfolio)
    });
    if (res.ok) {
      setNewPortfolio({ id: '', name: '' });
      setIsAddingPortfolio(false);
      fetchData();
    } else {
      const errorData = await res.json();
      alert(`Error adding portfolio: ${errorData.message || 'Unknown error'}`);
    }
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

  const handleFileSelect = (file: File | null) => {
    setUploadFile(file);
    setUploadResult(null);
    setPreviewRows([]);
    setPreviewHeaders([]);
    setValidationError(null);
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const data = e.target?.result;
        const workbook = XLSX.read(data, { type: 'binary' });
        const sheetName = workbook.SheetNames[0];
        const worksheet = workbook.Sheets[sheetName];
        const json: any[] = XLSX.utils.sheet_to_json(worksheet, { defval: "" });
        const rawHeaders = XLSX.utils.sheet_to_json(worksheet, { header: 1 })[0] as string[];

        if (json.length > 0 && rawHeaders) {
          setPreviewHeaders(rawHeaders);
          setPreviewRows(json.slice(0, 5));

          // Strict validation: Excel columns vs Database columns
          const expectedHeaders = columns.map(c => c.label.toLowerCase().trim());
          const actualHeaders = rawHeaders.map(h => String(h).toLowerCase().trim());

          const missing = expectedHeaders.filter(h => !actualHeaders.includes(h));
          const extra = actualHeaders.filter(h => !expectedHeaders.includes(h));

          if (missing.length > 0 || extra.length > 0) {
            let errorMsg = "Column mismatch! Your file must exactly match the Database columns. ";
            if (missing.length > 0) errorMsg += `Missing: ${missing.map(m => `"${m}"`).join(', ')}. `;
            if (extra.length > 0) errorMsg += `Extra: ${extra.map(m => `"${m}"`).join(', ')}.`;
            setValidationError(errorMsg);
          }
        }
      } catch (err: any) {
        setValidationError("Error parsing file.");
      }
    };
    reader.readAsBinaryString(file);
  };

  const handleStartUpload = async () => {
    if (!uploadFile) return;
    setUploading(true);
    setUploadResult(null);
    setUploadProgress(10);
    try {
      const reader = new FileReader();
      reader.onload = async (e) => {
        try {
          const data = e.target?.result;
          const workbook = XLSX.read(data, { type: 'binary' });
          const sheetName = workbook.SheetNames[0];
          const worksheet = workbook.Sheets[sheetName];
          const json = XLSX.utils.sheet_to_json(worksheet);
          setUploadProgress(40);

          const res = await fetch('/api/admin/bulk-upload', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              data: json,
              agentId: uploadAgent || null,
              portfolioId: uploadPortfolio || null,
              duplicateHandling
            })
          });
          setUploadProgress(90);
          const result = await res.json();
          setUploadProgress(100);
          if (res.ok) {
            setUploadResult({ ...result, success: true });
          } else {
            setUploadResult({ success: false, error: result.error });
          }
        } catch (err: any) {
          setUploadResult({ success: false, error: 'Error parsing file: ' + err.message });
        } finally {
          setUploading(false);
        }
      };
      reader.readAsBinaryString(uploadFile);
    } catch (err: any) {
      setUploadResult({ success: false, error: err.message });
      setUploading(false);
    }
  };

  const handleReset = () => {
    setUploadFile(null);
    setPreviewRows([]);
    setPreviewHeaders([]);
    setUploadResult(null);
    setUploadProgress(0);
    setValidationError(null);
  };

  const handleDownloadTemplate = () => {
    const headers = columns.map(c => c.label);
    const ws = XLSX.utils.aoa_to_sheet([headers]);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Template");
    XLSX.writeFile(wb, "bulk_upload_template.xlsx");
  };

  const tabs = [
    { id: 'users', label: 'Users', icon: '👤' },
    { id: 'portfolios', label: 'Portfolios', icon: '📁' },
    { id: 'columns', label: 'Columns', icon: '▦' },
    { id: 'dashboard', label: 'Dashboard Fields', icon: '▣' },
    { id: 'bulk', label: 'Bulk Upload', icon: '↑' },
    { id: 'lists', label: 'Master Lists', icon: '☰' },
    { id: 'role', label: 'Role Access', icon: '🔒' },
    { id: 'report', label: 'Report Access', icon: '📊' },
    { id: 'audit', label: 'Audit Logs', icon: '📜' },
    { id: 'system', label: 'System', icon: '⚙' },
  ];

  return (
    <div className="page on" style={{ background: 'var(--bg)' }}>
      <div className="ph" style={{ padding: '16px 20px 12px', borderBottom: '1px solid var(--bdr)', background: 'var(--bg2)' }}>
        <div>
          <div className="ph-t" style={{ fontSize: 16, fontWeight: 700 }}>⚙ Admin Panel</div>
          <div className="ph-s" style={{ fontSize: 11, color: 'var(--txt3)', marginTop: 2 }}>Full system configuration — Admin only</div>
        </div>
      </div>

      <div className="admin-nav" style={{ padding: '8px 20px', background: 'var(--bg2)', borderBottom: '1px solid var(--bdr)', display: 'flex', gap: 5, overflowX: 'auto' }}>
        {tabs.map(t => (
          <div key={t.id} className={`admin-tab ${activeTab === t.id ? 'active' : ''}`} onClick={() => setActiveTab(t.id)} style={{ display: 'flex', alignItems: 'center', gap: 7, padding: '7px 14px', borderRadius: 6, fontSize: 11, fontWeight: 600, cursor: 'pointer', background: activeTab === t.id ? 'rgba(79,125,255,0.1)' : 'transparent', color: activeTab === t.id ? 'var(--acc2)' : 'var(--txt3)' }}>
            <span>{t.icon}</span> {t.label}
          </div>
        ))}
      </div>

      <div className="page-body" style={{ flex: 1, overflowY: 'auto', padding: '20px' }}>

        {activeTab === 'users' && (
          <div className="card" style={{ padding: 0, overflow: 'hidden', background: 'var(--bg2)', border: 'none' }}>
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
          loading ? (
            <div>
              <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: 15 }}>
                <div className="skel" style={{ width: 120, height: 32, borderRadius: 6 }}></div>
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 15 }}>
                {[1, 2, 3, 4, 5, 6].map(i => (
                  <div key={i} className="skel" style={{ height: 120, borderRadius: 10 }}></div>
                ))}
              </div>
            </div>
          ) : (
          <div>
            <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: 15 }}>
              <button className="btn pr" style={{ borderRadius: 6, padding: '7px 15px', fontSize: 11 }} onClick={() => setIsAddingPortfolio(true)}>+ Add Portfolio</button>
            </div>
            
            {isAddingPortfolio && (
              <div style={{ display: 'flex', alignItems: 'center', background: 'rgba(79,125,255,0.05)', border: '1px dashed var(--acc)', padding: '12px 16px', borderRadius: 8, gap: 10, marginBottom: 15 }}>
                <input className="finp" placeholder="Portfolio ID (e.g. P4)" style={{ width: 150 }} value={newPortfolio.id} onChange={e => setNewPortfolio({...newPortfolio, id: e.target.value})} />
                <input className="finp" placeholder="Portfolio Name (e.g. Credit Cards)" style={{ flex: 1 }} value={newPortfolio.name} onChange={e => setNewPortfolio({...newPortfolio, name: e.target.value})} />
                <button className="btn pr" onClick={handleAddPortfolio}>Save</button>
                <button className="btn sm" onClick={() => setIsAddingPortfolio(false)}>Cancel</button>
              </div>
            )}
            
            <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
              {portfolios.map(p => (
                <div key={p.id} style={{ background: '#161b27', border: '1px solid var(--bdr)', borderRadius: 12, padding: '24px', position: 'relative' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                      <span className="badge pur" style={{ padding: '4px 10px', borderRadius: 8, fontSize: 10, fontWeight: 800 }}>{p.id}</span>
                      <div style={{ fontSize: 16, fontWeight: 700, color: 'var(--txt)' }}>{p.name}</div>
                    </div>
                    <button className="btn sm" style={{ background: 'rgba(226,75,74,0.1)', color: 'var(--red)', border: '1px solid rgba(226,75,74,0.2)', padding: '6px 12px' }}>Delete</button>
                  </div>

                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 40 }}>
                    {/* Agents Section */}
                    <div>
                      <div style={{ fontSize: 11, fontWeight: 700, color: 'var(--acc2)', letterSpacing: 0.5, marginBottom: 15, textTransform: 'uppercase' }}>Assigned Agents</div>
                      <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                        {users.filter(u => u.role === 'agent').map(u => (
                          <label key={u.id} style={{ display: 'flex', alignItems: 'center', gap: 10, cursor: 'pointer' }}>
                            <input 
                              type="checkbox" 
                              style={{ accentColor: 'var(--acc)' }} 
                              checked={p.agents?.some((a:any) => a.id === u.id)} 
                              onChange={(e) => handleAssignmentChange(p.id, u.id, 'agent', e.target.checked)}
                            />
                            <div style={{ fontSize: 13, color: 'var(--txt2)' }}>{u.name} <span style={{ fontSize: 10, color: 'var(--txt3)', marginLeft: 5 }}>{u.empId}</span></div>
                          </label>
                        ))}
                      </div>
                    </div>

                    {/* Managers Section */}
                    <div>
                      <div style={{ fontSize: 11, fontWeight: 700, color: 'var(--acc2)', letterSpacing: 0.5, marginBottom: 15, textTransform: 'uppercase' }}>Assigned Managers</div>
                      <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                        {users.filter(u => u.role === 'manager').map(u => (
                          <label key={u.id} style={{ display: 'flex', alignItems: 'center', gap: 10, cursor: 'pointer' }}>
                            <input 
                              type="checkbox" 
                              style={{ accentColor: 'var(--amb)' }} 
                              checked={p.managers?.some((m:any) => m.id === u.id)} 
                              onChange={(e) => handleAssignmentChange(p.id, u.id, 'manager', e.target.checked)}
                            />
                            <div style={{ fontSize: 13, color: 'var(--txt2)' }}>{u.name} <span style={{ fontSize: 10, color: 'var(--txt3)', marginLeft: 5 }}>{u.empId}</span></div>
                          </label>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
          )
        )}

        {activeTab === 'columns' && (
          loading ? (
            <div>
              <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: 15 }}>
                <div className="skel" style={{ width: 110, height: 32, borderRadius: 6 }}></div>
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 12 }}>
                {[1, 2, 3, 4, 5, 6].map(i => (
                  <div key={i} className="skel" style={{ height: 50, borderRadius: 8 }}></div>
                ))}
              </div>
            </div>
          ) : (
            <div>
              <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: 15 }}>
                <button className="btn pr" style={{ borderRadius: 6, padding: '7px 15px', fontSize: 11 }} onClick={() => setIsAddingColumn(true)}>+ Add Column</button>
              </div>

              {isAddingColumn && (
                <div style={{ display: 'flex', alignItems: 'center', background: 'rgba(79,125,255,0.05)', border: '1px dashed var(--acc)', padding: '12px 16px', borderRadius: 8, gap: 10, marginBottom: 15 }}>
                  <input className="finp" placeholder="Column Name (e.g. Pin Code)" style={{ flex: 1 }} value={newColumn.label} onChange={e => setNewColumn({ ...newColumn, label: e.target.value })} />
                  <select className="finp" style={{ width: 150 }} value={newColumn.type} onChange={e => setNewColumn({ ...newColumn, type: e.target.value })}>
                    <option value="string">String</option>
                    <option value="number">Number</option>
                    <option value="date">Date</option>
                    <option value="boolean">Boolean</option>
                  </select>
                  <button className="btn pr" onClick={handleAddColumn}>Save</button>
                  <button className="btn sm" onClick={() => setIsAddingColumn(false)}>Cancel</button>
                </div>
              )}

              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 12, marginBottom: 15 }}>
                {columns.map((col, idx) => (
                  <div key={col.id} style={{ display: 'flex', alignItems: 'center', background: 'var(--bg2)', border: '1px solid var(--bdr)', padding: '12px 16px', borderRadius: 8 }}>
                    <div style={{ flex: 1, fontSize: 13, display: 'flex', flexDirection: 'column', gap: 3 }}>
                      <div>{col.label}</div>
                      <div style={{ color: 'var(--txt3)', fontSize: 10, fontFamily: 'monospace' }}>{col.key} <span style={{ color: 'var(--acc2)', marginLeft: 5 }}>[{col.type}]</span></div>
                    </div>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                      <label style={{ display: 'flex', alignItems: 'center', gap: 5, fontSize: 11, color: 'var(--txt2)', cursor: 'pointer' }}>
                        <input type="checkbox" checked={col.visible} onChange={() => handleToggleVisibility(col)} style={{ cursor: 'pointer', accentColor: 'var(--pur)' }} /> Table View
                      </label>
                      <label style={{ display: 'flex', alignItems: 'center', gap: 5, fontSize: 11, color: 'var(--txt2)', cursor: 'pointer' }}>
                        <input type="checkbox" checked={col.showInProfile !== false} onChange={() => handleToggleProfileVisibility(col)} style={{ cursor: 'pointer', accentColor: 'var(--acc)' }} /> Dashboard Field
                      </label>
                    </div>
                  </div>
                ))}
              </div>
            </div>

          )
        )}

        {activeTab === 'bulk' && (
          loading ? (
            <div style={{ maxWidth: 1100, display: 'flex', flexDirection: 'column', gap: 20 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div>
                  <div className="skel" style={{ width: 250, height: 20, marginBottom: 8, borderRadius: 4 }}></div>
                  <div className="skel" style={{ width: 400, height: 14, borderRadius: 4 }}></div>
                </div>
                <div className="skel" style={{ width: 160, height: 32, borderRadius: 6 }}></div>
              </div>
              <div className="skel" style={{ height: 160, borderRadius: 10, border: '2px dashed rgba(255,255,255,0.05)' }}></div>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 14 }}>
                {[1, 2, 3].map(i => (
                  <div key={i} className="skel" style={{ height: 180, borderRadius: 8 }}></div>
                ))}
              </div>
            </div>
          ) : (
            <div style={{ maxWidth: 1100 }}>
              {/* Header */}
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
                <div>
                  <div style={{ fontSize: 15, fontWeight: 700 }}>📤 Bulk Upload — Customer Data</div>
                  <div style={{ fontSize: 11, color: 'var(--txt3)', marginTop: 3 }}>Import leads from Excel (.xlsx) or CSV files directly into the database</div>
                </div>
                <button
                  onClick={handleDownloadTemplate}
                  style={{ fontSize: 11, color: 'var(--acc2)', background: 'rgba(79,125,255,0.1)', border: '1px solid rgba(79,125,255,0.2)', padding: '6px 14px', borderRadius: 6, cursor: 'pointer' }}
                >
                  ⬇ Download Template (.xlsx)
                </button>
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
                {/* Top: File + Preview */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>

                  {/* Drop Zone */}
                  <label style={{ border: `2px dashed ${uploadFile ? 'var(--grn)' : 'rgba(255,255,255,0.12)'}`, borderRadius: 10, padding: '36px 20px', textAlign: 'center', cursor: 'pointer', background: uploadFile ? 'rgba(46,204,138,0.04)' : 'rgba(255,255,255,0.02)', display: 'block', transition: 'all 0.2s' }}>
                    <input type="file" accept=".csv,.xlsx,.xls" style={{ display: 'none' }} onChange={(e) => handleFileSelect(e.target.files?.[0] || null)} />
                    {uploadFile ? (
                      <div>
                        <div style={{ fontSize: 28, marginBottom: 8 }}>✅</div>
                        <div style={{ fontWeight: 600, color: 'var(--grn)', fontSize: 14 }}>{uploadFile.name}</div>
                        <div style={{ color: 'var(--txt3)', fontSize: 11, marginTop: 4 }}>
                          {(uploadFile.size / 1024).toFixed(1)} KB · {previewRows.length > 0 ? `${previewRows.length}+ rows detected` : 'Parsing...'}
                        </div>
                        <button onClick={(e) => { e.preventDefault(); handleReset(); }} style={{ marginTop: 10, background: 'transparent', border: 'none', color: 'var(--red)', cursor: 'pointer', fontSize: 11 }}>✕ Remove file</button>
                      </div>
                    ) : (
                      <div>
                        <div style={{ fontSize: 32, marginBottom: 8 }}>📁</div>
                        <div style={{ fontWeight: 600, color: 'var(--txt2)', fontSize: 13 }}>Click to select or drag & drop</div>
                        <div style={{ color: 'var(--txt3)', fontSize: 11, marginTop: 4 }}>Supports .CSV, .XLSX, .XLS</div>
                      </div>
                    )}
                  </label>

                  {/* Validation Error */}
                  {validationError && (
                    <div style={{ background: 'rgba(226,75,74,0.06)', border: '1px solid rgba(226,75,74,0.2)', borderRadius: 8, padding: '16px 20px', color: 'var(--red)', fontSize: 12 }}>
                      <div style={{ fontWeight: 700, marginBottom: 5 }}>❌ Validation Error</div>
                      {validationError}
                    </div>
                  )}

                  {/* Preview Table */}
                  {previewRows.length > 0 && (
                    <div style={{ background: '#161b27', border: '1px solid var(--bdr)', borderRadius: 8, overflow: 'hidden' }}>
                      <div style={{ padding: '10px 16px', borderBottom: '1px solid var(--bdr)', fontSize: 12, fontWeight: 600, color: 'var(--txt2)' }}>Preview (first 5 rows)</div>
                      <div style={{ overflowX: 'auto' }}>
                        <table className="tbl" style={{ fontSize: 11 }}>
                          <thead>
                            <tr>
                              {previewHeaders.map(h => (
                                <th key={h} style={{ whiteSpace: 'nowrap', padding: '8px 12px', fontSize: 10 }}>{h}</th>
                              ))}
                            </tr>
                          </thead>
                          <tbody>
                            {previewRows.map((row, i) => (
                              <tr key={i}>
                                {previewHeaders.map(h => (
                                  <td key={h} style={{ whiteSpace: 'nowrap', padding: '6px 12px', maxWidth: 140, overflow: 'hidden', textOverflow: 'ellipsis' }}>
                                    {row[h] ?? '—'}
                                  </td>
                                ))}
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    </div>
                  )}

                  {/* Progress */}
                  {uploading && (
                    <div style={{ background: '#161b27', border: '1px solid var(--bdr)', borderRadius: 8, padding: '16px 20px' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12, marginBottom: 8 }}>
                        <span style={{ color: 'var(--txt2)' }}>Uploading...</span>
                        <span style={{ color: 'var(--acc2)' }}>{uploadProgress}%</span>
                      </div>
                      <div style={{ background: 'rgba(255,255,255,0.06)', borderRadius: 4, height: 6, overflow: 'hidden' }}>
                        <div style={{ height: '100%', width: `${uploadProgress}%`, background: 'linear-gradient(90deg, #4f7dff, #7c5aff)', borderRadius: 4, transition: 'width 0.4s ease' }} />
                      </div>
                    </div>
                  )}

                  {/* Result */}
                  {uploadResult && !uploading && (
                    <div style={{ background: uploadResult.success ? 'rgba(46,204,138,0.06)' : 'rgba(226,75,74,0.06)', border: `1px solid ${uploadResult.success ? 'rgba(46,204,138,0.2)' : 'rgba(226,75,74,0.2)'}`, borderRadius: 8, padding: '16px 20px' }}>
                      {uploadResult.success ? (
                        <div>
                          <div style={{ fontWeight: 700, fontSize: 14, color: 'var(--grn)', marginBottom: 12 }}>✅ Upload Complete</div>
                          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 12 }}>
                            {[['Total', uploadResult.total, '#fff'], ['Imported', uploadResult.imported, 'var(--grn)'], ['Updated', uploadResult.updated, 'var(--acc2)'], ['Skipped', uploadResult.skipped, 'var(--txt3)']].map(([label, val, color]) => (
                              <div key={label as string} style={{ textAlign: 'center', background: 'rgba(255,255,255,0.04)', borderRadius: 6, padding: '10px 8px' }}>
                                <div style={{ fontSize: 22, fontWeight: 800, color: color as string }}>{val as number}</div>
                                <div style={{ fontSize: 10, color: 'var(--txt3)', marginTop: 2 }}>{label as string}</div>
                              </div>
                            ))}
                          </div>
                          {uploadResult.errors?.length > 0 && (
                            <div style={{ marginTop: 12, fontSize: 11, color: 'var(--amb)' }}>
                              ⚠ {uploadResult.errors.length} row error(s): {uploadResult.errors[0]}
                            </div>
                          )}
                          <button className="btn pr" style={{ marginTop: 14, fontSize: 11 }} onClick={handleReset}>Upload Another File</button>
                        </div>
                      ) : (
                        <div>
                          <div style={{ fontWeight: 700, color: 'var(--red)', marginBottom: 8 }}>❌ Upload Failed</div>
                          <div style={{ fontSize: 12, color: 'var(--txt2)' }}>{uploadResult.error}</div>
                          <button className="btn" style={{ marginTop: 12, fontSize: 11 }} onClick={handleReset}>Try Again</button>
                        </div>
                      )}
                    </div>
                  )}
                </div>

                {/* Bottom: Config Row — horizontal */}
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 14 }}>


                  {/* Assign Portfolio */}
                  <div style={{ background: '#161b27', border: '1px solid var(--bdr)', borderRadius: 8, padding: '14px 16px' }}>
                    <div style={{ fontSize: 11, fontWeight: 700, marginBottom: 10, color: 'var(--txt3)', letterSpacing: '0.5px' }}>ASSIGN TO PORTFOLIO</div>
                    <select className="finp" value={uploadPortfolio} onChange={e => setUploadPortfolio(e.target.value)}>
                      <option value="">— Auto / From File —</option>
                      {portfolios.map((p: any) => (
                        <option key={p.id} value={p.id}>{p.name}</option>
                      ))}
                    </select>
                    <div style={{ fontSize: 10, color: 'var(--txt3)', marginTop: 8, lineHeight: 1.5 }}>If file has a "Portfolio" column, it takes priority</div>
                  </div>

                  {/* Duplicate Handling */}
                  <div style={{ background: '#161b27', border: '1px solid var(--bdr)', borderRadius: 8, padding: '14px 16px' }}>
                    <div style={{ fontSize: 11, fontWeight: 700, marginBottom: 10, color: 'var(--txt3)', letterSpacing: '0.5px' }}>DUPLICATE HANDLING</div>
                    <select className="finp" value={duplicateHandling} onChange={e => setDuplicateHandling(e.target.value)}>
                      <option>Skip Duplicates</option>
                      <option>Update Existing</option>
                      <option>Update Missing Fields Only</option>
                    </select>
                    <div style={{ marginTop: 8, fontSize: 10, color: 'var(--txt3)', lineHeight: 1.6 }}>
                      {duplicateHandling === 'Skip Duplicates' && '🔵 Existing records will not be changed. Only new account numbers will be added.'}
                      {duplicateHandling === 'Update Existing' && '🟡 All fields in the file will overwrite existing database values.'}
                      {duplicateHandling === 'Update Missing Fields Only' && '🟢 Only empty/missing fields in the database will be filled from the file.'}
                    </div>
                  </div>

                  {/* Field Mapping Guide */}
                  <div style={{ background: '#161b27', border: '1px solid var(--bdr)', borderRadius: 8, padding: '14px 16px' }}>
                    <div style={{ fontSize: 11, fontWeight: 700, marginBottom: 10, color: 'var(--txt3)', letterSpacing: '0.5px' }}>ACCEPTED COLUMN NAMES</div>
                    {[
                      ['Account Number', 'Required — unique key'],
                      ['Customer Name', 'Full name'],
                      ['Mobile Number', 'Primary mobile'],
                      ['Outstanding Amount', 'Total outstanding'],
                      ['DPD', 'Days past due'],
                      ['Status', 'active / overdue / ptp'],
                      ['Portfolio', 'Portfolio ID or name'],
                      ['Agent', 'Agent username or empId'],
                    ].map(([col, desc]) => (
                      <div key={col} style={{ display: 'flex', gap: 8, marginBottom: 5, fontSize: 10 }}>
                        <span style={{ fontFamily: 'monospace', color: 'var(--acc2)', minWidth: 130 }}>{col}</span>
                        <span style={{ color: 'var(--txt3)' }}>{desc}</span>
                      </div>
                    ))}
                  </div>

                </div>

                {/* Upload Button */}
                <button
                  className="btn pr"
                  style={{ width: '100%', padding: 14, fontSize: 13, background: 'var(--acc)', borderRadius: 8, fontWeight: 700, opacity: (!uploadFile || uploading || !!validationError) ? 0.5 : 1 }}
                  onClick={handleStartUpload}
                  disabled={!uploadFile || uploading || !!validationError}
                >
                  {uploading ? '⏳ Processing...' : '↑ Start Upload'}
                </button>

              </div>
            </div>

          )
        )}

        {activeTab === 'audit' && (
          <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
            <div style={{ overflowX: 'auto' }}>
              <table className="tbl">
                <thead>
                  <tr>
                    <th>Timestamp</th>
                    <th>User</th>
                    <th>Action</th>
                    <th>Entity</th>
                    <th>Details</th>
                  </tr>
                </thead>
                <tbody>
                  {auditLogs.map((log: any) => (
                    <tr key={log.id}>
                      <td className="mn" style={{ fontSize: 11, color: 'var(--txt3)' }}>
                        {new Date(log.timestamp).toLocaleString()}
                      </td>
                      <td>
                        <div style={{ fontSize: 13, fontWeight: 600 }}>{log.user?.name}</div>
                        <div style={{ fontSize: 10, color: 'var(--txt3)' }}>{log.user?.empId}</div>
                      </td>
                      <td>
                        <span className="badge" style={{
                          background: log.action.includes('REJECTED') ? 'rgba(226,75,74,0.1)' :
                            log.action.includes('APPROVED') ? 'rgba(46,204,138,0.1)' : 'rgba(79,125,255,0.1)',
                          color: log.action.includes('REJECTED') ? 'var(--red)' :
                            log.action.includes('APPROVED') ? 'var(--grn)' : 'var(--acc2)',
                          fontSize: 10
                        }}>
                          {log.action}
                        </span>
                      </td>
                      <td>
                        <div style={{ fontSize: 12 }}>{log.entityType}</div>
                        <div style={{ fontSize: 10, color: 'var(--txt3)' }}>ID: {log.entityId}</div>
                      </td>
                      <td style={{ fontSize: 11, color: 'var(--txt2)', maxWidth: 300, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                        {JSON.stringify(log.details)}
                      </td>
                    </tr>
                  ))}
                  {auditLogs.length === 0 && (
                    <tr><td colSpan={5} style={{ textAlign: 'center', padding: 40, color: 'var(--txt3)' }}>No audit logs found.</td></tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}


        {isEditModalOpen && editUser && (
          <div className="modal-overlay" style={{ position: 'fixed', top: 0, left: 0, width: '100%', height: '100%', background: 'rgba(0,0,0,0.85)', zIndex: 100, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <div className="modal-content" style={{ background: 'var(--bg2)', border: '1px solid var(--bdr)', borderRadius: 12, width: '100%', maxWidth: '750px', maxHeight: '90vh', overflow: 'hidden', display: 'flex', flexDirection: 'column' }}>
              <div style={{ padding: '16px 20px', borderBottom: '1px solid var(--bdr)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div style={{ fontSize: 15, fontWeight: 700 }}>Edit User — {editUser.name}</div>
                <button style={{ background: 'transparent', border: 'none', color: 'var(--txt3)', fontSize: 20, cursor: 'pointer' }} onClick={() => setIsEditModalOpen(false)}>✕</button>
              </div>

              <div style={{ flex: 1, overflowY: 'auto', padding: '20px' }}>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '15px' }}>
                  <div className="ff"><label>Full Name</label><input className="finp" value={editUser.name} onChange={e => setEditUser({ ...editUser, name: e.target.value })} /></div>
                  <div className="ff"><label>Username</label><input className="finp" value={editUser.username} onChange={e => setEditUser({ ...editUser, username: e.target.value })} /></div>
                  <div className="ff"><label>Employee ID</label><input className="finp" value={editUser.empId} onChange={e => setEditUser({ ...editUser, empId: e.target.value })} /></div>
                  <div className="ff"><label>Role</label>
                    <select className="finp" value={editUser.role} onChange={e => setEditUser({ ...editUser, role: e.target.value })}>
                      <option>admin</option><option>manager</option><option>agent</option>
                    </select>
                  </div>
                  <div className="ff"><label>Reports To</label>
                    <select className="finp" value={editUser.managerId || ''} onChange={e => setEditUser({ ...editUser, managerId: e.target.value })}>
                      <option value="">— None —</option>
                      {users.filter(x => (x.role === 'manager' || x.role === 'admin') && x.id !== editUser.id).map(u => (
                        <option key={u.id} value={u.id}>{u.name} ({u.empId})</option>
                      ))}
                    </select>
                  </div>
                  <div className="ff"><label>Email</label><input className="finp" value={editUser.email || ''} onChange={e => setEditUser({ ...editUser, email: e.target.value })} /></div>
                  <div className="ff"><label>Contact</label><input className="finp" value={editUser.contact || ''} onChange={e => setEditUser({ ...editUser, contact: e.target.value })} /></div>
                  <div className="ff"><label>DOB</label><input className="finp" value={editUser.dob || ''} onChange={e => setEditUser({ ...editUser, dob: e.target.value })} /></div>
                  <div className="ff"><label>DOJ</label><input className="finp" value={editUser.doj || ''} onChange={e => setEditUser({ ...editUser, doj: e.target.value })} /></div>
                </div>
                <div className="ff" style={{ marginTop: 15 }}><label>Address</label><input className="finp" value={editUser.address || ''} onChange={e => setEditUser({ ...editUser, address: e.target.value })} /></div>
              </div>
              <div style={{ padding: '16px 20px', borderTop: '1px solid var(--bdr)', display: 'flex', gap: 10 }}>
                <button className="btn pr" style={{ flex: 4, padding: 12, fontSize: 13, background: 'var(--acc)' }} onClick={handleSave}>✓ Save</button>
                <button className="btn" style={{ flex: 1, padding: 12, fontSize: 13, background: '#2e2e2e', color: '#ff4d4d', border: '1px solid #444' }} onClick={() => setIsEditModalOpen(false)}>Cancel</button>
              </div>
            </div>
          </div>
        )}

        {isDeactivateModalOpen && deactivatingUser && (
          <div className="modal-overlay" style={{ position: 'fixed', top: 0, left: 0, width: '100%', height: '100%', background: 'rgba(0,0,0,0.85)', zIndex: 100, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <div className="modal-content" style={{ background: 'var(--bg2)', border: '1px solid var(--bdr)', borderRadius: 12, width: '100%', maxWidth: '500px', padding: '20px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 20 }}>
                <div style={{ fontSize: 15, fontWeight: 700 }}>Deactivate User — {deactivatingUser.name}</div>
                <button style={{ background: 'transparent', border: 'none', color: 'var(--txt3)', fontSize: 20, cursor: 'pointer' }} onClick={() => setIsDeactivateModalOpen(false)}>✕</button>
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
    </div>
  );
};

export default Admin;
