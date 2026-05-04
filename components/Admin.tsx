"use client";
import React, { useState, useEffect } from 'react';
import * as XLSX from 'xlsx';
import { 
  Users, 
  Briefcase, 
  LayoutGrid, 
  UploadCloud, 
  ListOrdered, 
  Lock, 
  BarChart3, 
  History, 
  Settings 
} from 'lucide-react';
import { useApp } from '@/context/AppContext';
import SystemTab from './admin/SystemTab';
import UsersTab from './admin/UsersTab';
import BulkUploadTab from './admin/BulkUploadTab';
import PortfoliosTab from './admin/PortfoliosTab';
import ColumnsTab from './admin/ColumnsTab';
import MasterListsTab from './admin/MasterListsTab';
import AuditLogsTab from './admin/AuditLogsTab';
import RolesTab from './admin/RolesTab';
import ReportsTab from './admin/ReportsTab';
import EditUserModal from './admin/EditUserModal';
import DeactivateUserModal from './admin/DeactivateUserModal';
import ResetPasswordModal from './admin/ResetPasswordModal';
import FlushDBModal from './admin/FlushDBModal';
import SkippedRecordsModal from './admin/SkippedRecordsModal';
import UploadHistoryModal from './admin/UploadHistoryModal';
import AdminProgressBars from './admin/AdminProgressBars';

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
  const [totalCustomers, setTotalCustomers] = useState<number | null>(null);
  


  // Skipped records modal
  const [showSkipped, setShowSkipped] = useState(false);
  const [skippedData, setSkippedData] = useState<{ records: any[]; pagination: any } | null>(null);
  const [skippedPage, setSkippedPage] = useState(1);
  const [skippedLoading, setSkippedLoading] = useState(false);

  // SSE connection ref
  const eventSourceRef = React.useRef<EventSource | null>(null);

  // On mount: check if any job is actively running — resume SSE; otherwise clear stale bar
  useEffect(() => {
    const resumeActiveJob = async () => {
      try {
        const res = await fetch('/api/admin/bulk-upload/status?checkActive=true');
        const data = await res.json();
        if (data.activeJob) {
          setActiveJob(data.activeJob);
          if (data.activeJob.status === 'processing' || data.activeJob.status === 'pending') {
            openSSE(data.activeJob.id);
          }
        } else {
          // No active job → clear any stale state
          setActiveJob(null);
          setTotalCustomers(null);
        }
      } catch { }
    };
    resumeActiveJob();
    return () => { eventSourceRef.current?.close(); };
  }, []);

  // Open SSE connection for a given jobId
  const openSSE = (jobId: string) => {
    eventSourceRef.current?.close(); // close any existing
    const es = new EventSource(`/api/admin/bulk-upload/stream?jobId=${jobId}`);

    es.onmessage = (e) => {
      try {
        const msg = JSON.parse(e.data);

        if (msg.type === 'snapshot') {
          // Only show if still active — don't resurrect stale completed/failed jobs
          if (msg.job?.status === 'completed' || msg.job?.status === 'failed') {
            es.close();
            // Show briefly then auto-dismiss
            setActiveJob(msg.job);
            if (msg.totalCustomers !== undefined) setTotalCustomers(msg.totalCustomers);
            if (msg.job?.status === 'completed') {
              toast(`✅ Upload done! ${msg.job.successCount} new, ${msg.job.updatedCount} updated`);
              fetchData();
            }
            setTimeout(() => { setActiveJob(null); setTotalCustomers(null); }, 5000);
            return;
          }
          setActiveJob(msg.job);
          if (msg.totalCustomers !== undefined) setTotalCustomers(msg.totalCustomers);

        } else if (msg.type === 'progress') {
          setActiveJob((prev: any) => prev ? {
            ...prev,
            processedRows: msg.processed,
            successCount: msg.successCount,
            updatedCount: msg.updatedCount,
            skippedCount: msg.skippedCount,
            errorCount: msg.errorCount,
          } : prev);
          if (msg.totalCustomers !== undefined) setTotalCustomers(msg.totalCustomers);

        } else if (msg.type === 'done') {
          setActiveJob((prev: any) => prev ? {
            ...prev,
            status: 'completed',
            successCount: msg.successCount,
            updatedCount: msg.updatedCount,
            skippedCount: msg.skippedCount,
            errorCount: msg.errorCount,
          } : prev);
          if (msg.totalCustomers !== undefined) setTotalCustomers(msg.totalCustomers);
          es.close();
          toast(`✅ Upload done! ${msg.successCount} new, ${msg.updatedCount} updated`);
          fetchData();
          // Auto-dismiss after 8s
          setTimeout(() => { setActiveJob(null); setTotalCustomers(null); }, 8000);

        } else if (msg.type === 'error') {
          setActiveJob((prev: any) => prev ? { ...prev, status: 'failed' } : prev);
          es.close();
          toast('❌ Upload failed');
          // Auto-dismiss after 5s
          setTimeout(() => { setActiveJob(null); setTotalCustomers(null); }, 5000);
        }
      } catch { }
    };

    es.onerror = () => { es.close(); };
    eventSourceRef.current = es;
  };

  // Fetch paginated skipped records
  const fetchSkippedRecords = async (jobId: string, page: number) => {
    setSkippedLoading(true);
    try {
      const res = await fetch(`/api/admin/bulk-upload/skipped?jobId=${jobId}&page=${page}&limit=20`);
      const data = await res.json();
      setSkippedData(data);
      setSkippedPage(page);
    } catch {
      setSkippedData(null);
    }
    setSkippedLoading(false);
  };

  const fetchUploadHistory = async () => {
    setHistoryLoading(true);
    try {
      const res = await fetch('/api/admin/bulk-upload/history');
      if (res.ok) setUploadHistory(await res.json());
    } catch (err) {
      console.error(err);
    }
    setHistoryLoading(false);
  };

  const handleDeleteUpload = (jobId: string) => {
    if (!confirm('Are you sure you want to delete this upload? This will permanently delete all customer records imported in this batch.')) return;
    setActiveDeleteJob(jobId);
    setDeleteProgress({ deletedRecords: 0, totalRecords: 0 });

    const es = new EventSource(`/api/admin/bulk-upload/history/delete-stream?jobId=${jobId}`);
    es.onmessage = (e) => {
      try {
        const msg = JSON.parse(e.data);
        if (msg.event === 'start') {
          setDeleteProgress({ deletedRecords: 0, totalRecords: msg.data.totalRecords });
        } else if (msg.event === 'progress') {
          setDeleteProgress({ deletedRecords: msg.data.deletedRecords, totalRecords: msg.data.totalRecords });
        } else if (msg.event === 'complete') {
          toast('✅ Upload batch deleted successfully');
          es.close();
          setActiveDeleteJob(null);
          setDeleteProgress(null);
          fetchUploadHistory(); // Refresh
        } else if (msg.event === 'error') {
          toast('❌ Error deleting upload');
          es.close();
          setActiveDeleteJob(null);
          setDeleteProgress(null);
        }
      } catch (err) {}
    };
    // Note: because the server is sending custom format "event: xxx \n data: xxx", 
    // default es.onmessage only listens to 'message' events without an event type.
    // If we use specific event names, we have to listen using addEventListener.
    // Actually, EventSource standard onmessage triggers if no event name is specified.
    // In our backend we did `event: progress`, so es.onmessage WON'T trigger! We must attach specific listeners.
  };

  // Attach proper listeners for delete event stream
  const startDeleteUploadStream = (job: any) => {
    if (!confirm('Are you sure you want to delete this upload? This will permanently delete all customer records imported in this batch.')) return;
    setActiveDeleteJob(job);
    setShowHistoryModal(false);
    setDeleteProgress({ deletedRecords: 0, totalRecords: 0 });

    const es = new EventSource(`/api/admin/bulk-upload/history/delete-stream?jobId=${job.id}`);

    es.addEventListener('start', (e: any) => {
      const data = JSON.parse(e.data);
      setDeleteProgress({ deletedRecords: 0, totalRecords: data.totalRecords });
    });

    es.addEventListener('progress', (e: any) => {
      const data = JSON.parse(e.data);
      setDeleteProgress({ deletedRecords: data.deletedRecords, totalRecords: data.totalRecords });
    });

    es.addEventListener('complete', (e: any) => {
      toast('✅ Upload batch deleted successfully');
      es.close();
      setTimeout(() => {
        setActiveDeleteJob(null);
        setDeleteProgress(null);
        fetchUploadHistory();
      }, 5000);
      setActiveDeleteJob((prev: any) => prev ? { ...prev, _done: true } : prev);
    });

    es.addEventListener('error', (e: any) => {
      let msg = 'Error deleting upload';
      try {
        if (e.data) {
          const data = JSON.parse(e.data);
          msg = data.message || msg;
        }
      } catch {}
      toast('❌ ' + msg);
      es.close();
      setActiveDeleteJob(null);
      setDeleteProgress(null);
    });
  };
  const [uploadAgent, setUploadAgent] = useState('');
  const [uploadPortfolio, setUploadPortfolio] = useState('');
  const [duplicateHandling, setDuplicateHandling] = useState('Skip Duplicates');
  const [previewRows, setPreviewRows] = useState<any[]>([]);
  const [previewHeaders, setPreviewHeaders] = useState<string[]>([]);
  const [uploadResult, setUploadResult] = useState<any>(null);
  const [validationError, setValidationError] = useState<string | null>(null);

  // Upload History States
  const [showHistoryModal, setShowHistoryModal] = useState(false);
  const [uploadHistory, setUploadHistory] = useState<any[]>([]);
  const [historyLoading, setHistoryLoading] = useState(false);
  const [activeDeleteJob, setActiveDeleteJob] = useState<any>(null);
  const [deleteProgress, setDeleteProgress] = useState<{ deletedRecords: number, totalRecords: number } | null>(null);

  // Dynamic field definitions fetched from backend (not hardcoded)
  const [uploadFields, setUploadFields] = useState<{ staticFields: any[]; customFields: any[] }>({ staticFields: [], customFields: [] });

  // Column State
  const [isAddingColumn, setIsAddingColumn] = useState(false);
  const [newColumn, setNewColumn] = useState({ label: '', key: '', type: 'string' });

  // Portfolio State
  const [isAddingPortfolio, setIsAddingPortfolio] = useState(false);
  const [newPortfolio, setNewPortfolio] = useState({ name: '', bank: '' });

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
    try {
      const safeFetch = async (url: string) => {
        try {
          const res = await fetch(url, { cache: 'no-store' });
          if (!res.ok) throw new Error(`HTTP ${res.status}`);
          return await res.json();
        } catch (e) {
          console.error(`Failed to fetch ${url}:`, e);
          return null;
        }
      };

      if (activeTab === 'users' || activeTab === 'bulk') {
        const data = await safeFetch(`/api/admin/users?requesterId=${user?.id}`);
        setUsers(Array.isArray(data) ? data : []);
      }

      if (activeTab === 'portfolios' || activeTab === 'bulk') {
        const data = await safeFetch(`/api/admin/portfolios?requesterId=${user?.id}`);
        setPortfolios(Array.isArray(data) ? data : []);
      }

      // Run these in parallel where possible
      const parallelFetches: Promise<void>[] = [];

      if (activeTab === 'columns') {
        parallelFetches.push(
          safeFetch('/api/admin/columns').then(data => setColumns(Array.isArray(data) ? data : []))
        );
      }

      if (activeTab === 'bulk') {
        parallelFetches.push(
          safeFetch('/api/admin/columns').then(data => setColumns(Array.isArray(data) ? data : []))
        );
        parallelFetches.push(
          safeFetch('/api/admin/bulk-upload/fields').then(data => {
            if (data) setUploadFields({ staticFields: data.staticFields || [], customFields: data.customFields || [] });
          })
        );
      }

      if (activeTab === 'audit') {
        parallelFetches.push(
          safeFetch(`/api/admin/audit-logs?requesterId=${user?.id}`).then(data => setAuditLogs(Array.isArray(data) ? data : []))
        );
      }

      if (activeTab === 'lists') {
        parallelFetches.push(
          safeFetch('/api/admin/master-lists').then(data => setMasterLists(Array.isArray(data) ? data : []))
        );
      }

      if (parallelFetches.length > 0) {
        await Promise.all(parallelFetches);
      }

    } catch (e) {
      console.error('fetchData error:', e);
    } finally {
      setLoading(false);
    }
  };


  const handleSavePortfolio = async (portfolioId: number, agentIds: number[], managerIds: number[]) => {
    const res = await fetch('/api/admin/portfolios', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id: portfolioId, action: 'bulk', agentIds, managerIds })
    });
    if (res.ok) {
      fetchData();
      toast('Portfolio saved successfully');
    } else {
      toast('Failed to save portfolio');
    }
  };

  const handleDeletePortfolio = async (id: number) => {
    try {
      const res = await fetch(`/api/admin/portfolios?id=${id}`, { method: 'DELETE' });
      if (res.ok) {
        const data = await res.json();
        toast(`Portfolio deleted — ${data.stats?.agentsDisconnected || 0} agents, ${data.stats?.managersDisconnected || 0} managers disconnected, ${data.stats?.customersUnassigned || 0} customers unassigned`);
        fetchData();
      } else {
        const err = await res.json();
        toast(err.message || 'Failed to delete portfolio');
      }
    } catch {
      toast('Error deleting portfolio');
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
    if (!newPortfolio.name) return alert('Portfolio Name is required');
    const res = await fetch('/api/admin/portfolios', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(newPortfolio)
    });
    if (res.ok) {
      setNewPortfolio({ name: '', bank: '' });
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
    const baseHeaders = ['Account No', 'Customer Name', 'Portfolio', 'Bucket', 'DPD', 'Outstanding', 'Mobile', 'Phone', 'Alt Mobile', 'Email', 'Address', 'Pincode', 'City', 'State'];
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

    // ── All static fields come from backend (not hardcoded) ──────────────────
    const standard = uploadFields.staticFields.map(f => ({
      label: f.label,
      keys: f.keys.map((k: string) => k.toLowerCase().replace(/[^a-z0-9]/g, ''))
    }));

    // ── Dynamic/custom columns from LeadColumn table ──────────────────────────
    const dynamicCols = uploadFields.customFields.map(c => ({
      label: c.label,
      key: c.key,
      keys: [
        c.key.toLowerCase().replace(/[^a-z0-9]/g, ''),
        c.label.toLowerCase().replace(/[^a-z0-9]/g, '')
      ]
    }));

    const actual = previewHeaders.map(h => String(h).toLowerCase().replace(/[^a-z0-9]/g, '').trim());

    // Match each static field against actual Excel headers
    const report = standard.map(s => {
      const foundIdx = actual.findIndex(a => s.keys.includes(a));
      return {
        label: s.label,
        matched: foundIdx !== -1,
        fileHeader: foundIdx !== -1 ? previewHeaders[foundIdx] : null
      };
    });

    // Headers not matched by any static field
    const unmatched = previewHeaders.filter(h => {
      const n = String(h).toLowerCase().replace(/[^a-z0-9]/g, '');
      return !standard.some(s => s.keys.includes(n));
    });

    // Split: known custom column → metadata | truly unknown → ignored
    const metadataCols: string[] = [];
    const ignoredCols: string[] = [];
    for (const h of unmatched) {
      const n = String(h).toLowerCase().replace(/[^a-z0-9]/g, '');
      if (dynamicCols.some(d => d.keys.includes(n))) metadataCols.push(h);
      else ignoredCols.push(h);
    }

    // Add missing dynamic columns to the report so user knows they are absent
    dynamicCols.forEach(d => {
      // Skip internal fields that shouldn't be expected in excel
      const isInternal = ['created date', 'updated date', 'created at', 'updated at', 'allocation pool'].includes(d.label.toLowerCase());
      if (isInternal) return;

      const isFound = actual.some(a => d.keys.includes(a));
      if (!isFound) {
        report.push({
          label: d.label + ' (Custom)',
          matched: false,
          fileHeader: null
        });
      }
    });

    setColumnMatchResult({ report, metadataCols, ignoredCols });
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
          const sheet = workbook.Sheets[workbook.SheetNames[0]];
          const json = XLSX.utils.sheet_to_json(sheet);

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
            // Set initial job state
            setActiveJob({ id: result.jobId, status: 'pending', processedRows: 0, totalRows: json.length, fileName: uploadFile.name, successCount: 0, updatedCount: 0, skippedCount: 0, errorCount: 0 });
            setUploadFile(null);
            setPreviewRows([]);
            toast('🚀 Upload started — live updates via SSE');
            // Open SSE for real-time push
            openSSE(result.jobId);
          } else {
            toast('❌ Error: ' + (result.error || 'Failed'));
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
    { id: 'users', label: 'Users', icon: <Users size={16} /> },
    { id: 'portfolios', label: 'Portfolios', icon: <Briefcase size={16} /> },
    { id: 'columns', label: 'Columns', icon: <LayoutGrid size={16} /> },
    { id: 'bulk', label: 'Bulk Upload', icon: <UploadCloud size={16} /> },
    { id: 'lists', label: 'Master Lists', icon: <ListOrdered size={16} /> },
    { id: 'role', label: 'Role Access', icon: <Lock size={16} /> },
    { id: 'report', label: 'Report Access', icon: <BarChart3 size={16} /> },
    { id: 'audit', label: 'Audit Logs', icon: <History size={16} /> },
    { id: 'system', label: 'System', icon: <Settings size={16} /> },
  ];

  return (
    <div className="page on" style={{ background: 'var(--bg)' }}>
      {/* Sticky Progress Bar for Background Jobs */}
      <AdminProgressBars 
        activeJob={activeJob}
        totalCustomers={totalCustomers}
        setActiveJob={setActiveJob}
        setTotalCustomers={setTotalCustomers}
        setSkippedPage={setSkippedPage}
        setShowSkipped={setShowSkipped}
        fetchSkippedRecords={fetchSkippedRecords}
        activeDeleteJob={activeDeleteJob}
        setActiveDeleteJob={setActiveDeleteJob}
        deleteProgress={deleteProgress}
        setDeleteProgress={setDeleteProgress}
      />

      <div className="admin-nav" style={{ 
        padding: '0 20px', 
        background: 'var(--bg2)', 
        borderBottom: '1px solid var(--bdr)', 
        display: 'flex', 
        gap: 4, 
        overflowX: 'auto',
        height: '48px',
        position: 'sticky',
        top: 0,
        zIndex: 10,
        scrollbarWidth: 'none'
      }}>
        {tabs.map(t => {
          const isActive = activeTab === t.id;
          return (
            <div 
              key={t.id} 
              className={`admin-tab ${isActive ? 'active' : ''}`} 
              onClick={() => setActiveTab(t.id)} 
              style={{ 
                display: 'flex', 
                alignItems: 'center', 
                gap: 8, 
                padding: '0 16px', 
                fontSize: '12.5px', 
                fontWeight: isActive ? 600 : 500, 
                cursor: 'pointer', 
                height: '100%',
                color: isActive ? 'var(--acc2)' : 'var(--txt3)',
                borderBottom: isActive ? '2px solid var(--acc2)' : '2px solid transparent',
                transition: 'all 0.15s ease',
                whiteSpace: 'nowrap',
                opacity: isActive ? 1 : 0.8
              }}
            >
              <span style={{ display: 'flex', alignItems: 'center' }}>{t.icon}</span> 
              <span>{t.label}</span>
            </div>
          );
        })}
      </div>

      <div className="page-body" style={{ flex: 1, overflowY: 'auto', padding: '20px' }}>

        {activeTab === 'users' && (
          <UsersTab 
            users={users}
            loading={loading}
            setEditUser={setEditUser}
            setIsEditModalOpen={setIsEditModalOpen}
            handleEditClick={handleEditClick}
            setResetUser={setResetUser}
            setIsPasswordModalOpen={setIsPasswordModalOpen}
            handleDeactivateClick={handleDeactivateClick}
            handleDeleteUser={handleDeleteUser}
            onRefresh={fetchData}
            toast={toast}
          />
        )}

        {activeTab === 'portfolios' && (
          <PortfoliosTab 
            loading={loading}
            setIsAddingPortfolio={setIsAddingPortfolio}
            isAddingPortfolio={isAddingPortfolio}
            newPortfolio={newPortfolio}
            setNewPortfolio={setNewPortfolio}
            handleAddPortfolio={handleAddPortfolio}
            portfolios={portfolios}
            users={users}
            onSavePortfolio={handleSavePortfolio}
            onDeletePortfolio={handleDeletePortfolio}
          />
        )}

        {activeTab === 'columns' && (
          <ColumnsTab 
            loading={loading}
            setIsAddingColumn={setIsAddingColumn}
            isAddingColumn={isAddingColumn}
            newColumn={newColumn}
            setNewColumn={setNewColumn}
            handleAddColumn={handleAddColumn}
            columns={columns}
            handleToggleVisibility={handleToggleVisibility}
            handleToggleProfileVisibility={handleToggleProfileVisibility}
          />
        )}

        {activeTab === 'bulk' && (
          <BulkUploadTab 
            loading={loading}
            setShowHistoryModal={setShowHistoryModal}
            fetchUploadHistory={fetchUploadHistory}
            handleDownloadTemplate={handleDownloadTemplate}
            uploadFile={uploadFile}
            handleFileSelect={handleFileSelect}
            previewRows={previewRows}
            handleReset={handleReset}
            validationError={validationError}
            previewHeaders={previewHeaders}
            uploadFields={uploadFields}
            uploadResult={uploadResult}
            uploading={uploading}
            uploadPortfolio={uploadPortfolio}
            setUploadPortfolio={setUploadPortfolio}
            portfolios={portfolios}
            duplicateHandling={duplicateHandling}
            setDuplicateHandling={setDuplicateHandling}
            handleCheckColumns={handleCheckColumns}
            handleStartUpload={handleStartUpload}
            columnMatchResult={columnMatchResult}
            setColumnMatchResult={setColumnMatchResult}
          />
        )}
        {activeTab === 'lists' && (
          <MasterListsTab 
            DEFAULT_LISTS={DEFAULT_LISTS}
            masterLists={masterLists}
            handleDeleteListItem={handleDeleteListItem}
            newListItem={newListItem}
            setNewListItem={setNewListItem}
            handleAddListItem={handleAddListItem}
            toast={toast}
          />
        )}
        {activeTab === 'role' && (
          <RolesTab />
        )}
        {activeTab === 'report' && (
          <ReportsTab toast={toast} />
        )}

        {activeTab === 'audit' && (
          <AuditLogsTab auditLogs={auditLogs} />
        )}

        {activeTab === 'system' && (
          <SystemTab 
            setFlushAction={setFlushAction}
            setIsFlushModalOpen={setIsFlushModalOpen}
            cleanupMonth={cleanupMonth}
            setCleanupMonth={setCleanupMonth}
            cleanupYear={cleanupYear}
            setCleanupYear={setCleanupYear}
          />
        )}


        <EditUserModal 
          isEditModalOpen={isEditModalOpen}
          editUser={editUser}
          setIsEditModalOpen={setIsEditModalOpen}
          setEditUser={setEditUser}
          users={users}
          handleSave={handleSave}
        />

        <DeactivateUserModal 
          isDeactivateModalOpen={isDeactivateModalOpen}
          deactivatingUser={deactivatingUser}
          setIsDeactivateModalOpen={setIsDeactivateModalOpen}
          toggleUserStatus={toggleUserStatus}
        />

        <ResetPasswordModal 
          isPasswordModalOpen={isPasswordModalOpen}
          resetUser={resetUser}
          setIsPasswordModalOpen={setIsPasswordModalOpen}
          newPassword={newPassword}
          setNewPassword={setNewPassword}
          handlePasswordReset={handlePasswordReset}
          resetting={resetting}
        />

        <FlushDBModal 
          isFlushModalOpen={isFlushModalOpen}
          setIsFlushModalOpen={setIsFlushModalOpen}
          flushAction={flushAction}
          flushPassword={flushPassword}
          setFlushPassword={setFlushPassword}
          handleFlushDB={handleFlushDB}
          flushing={flushing}
        />

      </div>

      {/* ── Skipped Records Modal ───────────────────────────────────────── */}
      <SkippedRecordsModal 
        showSkipped={showSkipped}
        setShowSkipped={setShowSkipped}
        skippedData={skippedData}
        skippedLoading={skippedLoading}
        activeJob={activeJob}
        skippedPage={skippedPage}
        fetchSkippedRecords={fetchSkippedRecords}
      />

    {/* ── Upload History Modal ───────────────────────────────────────── */}
      <UploadHistoryModal 
        showHistoryModal={showHistoryModal}
        setShowHistoryModal={setShowHistoryModal}
        historyLoading={historyLoading}
        uploadHistory={uploadHistory}
        activeDeleteJob={activeDeleteJob}
        deleteProgress={deleteProgress}
        startDeleteUploadStream={startDeleteUploadStream}
      />

    </div>
  );
};

export default Admin;
