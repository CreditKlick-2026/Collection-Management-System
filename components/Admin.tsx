"use client";
import React, { useState, useEffect } from 'react';
import * as XLSX from 'xlsx';
import { useApp } from '@/context/AppContext';

const Admin = () => {
  const { toast, user } = useApp();
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
  const [isPasswordModalOpen, setIsPasswordModalOpen] = useState(false);
  const [resetUser, setResetUser] = useState<any>(null);
  const [newPassword, setNewPassword] = useState('');
  const [resetting, setResetting] = useState(false);

  // Bulk Upload State
  const [uploadFile, setUploadFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [activeJob, setActiveJob] = useState<any>(null);

  // Polling for background job status
  useEffect(() => {
    let interval: any;

    const checkStatus = async () => {
      if (!activeJob?.id) return;
      try {
        const res = await fetch(`/api/admin/bulk-upload/status?jobId=${activeJob.id}`);
        const data = await res.json();
        if (data.job) {
          setActiveJob(data.job);
          if (data.job.status === 'completed' || data.job.status === 'failed') {
            clearInterval(interval);
            if (data.job.status === 'completed') {
              toast(`✅ Bulk Upload Completed! ${data.job.successCount} imported.`);
              fetchData(); // Refresh lists
            }
          }
        }
      } catch (e) { console.error(e); }
    };

    if (activeJob && (activeJob.status === 'processing' || activeJob.status === 'pending')) {
      interval = setInterval(checkStatus, 2000);
    }

    return () => clearInterval(interval);
  }, [activeJob?.id, activeJob?.status]);

  // Initial check for any active job on mount
  useEffect(() => {
    const fetchActiveJob = async () => {
      try {
        const res = await fetch('/api/admin/bulk-upload/status?checkActive=true');
        const data = await res.json();
        if (data.activeJob) setActiveJob(data.activeJob);
      } catch (e) {}
    };
    fetchActiveJob();
  }, []);
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

  // Master Lists State
  const [masterLists, setMasterLists] = useState<any[]>([]);
  const [newListItem, setNewListItem] = useState({ type: '', value: '' });

  // Flush DB State
  const [isFlushModalOpen, setIsFlushModalOpen] = useState(false);
  const [flushPassword, setFlushPassword] = useState('');
  const [flushing, setFlushing] = useState(false);
  const [flushAction, setFlushAction] = useState<'all' | 'audit' | 'selective'>('all');
  const [cleanupMonth, setCleanupMonth] = useState(new Date().getMonth() + 1);
  const [cleanupYear, setCleanupYear] = useState(new Date().getFullYear());

  const DEFAULT_LISTS: Record<string, string[]> = {
    PAYMENT_MODE: ['Cash', 'NEFT', 'IMPS', 'UPI', 'Cheque', 'DD'],
    PTP_STATUS: ['Promised to Pay', 'Partial Amount', 'Full Outstanding', 'Minimum Amount'],
    DISPUTE_STATUS: ['Card Not Received', 'Charges Related Issue', 'Fraud', 'False Commitment'],
    FLAG_OPTION: ['approved', 'rejected', 'flagged', 'escalated']
  };

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
    if (activeTab === 'columns' || activeTab === 'bulk') {
      const res = await fetch('/api/admin/columns');
      setColumns(await res.json());
    }
    if (activeTab === 'audit') {
      const res = await fetch('/api/admin/audit-logs');
      setAuditLogs(await res.json());
    }
    if (activeTab === 'lists') {
      const res = await fetch('/api/admin/master-lists');
      const data = await res.json();
      setMasterLists(Array.isArray(data) ? data : []);
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
    const isEditing = !!editUser.id;

    // Validation for new user
    if (!isEditing) {
      if (!editUser.password) return toast('Password is required');
      if (editUser.password !== editUser.confirmPassword) return toast('Passwords do not match');
    }

    const url = isEditing ? `/api/admin/users/${editUser.id}` : '/api/admin/users';
    const method = isEditing ? 'PUT' : 'POST';

    const res = await fetch(url, {
      method,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(editUser)
    });
    if (res.ok) {
      setIsEditModalOpen(false);
      fetchData();
      toast(isEditing ? 'User updated!' : 'User created!');
    } else {
      toast('Failed to save user');
    }
  };

  const toggleUserStatus = async (user: any) => {
    const newStatus = !user.active;
    const res = await fetch(`/api/admin/users/${user.id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ...user, active: newStatus })
    });
    if (res.ok) {
      setIsDeactivateModalOpen(false);
      fetchData();
      toast(`User ${newStatus ? 'activated' : 'deactivated'} successfully`);
    } else {
      toast('Failed to update user status');
    }
  };

  const handleDeleteUser = async (user: any) => {
    if (!window.confirm(`Are you sure you want to PERMANENTLY DELETE user "${user.name}"? This action cannot be undone.`)) return;

    try {
      const res = await fetch(`/api/admin/users/${user.id}`, {
        method: 'DELETE'
      });
      if (res.ok) {
        toast('User deleted successfully');
        fetchData();
      }
    } catch (e) {
      console.error(e);
      toast('Error deleting user');
    }
  };

  const handlePasswordReset = async () => {
    if (!newPassword.trim()) return toast('Password cannot be empty');
    setResetting(true);
    try {
      const res = await fetch(`/api/admin/users/${resetUser.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...resetUser, password: newPassword })
      });
      if (res.ok) {
        toast('Password updated successfully ✓');
        setIsPasswordModalOpen(false);
        setNewPassword('');
      } else {
        toast('Failed to reset password');
      }
    } catch (e) {
      toast('Network error');
    }
    setResetting(false);
  };

  const handleDownloadSample = () => {
    // Standard system fields
    const baseHeaders = ['Account No', 'Customer Name', 'Portfolio', 'Bucket', 'DPD', 'Outstanding', 'Mobile', 'Alt Mobile', 'Email', 'Address', 'Pincode', 'City', 'State'];
    // Merge with any dynamic columns defined, but filter out internal fields
    const dynamicHeaders = columns
      .map(c => c.label)
      .filter(label => !['Created Date', 'Updated Date', 'Created At', 'Updated At'].includes(label));
    const allHeaders = [...new Set([...baseHeaders, ...dynamicHeaders])];

    const csvContent = allHeaders.join(',') + '\n' + allHeaders.map(() => 'Sample Data').join(',');
    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.setAttribute('hidden', '');
    a.setAttribute('href', url);
    a.setAttribute('download', 'debt_recover_sample_upload.csv');
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    toast('Sample file downloaded ✓');
  };

  const handleAddListItem = async (type: string) => {
    const val = (newListItem as any)[type];
    if (!val) return;
    const res = await fetch('/api/admin/master-lists', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ type, value: val })
    });
    if (res.ok) {
      setNewListItem(prev => ({ ...prev, [type]: '' }));
      fetchData();
    }
  };

  const handleDeleteListItem = async (id: number) => {
    if (!confirm('Are you sure?')) return;
    const res = await fetch(`/api/admin/master-lists?id=${id}`, { method: 'DELETE' });
    if (res.ok) fetchData();
  };

  const handleFileSelect = (file: File | null) => {
    setUploadFile(file);
    setUploadResult(null);
    setPreviewRows([]);
    setPreviewHeaders([]);
    setValidationError(null);
    setColumnMatchResult(null);
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

          // Extremely robust Account No detection
          const actualHeaders = rawHeaders.map(h => String(h).toLowerCase().replace(/[^a-z0-9]/g, '').trim());
          const hasAccountNo = actualHeaders.some(h => 
            ['accountno', 'accountn', 'accno', 'accountnumber', 'loanaccount', 'loanid', 'customerid', 'accntno'].includes(h) || h.includes('account')
          );
          
          if (!hasAccountNo) {
            setValidationError(`Validation Error: Column 'Account No' not found. We checked: ${rawHeaders.join(', ')}`);
          }
        }
      } catch (err: any) {
        setValidationError("Error parsing file.");
      }
    };
    reader.readAsBinaryString(file);
  };

  const [columnMatchResult, setColumnMatchResult] = useState<any>(null);

  const handleCheckColumns = () => {
    if (!previewHeaders.length) return;
    
    const standard = [
      { label: "Account Number", keys: ['accountno', 'accountnumber', 'accno', 'loanid', 'customerid'] },
      { label: "Customer Name", keys: ['customername', 'name', 'borrowername'] },
      { label: "Mobile Number", keys: ['mobilenumber', 'mobile', 'phone'] },
      { label: "Total Outstanding", keys: ['totaloutstanding', 'outstanding', 'outstandingamount'] },
      { label: "Principle Outstanding", keys: ['principleoutstanding', 'principaloutstanding'] },
      { label: "Min Amount Due", keys: ['minamountdue', 'minamtdue'] },
      { label: "DPD", keys: ['dpd', 'dayspastdue'] },
      { label: "Product Type", keys: ['producttype', 'product'] },
      { label: "Bank / Lender", keys: ['banklender', 'bank', 'lender'] },
      { label: "PAN Number", keys: ['pannumber', 'pan'] },
      { label: "Status", keys: ['status'] },
      { label: "Portfolio", keys: ['portfolio', 'portfolioid'] },
      { label: "Assigned Agent", keys: ['assignedagent', 'agent', 'agentusername'] },
      { label: "City", keys: ['city'] },
      { label: "State", keys: ['state'] },
      { label: "Email", keys: ['email'] },
      { label: "Alt Mobile", keys: ['altmobile'] },
      { label: "Address", keys: ['address'] },
      { label: "Bucket", keys: ['bucket', 'bkt2'] },
      { label: "Eligible_For_Update", keys: ['eligibleforupdate', 'eligibleforupdate'] }
    ];

    const actual = previewHeaders.map(h => String(h).toLowerCase().replace(/[^a-z0-9]/g, '').trim());
    
    const report = standard.map(s => {
      const foundIdx = actual.findIndex(a => s.keys.includes(a) || a.includes(s.label.toLowerCase().replace(/[^a-z0-9]/g, '')));
      return {
        label: s.label,
        matched: foundIdx !== -1,
        fileHeader: foundIdx !== -1 ? previewHeaders[foundIdx] : null
      };
    });

    const extra = previewHeaders.filter(h => {
      const normalized = String(h).toLowerCase().replace(/[^a-z0-9]/g, '');
      return !standard.some(s => s.keys.includes(normalized) || normalized.includes(s.label.toLowerCase().replace(/[^a-z0-9]/g, '')));
    });

    setColumnMatchResult({ report, extra });
  };

  const handleStartUpload = async () => {
    if (!uploadFile) return;
    setUploading(true);
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
          
          const res = await fetch('/api/admin/bulk-upload', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              data: json,
              agentId: uploadAgent || null,
              portfolioId: uploadPortfolio || null,
              duplicateHandling,
              fileName: uploadFile.name
            })
          });
          const result = await res.json();
          if (result.success && result.jobId) {
            setActiveJob({ id: result.jobId, status: 'processing', processedRows: 0, totalRows: json.length });
            setUploadFile(null);
            setPreviewRows([]);
            toast('🚀 Bulk upload started in background');
          } else {
            toast('❌ Error: ' + (result.error || 'Failed to start upload'));
          }
        } catch (err: any) {
          toast('❌ Error: ' + err.message);
        } finally {
          setUploading(false);
        }
      };
      reader.readAsBinaryString(uploadFile);
    } catch (err: any) {
      toast('❌ Error: ' + err.message);
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

  const handleFlushDB = async () => {
    if (!flushPassword) return toast("Password required");
    setFlushing(true);
    try {
      const res = await fetch('/api/admin/flush-db', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          password: flushPassword, 
          userId: user?.id, 
          action: flushAction,
          month: cleanupMonth,
          year: cleanupYear
        })
      });
      if (res.ok) {
        const data = await res.json();
        if (flushAction === 'selective') {
          toast(`Cleanup done: ${data.deletedCount} deleted, ${data.skippedCount} skipped (with payments) ✓`);
        } else {
          toast(`${flushAction === 'all' ? 'Database flushed' : 'Audit logs cleared'} successfully ✓`);
        }
        setIsFlushModalOpen(false);
        setFlushPassword('');
        fetchData();
      } else {
        const err = await res.json();
        toast(err.message || "Flush failed");
      }
    } catch (e) {
      toast("Network error during flush");
    }
    setFlushing(false);
  };

  const handleDownloadTemplate = () => {
    const headers = [
      "Account Number",
      "Customer Name",
      "Mobile Number",
      "Total Outstanding",
      "Principle Outstanding",
      "Min Amount Due",
      "DPD",
      "Product Type",
      "Bank / Lender",
      "PAN Number",
      "Status",
      "Portfolio",
      "Assigned Agent",
      "City",
      "State",
      "Email",
      "Alt Mobile",
      "Address",
      "Bucket",
      "Eligible_For_Update"
    ];
    
    // Add any extra custom columns that are not in the standard list
    const standardKeys = ['account_no', 'name', 'mobile', 'outstanding', 'principle_outstanding', 'min_amt_due', 'dpd', 'product', 'bank', 'pan', 'status', 'portfolio', 'assignedAgent', 'city', 'state', 'email', 'alt_mobile', 'address', 'bkt_2', 'eligible_for_update'];
    const custom = columns
      .filter(c => !standardKeys.includes(c.key))
      .map(c => c.label);

    const allHeaders = [...headers, ...custom];
    
    const ws = XLSX.utils.aoa_to_sheet([
      allHeaders,
      allHeaders.map(h => {
        if (h === "Account Number") return "LN-2024-TEST-001";
        if (h === "Total Outstanding") return "50000";
        if (h === "DPD") return "30";
        if (h === "Mobile Number") return "9876543210";
        return "Sample";
      })
    ]);
    
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Upload Template");
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
      {/* Sticky Progress Bar for Background Jobs */}
      {activeJob && (
        <div style={{ 
          position: 'sticky', top: 0, zIndex: 1000, 
          background: activeJob.status === 'completed' ? 'rgba(34,197,94,0.1)' : 'var(--bg2)', 
          borderBottom: `1px solid ${activeJob.status === 'completed' ? 'rgba(34,197,94,0.3)' : 'var(--bdr)'}`,
          padding: '12px 20px', backdropFilter: 'blur(10px)'
        }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
              <div style={{ fontSize: 18 }}>{activeJob.status === 'completed' ? '✅' : '⏳'}</div>
              <div>
                <div style={{ fontSize: 13, fontWeight: 800, color: 'var(--txt)' }}>
                  {activeJob.status === 'completed' ? 'Upload Completed' : 'Processing Bulk Upload...'}
                </div>
                <div style={{ fontSize: 10, color: 'var(--txt3)', marginTop: 2 }}>{activeJob.fileName} • {activeJob.processedRows} of {activeJob.totalRows} processed</div>
              </div>
            </div>
            
            <div style={{ display: 'flex', gap: 20 }}>
              <div style={{ textAlign: 'right' }}>
                <div style={{ fontSize: 10, fontWeight: 700, color: '#2ecca7' }}>SUCCESS</div>
                <div style={{ fontSize: 14, fontWeight: 800 }}>{activeJob.successCount}</div>
              </div>
              <div style={{ textAlign: 'right' }}>
                <div style={{ fontSize: 10, fontWeight: 700, color: 'var(--acc2)' }}>UPDATED</div>
                <div style={{ fontSize: 14, fontWeight: 800 }}>{activeJob.updatedCount}</div>
              </div>
              <div style={{ textAlign: 'right' }}>
                <div style={{ fontSize: 10, fontWeight: 700, color: '#f5a623' }}>ERRORS</div>
                <div style={{ fontSize: 14, fontWeight: 800 }}>{activeJob.errorCount}</div>
              </div>
              {activeJob.status === 'completed' && (
                <button onClick={() => setActiveJob(null)} style={{ background: 'var(--bg3)', border: '1px solid var(--bdr)', padding: '5px 12px', borderRadius: 6, fontSize: 11, fontWeight: 700, color: 'var(--txt)' }}>Close</button>
              )}
            </div>
          </div>
          <div style={{ height: 6, background: 'rgba(255,255,255,0.05)', borderRadius: 3, overflow: 'hidden' }}>
            <div style={{ 
              height: '100%', background: activeJob.status === 'completed' ? '#22c55e' : 'var(--acc)', 
              width: `${(activeJob.processedRows / activeJob.totalRows) * 100}%`,
              transition: 'width 0.4s ease-out'
            }} />
          </div>
        </div>
      )}
      <div className="admin-nav" style={{ padding: '8px 20px', background: 'var(--bg2)', borderBottom: '1px solid var(--bdr)', display: 'flex', gap: 5, overflowX: 'auto' }}>
        {tabs.map(t => (
          <div key={t.id} className={`admin-tab ${activeTab === t.id ? 'active' : ''}`} onClick={() => setActiveTab(t.id)} style={{ display: 'flex', alignItems: 'center', gap: 7, padding: '7px 14px', borderRadius: 6, fontSize: 11, fontWeight: 600, cursor: 'pointer', background: activeTab === t.id ? 'rgba(79,125,255,0.1)' : 'transparent', color: activeTab === t.id ? 'var(--acc2)' : 'var(--txt3)' }}>
            <span>{t.icon}</span> {t.label}
          </div>
        ))}
      </div>

      <div className="page-body" style={{ flex: 1, overflowY: 'auto', padding: '20px' }}>

        {activeTab === 'users' && (
          <div>
            <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: 15 }}>
              <button
                className="btn pr"
                style={{ borderRadius: 6, padding: '7px 15px', fontSize: 11 }}
                onClick={() => {
                  setEditUser({ name: '', username: '', role: 'agent', empId: '', email: '', initials: '', active: true, password: '', confirmPassword: '' });
                  setIsEditModalOpen(true);
                }}
              >
                + Add User
              </button>
            </div>
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
                        {u.portfolios || '—'}
                      </td>
                      <td className="mn" style={{ color: 'var(--txt3)' }}>{u.doj || '—'}</td>
                      <td><span className={`badge ${u.active ? 'grn' : 'red'}`} style={{ padding: '4px 10px', borderRadius: 6, border: `1px solid ${u.active ? 'rgba(46,204,138,0.2)' : 'rgba(226,75,74,0.2)'}`, background: 'transparent' }}>{u.active ? 'Active' : 'Inactive'}</span></td>
                      <td style={{ borderRadius: '0 8px 8px 0' }}>
                        <div style={{ display: 'flex', gap: 5 }}>
                          <button className="btn sm" style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)' }} onClick={() => handleEditClick(u)}>Edit</button>
                          <button className="btn sm" style={{ background: 'rgba(245,166,35,0.1)', color: 'var(--amb)', border: '1px solid rgba(245,166,35,0.2)', padding: '6px 12px' }} title="Reset Password" onClick={() => { setResetUser(u); setIsPasswordModalOpen(true); }}>🔑</button>
                          <button className="btn sm" style={{ fontSize: 10, background: u.active ? 'rgba(226,75,74,0.1)' : 'rgba(46,204,138,0.1)', color: u.active ? 'var(--red)' : 'var(--grn)', border: `1px solid ${u.active ? 'rgba(226,75,74,0.2)' : 'rgba(46,204,138,0.2)'}`, minWidth: 80 }} onClick={() => handleDeactivateClick(u)}>
                            {u.active ? 'Deactivate' : 'Activate'}
                          </button>
                          <button className="btn sm" style={{ background: 'rgba(226,75,74,0.05)', color: 'var(--red)', border: '1px solid rgba(226,75,74,0.1)', padding: '4px 8px' }} onClick={() => handleDeleteUser(u)}>
                            Delete
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
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
                  <input className="finp" placeholder="Portfolio ID (e.g. P4)" style={{ width: 150 }} value={newPortfolio.id} onChange={e => setNewPortfolio({ ...newPortfolio, id: e.target.value })} />
                  <input className="finp" placeholder="Portfolio Name (e.g. Credit Cards)" style={{ flex: 1 }} value={newPortfolio.name} onChange={e => setNewPortfolio({ ...newPortfolio, name: e.target.value })} />
                  <button className="btn pr" onClick={handleAddPortfolio}>Save</button>
                  <button className="btn sm" onClick={() => setIsAddingPortfolio(false)}>Cancel</button>
                </div>
              )}

              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(500px, 1fr))', gap: 20 }}>
                {portfolios.map(p => (
                  <div key={p.id} className="card" style={{ background: 'var(--bg2)', border: '1px solid var(--bdr)', borderRadius: 14, padding: 0, overflow: 'hidden', display: 'flex', flexDirection: 'column' }}>
                    {/* Header */}
                    <div style={{ padding: '16px 20px', background: 'rgba(255,255,255,0.02)', borderBottom: '1px solid var(--bdr)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                        <div style={{ width: 32, height: 32, background: 'var(--accbg)', borderRadius: 8, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 10, fontWeight: 800, color: 'var(--acc2)' }}>{p.id}</div>
                        <div>
                          <div style={{ fontSize: 14, fontWeight: 700, color: 'var(--txt)' }}>{p.name}</div>
                          <div style={{ fontSize: 10, color: 'var(--txt3)', marginTop: 1 }}>{p.agents?.length || 0} Agents • {p.managers?.length || 0} Managers</div>
                        </div>
                      </div>
                      <button className="btn sm" style={{ background: 'rgba(226,75,74,0.05)', color: 'var(--red)', border: '1px solid rgba(226,75,74,0.1)', padding: '5px 10px' }}>Delete</button>
                    </div>

                    {/* Body */}
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', flex: 1 }}>
                      {/* Agents Section */}
                      <div style={{ padding: '20px', borderRight: '1px solid var(--bdr)' }}>
                        <div style={{ fontSize: 10, fontWeight: 800, color: 'var(--acc2)', letterSpacing: 0.8, marginBottom: 15, textTransform: 'uppercase', display: 'flex', alignItems: 'center', gap: 6 }}>
                          <span>👥</span> ASSIGNED AGENTS
                        </div>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: 8, maxHeight: 300, overflowY: 'auto', paddingRight: 5 }}>
                          {users.filter(u => u.role === 'agent').map(u => {
                            const isAssigned = p.agents?.some((a: any) => a.id === u.id);
                            return (
                              <label key={u.id} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '8px 10px', borderRadius: 8, background: isAssigned ? 'rgba(79,125,255,0.05)' : 'transparent', border: `1px solid ${isAssigned ? 'rgba(79,125,255,0.15)' : 'transparent'}`, cursor: 'pointer', transition: 'all 0.2s' }}>
                                <input
                                  type="checkbox"
                                  style={{ accentColor: 'var(--acc)' }}
                                  checked={isAssigned}
                                  onChange={(e) => handleAssignmentChange(p.id, u.id, 'agent', e.target.checked)}
                                />
                                <div style={{ width: 22, height: 22, borderRadius: '50%', background: 'rgba(255,255,255,0.05)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 8, fontWeight: 700, color: 'var(--txt2)' }}>{u.initials}</div>
                                <div style={{ flex: 1 }}>
                                  <div style={{ fontSize: 12, fontWeight: 600, color: isAssigned ? 'var(--txt)' : 'var(--txt3)' }}>{u.name}</div>
                                  <div style={{ fontSize: 9, color: 'var(--txt3)' }}>{u.empId}</div>
                                </div>
                              </label>
                            );
                          })}
                        </div>
                      </div>

                      {/* Managers Section */}
                      <div style={{ padding: '20px', background: 'rgba(255,255,255,0.01)' }}>
                        <div style={{ fontSize: 10, fontWeight: 800, color: 'var(--amb)', letterSpacing: 0.8, marginBottom: 15, textTransform: 'uppercase', display: 'flex', alignItems: 'center', gap: 6 }}>
                          <span>👔</span> ASSIGNED MANAGERS
                        </div>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: 8, maxHeight: 300, overflowY: 'auto', paddingRight: 5 }}>
                          {users.filter(u => (u.role === 'manager' || u.role === 'admin')).map(u => {
                            const isAssigned = p.managers?.some((m: any) => m.id === u.id);
                            return (
                              <label key={u.id} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '8px 10px', borderRadius: 8, background: isAssigned ? 'rgba(245,166,35,0.05)' : 'transparent', border: `1px solid ${isAssigned ? 'rgba(245,166,35,0.15)' : 'transparent'}`, cursor: 'pointer', transition: 'all 0.2s' }}>
                                <input
                                  type="checkbox"
                                  style={{ accentColor: 'var(--amb)' }}
                                  checked={isAssigned}
                                  onChange={(e) => handleAssignmentChange(p.id, u.id, 'manager', e.target.checked)}
                                />
                                <div style={{ width: 22, height: 22, borderRadius: '50%', background: 'rgba(255,255,255,0.05)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 8, fontWeight: 700, color: 'var(--txt2)' }}>{u.initials}</div>
                                <div style={{ flex: 1 }}>
                                  <div style={{ fontSize: 12, fontWeight: 600, color: isAssigned ? 'var(--txt)' : 'var(--txt3)' }}>{u.name}</div>
                                  <div style={{ fontSize: 9, color: 'var(--txt3)' }}>{u.empId}</div>
                                </div>
                              </label>
                            );
                          })}
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
            <div style={{ width: '100%', display: 'flex', flexDirection: 'column', gap: 25 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end' }}>
                <div>
                  <div className="skel" style={{ width: 300, height: 24, marginBottom: 10, borderRadius: 4 }}></div>
                  <div className="skel" style={{ width: 500, height: 16, borderRadius: 4 }}></div>
                </div>
                <div className="skel" style={{ width: 180, height: 40, borderRadius: 8 }}></div>
              </div>
              <div className="skel" style={{ height: 200, borderRadius: 12 }}></div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20 }}>
                <div className="skel" style={{ height: 300, borderRadius: 12 }}></div>
                <div className="skel" style={{ height: 300, borderRadius: 12 }}></div>
              </div>
            </div>
          ) : (
            <div style={{ width: '100%', animation: 'fadeIn 0.3s ease' }}>
              {/* Header */}
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 30, background: 'var(--bg2)', padding: '24px 30px', borderRadius: 12, border: '1px solid var(--bdr)' }}>
                <div>
                  <div style={{ fontSize: 20, fontWeight: 800, color: 'var(--txt)', display: 'flex', alignItems: 'center', gap: 12 }}>
                    <span style={{ fontSize: 24 }}>📤</span> Bulk Upload — Customer Data
                  </div>
                  <div style={{ fontSize: 13, color: 'var(--txt3)', marginTop: 6, opacity: 0.8 }}>Import leads from Excel (.xlsx) or CSV files directly into the database</div>
                </div>
                <button
                  onClick={handleDownloadTemplate}
                  className="btn"
                  style={{ background: 'var(--accbg)', color: 'var(--acc2)', border: '1px solid var(--acc)', padding: '12px 20px', borderRadius: 10, fontWeight: 700, fontSize: 12, display: 'flex', alignItems: 'center', gap: 8 }}
                >
                  📥 Download Sample Template (Excel)
                </button>
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: 25 }}>
                {/* Upload Area */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
                  <label style={{ border: `2px dashed ${uploadFile ? 'var(--grn)' : 'var(--bdr)'}`, borderRadius: 16, padding: '60px 40px', textAlign: 'center', cursor: 'pointer', background: uploadFile ? 'rgba(46,204,138,0.03)' : 'var(--bg2)', display: 'block', transition: 'all 0.3s ease', boxShadow: '0 4px 20px rgba(0,0,0,0.1)' }} onMouseEnter={(e) => (e.currentTarget.style.borderColor = 'var(--acc)')} onMouseLeave={(e) => (e.currentTarget.style.borderColor = uploadFile ? 'var(--grn)' : 'var(--bdr)')}>
                    <input type="file" accept=".csv,.xlsx,.xls" style={{ display: 'none' }} onChange={(e) => handleFileSelect(e.target.files?.[0] || null)} />
                    {uploadFile ? (
                      <div style={{ animation: 'scaleIn 0.3s ease' }}>
                        <div style={{ fontSize: 48, marginBottom: 15 }}>📄</div>
                        <div style={{ fontWeight: 800, color: 'var(--grn)', fontSize: 18 }}>{uploadFile.name}</div>
                        <div style={{ color: 'var(--txt3)', fontSize: 13, marginTop: 8, fontWeight: 500 }}>
                          {(uploadFile.size / 1024).toFixed(1)} KB · {previewRows.length > 0 ? `${previewRows.length}+ rows detected` : 'Parsing file...'}
                        </div>
                        <div style={{ display: 'flex', justifyContent: 'center', gap: 15, marginTop: 20 }}>
                          <button onClick={(e) => { e.preventDefault(); handleReset(); }} style={{ background: 'rgba(226,75,74,0.1)', border: '1px solid rgba(226,75,74,0.2)', color: 'var(--red)', padding: '8px 16px', borderRadius: 8, fontSize: 12, fontWeight: 600 }}>Remove File</button>
                        </div>
                      </div>
                    ) : (
                      <div style={{ animation: 'fadeIn 0.5s ease' }}>
                        <div style={{ fontSize: 56, marginBottom: 15, opacity: 0.8 }}>📁</div>
                        <div style={{ fontWeight: 800, color: 'var(--txt)', fontSize: 18, marginBottom: 8 }}>Click to select or drag & drop</div>
                        <div style={{ color: 'var(--txt3)', fontSize: 13, fontWeight: 500 }}>Supports CSV and Excel files (.csv, .xlsx, .xls)</div>
                      </div>
                    )}
                  </label>

                  {validationError && (
                    <div style={{ background: 'rgba(226,75,74,0.08)', border: '1px solid var(--red)', borderRadius: 12, padding: '20px 24px', color: 'var(--red)', animation: 'slideIn 0.3s ease' }}>
                      <div style={{ fontWeight: 800, marginBottom: 8, fontSize: 14, display: 'flex', alignItems: 'center', gap: 8 }}><span>❌</span> Validation Error</div>
                      <div style={{ fontSize: 13, lineHeight: 1.6, opacity: 0.9 }}>{validationError}</div>
                    </div>
                  )}

                  {previewRows.length > 0 && (
                    <div style={{ background: 'var(--bg2)', border: '1px solid var(--bdr)', borderRadius: 12, overflow: 'hidden', animation: 'fadeIn 0.3s ease' }}>
                      <div style={{ padding: '16px 20px', borderBottom: '1px solid var(--bdr)', fontSize: 13, fontWeight: 700, color: 'var(--txt)', background: 'rgba(255,255,255,0.02)', display: 'flex', justifyContent: 'space-between' }}>
                        <span>File Preview (First 5 Rows)</span>
                        <span style={{ fontSize: 11, color: 'var(--txt3)', fontWeight: 400 }}>{previewHeaders.length} columns detected</span>
                      </div>
                      <div style={{ overflowX: 'auto', maxWidth: '100%' }}>
                        <table className="tbl" style={{ width: 'max-content', minWidth: '100%', fontSize: 12 }}>
                          <thead style={{ background: 'rgba(255,255,255,0.01)' }}>
                            <tr>
                              {previewHeaders.map((h, i) => (
                                <th key={i} style={{ whiteSpace: 'nowrap', padding: '12px 18px', fontSize: 11, textAlign: 'left', color: 'var(--txt3)', borderRight: '1px solid rgba(255,255,255,0.05)' }}>{h}</th>
                              ))}
                            </tr>
                          </thead>
                          <tbody>
                            {previewRows.map((row, i) => (
                              <tr key={i} style={{ borderBottom: '1px solid rgba(255,255,255,0.03)' }}>
                                {previewHeaders.map((h, j) => (
                                  <td key={j} style={{ whiteSpace: 'nowrap', padding: '12px 18px', color: 'var(--txt2)', borderRight: '1px solid rgba(255,255,255,0.03)' }}>
                                    {row[h] ?? <span style={{ opacity: 0.3 }}>—</span>}
                                  </td>
                                ))}
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    </div>
                  )}

                  {uploading && (
                    <div style={{ background: 'var(--bg2)', border: '1px solid var(--acc)', borderRadius: 12, padding: '25px 30px' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 14, marginBottom: 12, fontWeight: 700 }}>
                        <span style={{ color: 'var(--txt)' }}>⏳ Processing Records...</span>
                        <span style={{ color: 'var(--acc2)' }}>{uploadProgress}%</span>
                      </div>
                      <div style={{ background: 'rgba(255,255,255,0.05)', borderRadius: 10, height: 10, overflow: 'hidden' }}>
                        <div style={{ height: '100%', width: `${uploadProgress}%`, background: 'linear-gradient(90deg, var(--acc), #7c5aff)', borderRadius: 10, transition: 'width 0.4s cubic-bezier(0.4, 0, 0.2, 1)' }} />
                      </div>
                    </div>
                  )}

                  {uploadResult && !uploading && (
                    <div style={{ background: uploadResult.success ? 'rgba(46,204,138,0.08)' : 'rgba(226,75,74,0.08)', border: `1px solid ${uploadResult.success ? 'var(--grn)' : 'var(--red)'}`, borderRadius: 12, padding: '30px', animation: 'scaleIn 0.3s ease' }}>
                      {uploadResult.success ? (
                        <div>
                          <div style={{ fontWeight: 800, fontSize: 18, color: 'var(--grn)', marginBottom: 20, display: 'flex', alignItems: 'center', gap: 10 }}><span>✅</span> Upload Successfully Completed</div>
                          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 20 }}>
                            {[['Total Records', uploadResult.total, '#fff'], ['Successfully Imported', uploadResult.imported, 'var(--grn)'], ['Existing Updated', uploadResult.updated, 'var(--acc2)'], ['Duplicate Skipped', uploadResult.skipped, 'var(--txt3)']].map(([label, val, color]) => (
                              <div key={label as string} style={{ textAlign: 'center', background: 'rgba(255,255,255,0.03)', borderRadius: 10, padding: '20px 15px', border: '1px solid rgba(255,255,255,0.05)' }}>
                                <div style={{ fontSize: 28, fontWeight: 900, color: color as string }}>{val as number}</div>
                                <div style={{ fontSize: 11, color: 'var(--txt3)', marginTop: 8, fontWeight: 600, textTransform: 'uppercase', letterSpacing: 0.5 }}>{label as string}</div>
                              </div>
                            ))}
                          </div>
                          {uploadResult.errors?.length > 0 && (
                            <div style={{ marginTop: 20, fontSize: 12, color: 'var(--amb)', padding: '12px 16px', background: 'rgba(245,166,35,0.05)', borderRadius: 8, border: '1px solid rgba(245,166,35,0.1)' }}>
                              <strong>Note:</strong> {uploadResult.errors.length} row(s) had errors. Example: {uploadResult.errors[0]}
                            </div>
                          )}
                          <button className="btn pr" style={{ marginTop: 25, padding: '12px 25px', borderRadius: 10, fontWeight: 700 }} onClick={handleReset}>Upload Another Dataset</button>
                        </div>
                      ) : (
                        <div>
                          <div style={{ fontWeight: 800, color: 'var(--red)', marginBottom: 12, fontSize: 18 }}>❌ Import Failed</div>
                          <div style={{ fontSize: 14, color: 'var(--txt2)', lineHeight: 1.6 }}>{uploadResult.error}</div>
                          <button className="btn" style={{ marginTop: 20, padding: '10px 20px', background: 'var(--red)', color: '#fff', borderRadius: 8, border: 'none', fontWeight: 700 }} onClick={handleReset}>Try Again</button>
                        </div>
                      )}
                    </div>
                  )}
                </div>

                {/* Configuration Grid */}
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 25 }}>
                  {/* Left Column: Settings */}
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
                    <div style={{ background: 'var(--bg2)', border: '1px solid var(--bdr)', borderRadius: 12, padding: '24px' }}>
                      <div style={{ fontSize: 13, fontWeight: 800, color: 'var(--txt)', marginBottom: 20, letterSpacing: 0.5 }}>IMPORT CONFIGURATION</div>

                      <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
                        <div className="ff">
                          <label style={{ fontSize: 11, fontWeight: 700, color: 'var(--txt3)', marginBottom: 8, display: 'block' }}>ASSIGN TO PORTFOLIO</label>
                          <select className="finp" style={{ height: 45, borderRadius: 10 }} value={uploadPortfolio} onChange={e => setUploadPortfolio(e.target.value)}>
                            <option value="">— Auto Detect from File —</option>
                            {portfolios.map((p: any) => (
                              <option key={p.id} value={p.id}>{p.name}</option>
                            ))}
                          </select>
                        </div>

                        <div className="ff">
                          <label style={{ fontSize: 11, fontWeight: 700, color: 'var(--txt3)', marginBottom: 8, display: 'block' }}>DUPLICATE HANDLING</label>
                          <select className="finp" style={{ height: 45, borderRadius: 10 }} value={duplicateHandling} onChange={e => setDuplicateHandling(e.target.value)}>
                            <option value="Skip Duplicates">Skip Duplicates (Fastest)</option>
                            <option value="Update Existing">Overwrite Existing Data</option>
                          </select>
                        </div>
                        
                        <button 
                          className="btn" 
                          onClick={handleCheckColumns}
                          disabled={!uploadFile}
                          style={{ background: 'var(--bg3)', border: '1px solid var(--bdr)', color: 'var(--acc2)', fontWeight: 700, padding: '12px', borderRadius: 10, opacity: !uploadFile ? 0.5 : 1, transition: 'all 0.2s' }}
                          onMouseEnter={e => e.currentTarget.style.background = 'rgba(79,125,255,0.05)'}
                          onMouseLeave={e => e.currentTarget.style.background = 'var(--bg3)'}
                        >
                          🔍 Check Column Match Status
                        </button>
                      </div>
                    </div>

                    <button
                      className="btn pr"
                      style={{ height: 60, fontSize: 16, background: 'var(--acc)', borderRadius: 12, fontWeight: 800, opacity: (!uploadFile || uploading || !!validationError) ? 0.4 : 1, boxShadow: '0 4px 15px rgba(79,125,255,0.2)', transition: 'all 0.3s ease' }}
                      onClick={handleStartUpload}
                      disabled={!uploadFile || uploading || !!validationError}
                    >
                      {uploading ? '⌛ Processing Data...' : '🚀 Start Bulk Import'}
                    </button>
                  </div>

                  {/* Right Column: Guide or Check Results */}
                  <div style={{ background: 'var(--bg2)', border: '1px solid var(--bdr)', borderRadius: 12, padding: '24px', display: 'flex', flexDirection: 'column' }}>
                    {columnMatchResult ? (
                      <div style={{ animation: 'fadeIn 0.3s ease' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
                          <div style={{ fontSize: 13, fontWeight: 800, color: 'var(--txt)', letterSpacing: 0.5 }}>MATCH STATUS REPORT</div>
                          <button className="btn sm" onClick={() => setColumnMatchResult(null)} style={{ padding: '4px 8px', fontSize: 10, background: 'var(--bg3)', border: '1px solid var(--bdr)' }}>Back to Guide</button>
                        </div>
                        
                        <div style={{ display: 'flex', flexDirection: 'column', gap: 8, maxHeight: 400, overflowY: 'auto', paddingRight: 10 }}>
                          {columnMatchResult.report.map((item: any) => (
                            <div key={item.label} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: item.matched ? 'rgba(34,197,94,0.04)' : 'rgba(245,158,11,0.04)', padding: '10px 14px', borderRadius: 10, border: `1px solid ${item.matched ? 'rgba(34,197,94,0.15)' : 'rgba(245,158,11,0.15)'}` }}>
                              <div style={{ display: 'flex', flexDirection: 'column' }}>
                                <span style={{ fontSize: 12, fontWeight: 700, color: item.matched ? '#2ecca7' : '#f5a623' }}>{item.label}</span>
                                {item.matched && <span style={{ fontSize: 10, color: 'var(--txt3)', marginTop: 2 }}>Matched to: <span style={{ fontFamily: 'monospace', color: 'var(--acc2)' }}>{item.fileHeader}</span></span>}
                              </div>
                              <span style={{ fontSize: 10, fontWeight: 700, color: item.matched ? '#2ecca7' : '#f5a623' }}>{item.matched ? '✓ MATCHED' : '⚠️ MISSING'}</span>
                            </div>
                          ))}
                          
                          {columnMatchResult.extra.length > 0 && (
                            <div style={{ marginTop: 20 }}>
                              <div style={{ fontSize: 10, fontWeight: 800, color: 'var(--txt3)', marginBottom: 10, letterSpacing: 1 }}>EXTRA COLUMNS (WILL BE IGNORED)</div>
                              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
                                {columnMatchResult.extra.map((ex: string) => (
                                  <span key={ex} style={{ fontSize: 10, background: 'rgba(255,255,255,0.03)', padding: '5px 10px', borderRadius: 6, color: 'var(--txt3)', border: '1px solid var(--bdr)' }}>{ex}</span>
                                ))}
                              </div>
                            </div>
                          )}
                        </div>
                      </div>
                    ) : (
                      <>
                        <div style={{ fontSize: 13, fontWeight: 800, color: 'var(--txt)', marginBottom: 20, letterSpacing: 0.5 }}>ACCEPTED COLUMN HEADERS</div>
                        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 10, maxHeight: 400, overflowY: 'auto', paddingRight: 10 }}>
                          {[
                            ['Account Number', 'Required — Unique identifier'],
                            ['Customer Name', 'Primary name on account'],
                            ['Mobile Number', 'Primary contact number'],
                            ['Total Outstanding', 'Total amount due'],
                            ['DPD', 'Days Past Due'],
                            ['Portfolio', 'Portfolio ID or Name'],
                          ].map(([col, desc]) => (
                            <div key={col} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: 'rgba(255,255,255,0.02)', padding: '12px 15px', borderRadius: 10, border: '1px solid rgba(255,255,255,0.03)' }}>
                              <span style={{ fontFamily: 'monospace', color: 'var(--acc2)', fontWeight: 700, fontSize: 12 }}>{col}</span>
                              <span style={{ color: 'var(--txt3)', fontSize: 11 }}>{desc}</span>
                            </div>
                          ))}
                        </div>
                        <div style={{ marginTop: 20, fontSize: 11, color: 'var(--txt3)', background: 'rgba(255,255,255,0.03)', padding: '12px', borderRadius: 8, textAlign: 'center' }}>
                          Make sure column names match exactly. Case-insensitive.
                        </div>
                      </>
                    )}
                  </div>
                </div>
              </div>
            </div>
          )
        )}
        {activeTab === 'lists' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
            <div className="info-box" style={{ background: 'rgba(79,125,255,0.05)', border: '1px solid var(--acc2)40', color: 'var(--acc2)', padding: '12px 16px', fontSize: 12, borderRadius: 8 }}>
              Admin can add or delete payment modes, PTP statuses, dispute statuses, and flag options. Changes apply system-wide immediately.
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20 }}>
              {[
                { title: 'Payment Modes', type: 'PAYMENT_MODE', placeholder: 'New payment modes item...' },
                { title: 'PTP Statuses', type: 'PTP_STATUS', placeholder: 'New ptp statuses item...' },
                { title: 'Dispute Statuses', type: 'DISPUTE_STATUS', placeholder: 'New dispute statuses item...' },
                { title: 'Flag Options', type: 'FLAG_OPTION', placeholder: 'New flag options item...' },
              ].map(section => (
                <div key={section.type} className="card" style={{ background: 'var(--bg2)', border: '1px solid var(--bdr)', padding: '16px 20px' }}>
                  <div style={{ fontSize: 13, fontWeight: 700, marginBottom: 15, color: 'var(--txt)' }}>{section.title}</div>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                    {/* Default Items */}
                    {DEFAULT_LISTS[section.type].map(val => (
                      <div key={`def-${val}`} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: 'rgba(255,255,255,0.01)', padding: '10px 14px', borderRadius: 8, border: '1px solid var(--bdr)', opacity: 0.7 }}>
                        <span style={{ fontSize: 13, color: 'var(--txt3)' }}>{val} <span style={{ fontSize: 9, opacity: 0.6, marginLeft: 5 }}>(Default)</span></span>
                        <div style={{ width: 30 }} /> {/* Spacer */}
                      </div>
                    ))}

                    {/* Database Items */}
                    {masterLists.filter(l => l.type === section.type).map(item => (
                      <div key={item.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: 'rgba(255,255,255,0.02)', padding: '10px 14px', borderRadius: 8, border: '1px solid var(--acc2)40' }}>
                        <span style={{ fontSize: 13, color: section.type === 'FLAG_OPTION' ? (item.value === 'approved' ? 'var(--grn)' : item.value === 'rejected' ? 'var(--red)' : 'var(--txt2)') : 'var(--txt2)' }}>
                          {item.value}
                        </span>
                        <button onClick={() => handleDeleteListItem(item.id)} style={{ background: 'rgba(226,75,74,0.1)', color: 'var(--red)', border: '1px solid rgba(226,75,74,0.2)', padding: '4px 8px', borderRadius: 6, fontSize: 12 }}>✕</button>
                      </div>
                    ))}
                    <div style={{ display: 'flex', gap: 8, marginTop: 5 }}>
                      <input
                        className="finp"
                        placeholder={section.placeholder}
                        value={(newListItem as any)[section.type] || ''}
                        onChange={e => setNewListItem(prev => ({ ...prev, [section.type]: e.target.value }))}
                        onKeyDown={e => e.key === 'Enter' && handleAddListItem(section.type)}
                      />
                      <button className="btn pr" onClick={() => handleAddListItem(section.type)}>+ Add</button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
        {activeTab === 'role' && (
          <div style={{ width: '100%' }}>
            <div style={{ background: 'rgba(79,125,255,0.05)', border: '1px solid rgba(79,125,255,0.2)', padding: '12px 20px', borderRadius: 10, color: 'var(--acc2)', fontSize: 12, marginBottom: 20 }}>
              🛡 <b>Role-based access matrix.</b> This view is read-only and shows which features are available to each role.
            </div>

            <div className="card" style={{ padding: 0, overflow: 'hidden', background: 'var(--bg2)', border: '1px solid var(--bdr)', borderRadius: 12 }}>
              <div style={{ overflowX: 'auto' }}>
                <table className="tbl" style={{ borderCollapse: 'collapse', width: '100%' }}>
                  <thead>
                    <tr style={{ background: 'rgba(255,255,255,0.02)', borderBottom: '1px solid var(--bdr)' }}>
                      <th style={{ padding: '16px 20px', color: 'var(--txt3)', fontSize: 10, textTransform: 'uppercase', letterSpacing: 1, textAlign: 'left', width: '40%' }}>Feature</th>
                      <th style={{ padding: '16px 20px', color: 'var(--txt3)', fontSize: 10, textTransform: 'uppercase', letterSpacing: 1, textAlign: 'center' }}>Admin</th>
                      <th style={{ padding: '16px 20px', color: 'var(--txt3)', fontSize: 10, textTransform: 'uppercase', letterSpacing: 1, textAlign: 'center' }}>Manager</th>
                      <th style={{ padding: '16px 20px', color: 'var(--txt3)', fontSize: 10, textTransform: 'uppercase', letterSpacing: 1, textAlign: 'center' }}>Agent</th>
                    </tr>
                  </thead>
                  <tbody>
                    {[
                      { f: 'View Dashboard', a: true, m: true, g: true },
                      { f: 'View All Leads', a: true, m: true, g: true },
                      { f: 'Edit Customer', a: true, m: true, g: true },
                      { f: 'Log Calls', a: true, m: true, g: true },
                      { f: 'Create PTP', a: true, m: true, g: true },
                      { f: 'Record Payment (Pending Approval)', a: true, m: true, g: true },
                      { f: 'Approve/Reject Payments', a: true, m: true, g: false },
                      { f: 'Bulk Upload', a: true, m: true, g: false },
                      { f: 'Column Config', a: true, m: false, g: false },
                      { f: 'Admin Panel', a: true, m: false, g: false },
                      { f: 'Manager Panel', a: true, m: true, g: false },
                      { f: 'Portfolio Assignment', a: true, m: false, g: false },
                      { f: 'Lists Config (Modes/Statuses)', a: true, m: false, g: false },
                      { f: 'Audit Logs', a: true, m: false, g: false },
                    ].map((row, i) => (
                      <tr key={row.f} style={{ borderBottom: '1px solid rgba(255,255,255,0.03)', background: i % 2 === 0 ? 'transparent' : 'rgba(255,255,255,0.01)' }}>
                        <td style={{ padding: '14px 20px', fontSize: 13, color: 'var(--txt2)' }}>{row.f}</td>
                        <td style={{ padding: '14px 20px', textAlign: 'center' }}>
                          {row.a ? <span style={{ color: 'var(--grn)', fontSize: 16 }}>✓</span> : <span style={{ color: 'var(--red)', fontSize: 14, opacity: 0.5 }}>✕</span>}
                        </td>
                        <td style={{ padding: '14px 20px', textAlign: 'center' }}>
                          {row.m ? <span style={{ color: 'var(--grn)', fontSize: 16 }}>✓</span> : <span style={{ color: 'var(--red)', fontSize: 14, opacity: 0.5 }}>✕</span>}
                        </td>
                        <td style={{ padding: '14px 20px', textAlign: 'center' }}>
                          {row.g ? <span style={{ color: 'var(--grn)', fontSize: 16 }}>✓</span> : <span style={{ color: 'var(--red)', fontSize: 14, opacity: 0.5 }}>✕</span>}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}
        {activeTab === 'report' && (
          <div style={{ width: '100%' }}>
            <div style={{ background: 'rgba(245,166,35,0.08)', border: '1px solid rgba(245,166,35,0.2)', padding: '12px 20px', borderRadius: 10, color: 'var(--amb)', fontSize: 12, marginBottom: 20 }}>
              📊 <b>Admin controls which reports each role can access.</b> Changes will be applied to all users in that role.
            </div>

            <div className="card" style={{ padding: 0, overflow: 'hidden', background: 'var(--bg2)', border: '1px solid var(--bdr)', borderRadius: 12 }}>
              <div style={{ overflowX: 'auto' }}>
                <table className="tbl" style={{ borderCollapse: 'collapse', width: '100%' }}>
                  <thead>
                    <tr style={{ background: 'rgba(255,255,255,0.02)', borderBottom: '1px solid var(--bdr)' }}>
                      <th style={{ padding: '16px 20px', color: 'var(--txt3)', fontSize: 10, textTransform: 'uppercase', letterSpacing: 1, textAlign: 'left', width: '30%' }}>Report</th>
                      <th style={{ padding: '16px 20px', color: 'var(--txt3)', fontSize: 10, textTransform: 'uppercase', letterSpacing: 1, textAlign: 'left', width: '30%' }}>Description</th>
                      <th style={{ padding: '16px 20px', color: 'var(--txt3)', fontSize: 10, textTransform: 'uppercase', letterSpacing: 1, textAlign: 'center' }}>Admin</th>
                      <th style={{ padding: '16px 20px', color: 'var(--txt3)', fontSize: 10, textTransform: 'uppercase', letterSpacing: 1, textAlign: 'center' }}>Manager</th>
                      <th style={{ padding: '16px 20px', color: 'var(--txt3)', fontSize: 10, textTransform: 'uppercase', letterSpacing: 1, textAlign: 'center' }}>Agent</th>
                    </tr>
                  </thead>
                  <tbody>
                    {[
                      { r: 'Call Summary', d: 'Call activity', a: true, m: true, g: true },
                      { r: 'PTP Summary', d: 'PTP tracking', a: true, m: true, g: true },
                      { r: 'Payment Summary', d: 'Collections', a: true, m: true, g: false },
                      { r: 'Team Performance', d: 'Agent metrics', a: true, m: true, g: false },
                      { r: 'Portfolio Aging', d: 'DPD analysis', a: true, m: false, g: false },
                      { r: 'Dispute Summary', d: 'Dispute tracking', a: true, m: false, g: false },
                      { r: 'Audit Logs', d: 'Full trail', a: true, m: false, g: false },
                      { r: 'System Reports', d: 'Upload history', a: true, m: false, g: false },
                    ].map((row, i) => (
                      <tr key={row.r} style={{ borderBottom: '1px solid rgba(255,255,255,0.03)', background: i % 2 === 0 ? 'transparent' : 'rgba(255,255,255,0.01)' }}>
                        <td style={{ padding: '14px 20px', fontSize: 13, fontWeight: 700, color: 'var(--txt)' }}>{row.r}</td>
                        <td style={{ padding: '14px 20px', fontSize: 11, color: 'var(--txt3)' }}>{row.d}</td>
                        <td style={{ padding: '14px 20px', textAlign: 'center' }}>
                          <input type="checkbox" checked={row.a} disabled style={{ accentColor: 'var(--acc)' }} />
                        </td>
                        <td style={{ padding: '14px 20px', textAlign: 'center' }}>
                          <input type="checkbox" defaultChecked={row.m} style={{ accentColor: 'var(--acc)' }} />
                        </td>
                        <td style={{ padding: '14px 20px', textAlign: 'center' }}>
                          <input type="checkbox" defaultChecked={row.g} style={{ accentColor: 'var(--acc)' }} />
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
            <div style={{ marginTop: 20 }}>
              <button className="btn pr" style={{ padding: '10px 24px', fontSize: 13, borderRadius: 8 }} onClick={() => toast('Report access settings saved ✓')}>✓ Save Settings</button>
            </div>
          </div>
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

        {activeTab === 'system' && (
          <div style={{ width: '100%' }}>
            {/* Top Stats */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 15, marginBottom: 25 }}>
              <div className="card" style={{ background: 'var(--bg2)', border: '1px solid var(--bdr)', padding: '16px 20px' }}>
                <div style={{ fontSize: 10, fontWeight: 700, color: 'var(--txt3)', letterSpacing: 0.5, marginBottom: 5, textTransform: 'uppercase' }}>STATUS</div>
                <div style={{ fontSize: 22, fontWeight: 800, color: 'var(--grn)' }}>Online</div>
              </div>
              <div className="card" style={{ background: 'var(--bg2)', border: '1px solid var(--bdr)', padding: '16px 20px' }}>
                <div style={{ fontSize: 10, fontWeight: 700, color: 'var(--txt3)', letterSpacing: 0.5, marginBottom: 5, textTransform: 'uppercase' }}>DATABASE</div>
                <div style={{ fontSize: 20, fontWeight: 700, color: 'var(--txt)' }}>PostgreSQL 15.0</div>
              </div>
              <div className="card" style={{ background: 'var(--bg2)', border: '1px solid var(--bdr)', padding: '16px 20px' }}>
                <div style={{ fontSize: 10, fontWeight: 700, color: 'var(--txt3)', letterSpacing: 0.5, marginBottom: 5, textTransform: 'uppercase' }}>LAST BACKUP</div>
                <div style={{ fontSize: 20, fontWeight: 700, color: 'var(--txt)' }}>2h ago</div>
              </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 0.8fr', gap: 20 }}>


              <div className="card" style={{ background: 'var(--bg2)', border: '1px solid var(--bdr)', padding: '24px' }}>
                <div style={{ fontSize: 14, fontWeight: 700, color: 'var(--acc2)', marginBottom: 20 }}>Maintenance & Cleanup</div>
                <div style={{ background: 'rgba(79,125,255,0.04)', border: '1px solid rgba(79,125,255,0.15)', borderRadius: 10, padding: '20px', display: 'flex', flexDirection: 'column', gap: 15 }}>
                  <div>
                    <div style={{ fontSize: 13, fontWeight: 700, color: 'var(--acc2)', display: 'flex', alignItems: 'center', gap: 8 }}>🧹 Clear Audit Logs</div>
                    <div style={{ fontSize: 11, color: 'var(--txt3)', marginTop: 5, lineHeight: 1.5 }}>This will remove all system audit logs. Leads and payments will be preserved.</div>
                  </div>
                  <button className="btn" style={{ background: 'rgba(79,125,255,0.1)', color: 'var(--acc2)', border: '1px solid rgba(79,125,255,0.2)', padding: '10px', fontSize: 12, fontWeight: 600 }} onClick={() => {
                    setFlushAction('audit');
                    setIsFlushModalOpen(true);
                  }}>Clear Audit Logs</button>
                </div>

                <div style={{ background: 'rgba(245,166,35,0.04)', border: '1px solid rgba(245,166,35,0.15)', borderRadius: 10, padding: '20px', display: 'flex', flexDirection: 'column', gap: 15, marginTop: 20 }}>
                  <div>
                    <div style={{ fontSize: 13, fontWeight: 700, color: 'var(--amb)', display: 'flex', alignItems: 'center', gap: 8 }}>📅 Selective Lead Cleanup</div>
                    <div style={{ fontSize: 11, color: 'var(--txt3)', marginTop: 5, lineHeight: 1.5 }}>Delete leads by Month/Year. <b>Leads with payment records will NOT be deleted.</b></div>
                  </div>
                  
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
                    <div className="ff">
                      <select className="finp" style={{ height: 38, fontSize: 12 }} value={cleanupMonth} onChange={e => setCleanupMonth(Number(e.target.value))}>
                        {['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'].map((m, i) => (
                          <option key={m} value={i + 1}>{m}</option>
                        ))}
                      </select>
                    </div>
                    <div className="ff">
                      <select className="finp" style={{ height: 38, fontSize: 12 }} value={cleanupYear} onChange={e => setCleanupYear(Number(e.target.value))}>
                        {[2024, 2025, 2026, 2027].map(y => (
                          <option key={y} value={y}>{y}</option>
                        ))}
                      </select>
                    </div>
                  </div>

                  <button className="btn" style={{ background: 'rgba(245,166,35,0.1)', color: 'var(--amb)', border: '1px solid rgba(245,166,35,0.2)', padding: '10px', fontSize: 12, fontWeight: 600 }} onClick={() => {
                    setFlushAction('selective');
                    setIsFlushModalOpen(true);
                  }}>Delete Selected Leads</button>
                </div>
              </div>


              {/* Danger Zone */}
              <div className="card" style={{ background: 'var(--bg2)', border: '1px solid var(--bdr)', padding: '24px' }}>
                <div style={{ fontSize: 14, fontWeight: 700, color: 'var(--red)', marginBottom: 20 }}>Danger Zone</div>
                <div style={{ background: 'rgba(226,75,74,0.04)', border: '1px solid rgba(226,75,74,0.15)', borderRadius: 10, padding: '20px', display: 'flex', flexDirection: 'column', gap: 15 }}>
                  <div>
                    <div style={{ fontSize: 13, fontWeight: 700, color: 'var(--red)', display: 'flex', alignItems: 'center', gap: 8 }}>⚠ Flush All Data</div>
                    <div style={{ fontSize: 11, color: 'var(--txt3)', marginTop: 5, lineHeight: 1.5 }}>This will permanently delete all records including leads, payments, and logs. This action cannot be undone.</div>
                  </div>
                  <button className="btn" style={{ background: 'rgba(226,75,74,0.1)', color: 'var(--red)', border: '1px solid rgba(226,75,74,0.2)', padding: '10px', fontSize: 12, fontWeight: 600 }} onClick={() => {
                    setFlushAction('all');
                    setIsFlushModalOpen(true);
                  }}>Delete All Data</button>
                </div>
              </div>
            </div>
          </div>

        )}


        {isEditModalOpen && editUser && (
          <div className="modal-overlay" style={{ position: 'fixed', top: 0, left: 0, width: '100%', height: '100%', background: 'rgba(0,0,0,0.85)', zIndex: 100, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <div className="modal-content" style={{ background: 'var(--bg2)', border: '1px solid var(--bdr)', borderRadius: 12, width: '100%', maxWidth: '750px', maxHeight: '90vh', overflow: 'hidden', display: 'flex', flexDirection: 'column' }}>
              <div style={{ padding: '16px 20px', borderBottom: '1px solid var(--bdr)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div style={{ fontSize: 15, fontWeight: 700 }}>{editUser.id ? 'Edit User' : 'Add New User'} {editUser.name && `— ${editUser.name}`}</div>
                <button style={{ background: 'transparent', border: 'none', color: 'var(--txt3)', fontSize: 20, cursor: 'pointer' }} onClick={() => setIsEditModalOpen(false)}>✕</button>
              </div>

              <div style={{ flex: 1, overflowY: 'auto', padding: '20px' }}>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '15px' }}>
                  <div className="ff"><label>Full Name</label><input className="finp" value={editUser.name} onChange={e => setEditUser({ ...editUser, name: e.target.value })} /></div>
                  <div className="ff"><label>Username</label><input className="finp" value={editUser.username} onChange={e => setEditUser({ ...editUser, username: e.target.value })} /></div>
                  <div className="ff"><label>Employee ID</label><input className="finp" value={editUser.empId} onChange={e => setEditUser({ ...editUser, empId: e.target.value })} /></div>
                  <div className="ff"><label>Role</label>
                    <select className="finp" value={editUser.role} onChange={e => setEditUser({ ...editUser, role: e.target.value, ...(e.target.value !== 'agent' && { managerId: null }) })}>
                      <option>admin</option><option>manager</option><option>agent</option>
                    </select>
                  </div>
                  {editUser.role === 'agent' && (
                    <div className="ff"><label>Reports To</label>
                      <select className="finp" value={editUser.managerId || ''} onChange={e => setEditUser({ ...editUser, managerId: e.target.value })}>
                        <option value="">— None —</option>
                        {users.filter(x => (x.role === 'manager' || x.role === 'admin') && x.id !== editUser.id).map(u => (
                          <option key={u.id} value={u.id}>{u.name} ({u.empId})</option>
                        ))}
                      </select>
                    </div>
                  )}
                  <div className="ff"><label>Email</label><input className="finp" value={editUser.email || ''} onChange={e => setEditUser({ ...editUser, email: e.target.value })} /></div>
                  <div className="ff"><label>Contact</label><input className="finp" value={editUser.contact || ''} onChange={e => setEditUser({ ...editUser, contact: e.target.value })} /></div>
                  <div className="ff"><label>DOB</label><input className="finp" value={editUser.dob || ''} onChange={e => setEditUser({ ...editUser, dob: e.target.value })} /></div>
                  <div className="ff"><label>DOJ</label><input className="finp" value={editUser.doj || ''} onChange={e => setEditUser({ ...editUser, doj: e.target.value })} /></div>
                  {!editUser.id && (
                    <>
                      <div className="ff"><label>Password *</label><input className="finp" type="password" value={editUser.password || ''} onChange={e => setEditUser({ ...editUser, password: e.target.value })} /></div>
                      <div className="ff"><label>Confirm Password *</label><input className="finp" type="password" value={editUser.confirmPassword || ''} onChange={e => setEditUser({ ...editUser, confirmPassword: e.target.value })} /></div>
                    </>
                  )}
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
                <div style={{ fontSize: 15, fontWeight: 700 }}>{deactivatingUser.active ? 'Deactivate' : 'Activate'} User — {deactivatingUser.name}</div>
                <button style={{ background: 'transparent', border: 'none', color: 'var(--txt3)', fontSize: 20, cursor: 'pointer' }} onClick={() => setIsDeactivateModalOpen(false)}>✕</button>
              </div>

              <div style={{ background: deactivatingUser.active ? 'rgba(245,166,35,0.08)' : 'rgba(46,204,138,0.08)', border: `1px solid ${deactivatingUser.active ? 'rgba(245,166,35,0.2)' : 'rgba(46,204,138,0.2)'}`, padding: '12px 16px', borderRadius: 8, marginBottom: 20, color: deactivatingUser.active ? 'var(--amb)' : 'var(--grn)', fontSize: 12 }}>
                {deactivatingUser.active ? 'Deactivating' : 'Activating'}: <b>{deactivatingUser.name} ({deactivatingUser.empId})</b>
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
                <button className="btn" style={{ flex: 4, padding: 12, fontSize: 13, background: deactivatingUser.active ? 'rgba(255,77,77,0.1)' : 'rgba(46,204,138,0.1)', color: deactivatingUser.active ? '#ff4d4d' : 'var(--grn)', border: `1px solid ${deactivatingUser.active ? 'rgba(255,77,77,0.2)' : 'rgba(46,204,138,0.2)'}` }} onClick={() => toggleUserStatus(deactivatingUser)}>
                  {deactivatingUser.active ? 'Deactivate' : 'Activate'}
                </button>
                <button className="btn" style={{ flex: 1, padding: 12, fontSize: 13, background: 'transparent', color: 'var(--txt3)', border: '1px solid var(--bdr)' }} onClick={() => setIsDeactivateModalOpen(false)}>Cancel</button>
              </div>
            </div>
          </div>
        )}

        {isPasswordModalOpen && resetUser && (
          <div className="modal-overlay" style={{ position: 'fixed', top: 0, left: 0, width: '100%', height: '100%', background: 'rgba(0,0,0,0.85)', zIndex: 100, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <div className="modal-content" style={{ background: 'var(--bg2)', border: '1px solid var(--bdr)', borderRadius: 12, width: '100%', maxWidth: '400px', padding: '24px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 20 }}>
                <div style={{ fontSize: 15, fontWeight: 700 }}>🔐 Reset Password — {resetUser.name}</div>
                <button style={{ background: 'transparent', border: 'none', color: 'var(--txt3)', fontSize: 20, cursor: 'pointer' }} onClick={() => setIsPasswordModalOpen(false)}>✕</button>
              </div>

              <div style={{ background: 'rgba(245,166,35,0.05)', border: '1px solid rgba(245,166,35,0.15)', padding: '12px 16px', borderRadius: 8, marginBottom: 20, color: 'var(--amb)', fontSize: 11 }}>
                Resetting password for <b>{resetUser.username}</b>. Ensure you share the new password securely.
              </div>

              <div className="ff" style={{ marginBottom: 25 }}>
                <label>NEW PASSWORD *</label>
                <input
                  type="text"
                  className="finp"
                  autoFocus
                  placeholder="Type new password..."
                  value={newPassword}
                  onChange={e => setNewPassword(e.target.value)}
                  onKeyDown={e => e.key === 'Enter' && handlePasswordReset()}
                />
              </div>

              <div style={{ display: 'flex', gap: 10 }}>
                <button className="btn pr" style={{ flex: 3, padding: 12, fontSize: 13, background: 'var(--acc)' }} onClick={handlePasswordReset} disabled={resetting}>
                  {resetting ? 'Updating...' : '✓ Update Password'}
                </button>
                <button className="btn" style={{ flex: 1, padding: 12, fontSize: 13, background: 'transparent', color: 'var(--txt3)', border: '1px solid var(--bdr)' }} onClick={() => { setIsPasswordModalOpen(false); setNewPassword(''); }}>Cancel</button>
              </div>
            </div>
          </div>
        )}

        {isFlushModalOpen && (
          <div className="modal-overlay" style={{ position: 'fixed', top: 0, left: 0, width: '100%', height: '100%', background: 'rgba(0,0,0,0.85)', zIndex: 200, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <div className="modal-content" style={{ background: '#1a1d26', border: '1px solid var(--red)', borderRadius: 12, width: '100%', maxWidth: '400px', padding: '24px' }}>
              <div style={{ textAlign: 'center', marginBottom: 20 }}>
                <div style={{ fontSize: 32, marginBottom: 10 }}>🚨</div>
                <div style={{ fontSize: 18, fontWeight: 800, color: 'var(--red)' }}>Critical Action!</div>
                <div style={{ fontSize: 12, color: 'var(--txt3)', marginTop: 8 }}>
                  Enter your admin password to confirm {flushAction === 'all' ? 'full database flush' : 'audit logs cleanup'}.
                  <br /><b>This cannot be undone.</b>
                </div>
              </div>

              <div className="ff" style={{ marginBottom: 20 }}>
                <label style={{ color: 'var(--red)' }}>ADMIN PASSWORD</label>
                <input
                  type="password"
                  className="finp"
                  autoFocus
                  style={{ border: '1px solid rgba(226,75,74,0.3)', background: 'rgba(226,75,74,0.05)' }}
                  placeholder="Enter password..."
                  value={flushPassword}
                  onChange={e => setFlushPassword(e.target.value)}
                  onKeyDown={e => e.key === 'Enter' && handleFlushDB()}
                />
              </div>

              <div style={{ display: 'flex', gap: 10 }}>
                <button
                  className="btn"
                  style={{ flex: 1, padding: 12, background: 'var(--red)', color: '#fff', fontWeight: 700 }}
                  onClick={handleFlushDB}
                  disabled={flushing}
                >
                  {flushing ? 'Flushing...' : 'Confirm Flush'}
                </button>
                <button
                  className="btn"
                  style={{ padding: 12, background: 'transparent', border: '1px solid var(--bdr)', color: 'var(--txt3)' }}
                  onClick={() => { setIsFlushModalOpen(false); setFlushPassword(''); }}
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        )}

      </div>






    </div>
  );
};

export default Admin;
