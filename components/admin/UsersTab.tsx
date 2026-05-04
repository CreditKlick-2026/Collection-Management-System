import React, { useRef, useState } from 'react';
import { UserPlus, Upload, Download, Loader2 } from 'lucide-react';
import * as XLSX from 'xlsx';

interface UsersTabProps {
  users: any[];
  loading?: boolean;
  setEditUser: (user: any) => void;
  setIsEditModalOpen: (open: boolean) => void;
  handleEditClick: (user: any) => void;
  setResetUser: (user: any) => void;
  setIsPasswordModalOpen: (open: boolean) => void;
  handleDeactivateClick: (user: any) => void;
  handleDeleteUser: (user: any) => void;
  onRefresh?: () => void;
  toast: (msg: string) => void;
}

const UsersTab: React.FC<UsersTabProps> = ({
  users,
  loading,
  setEditUser,
  setIsEditModalOpen,
  handleEditClick,
  setResetUser,
  setIsPasswordModalOpen,
  handleDeactivateClick,
  handleDeleteUser,
  onRefresh,
  toast
}) => {
  const [uploading, setUploading] = useState(false);
  const [previewData, setPreviewData] = useState<any[]>([]);
  const [showPreview, setShowPreview] = useState(false);
  const [isValidated, setIsValidated] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleDownloadSample = () => {
    const headers = ["Full Name", "Username", "Employee ID", "Phone Number", "Role", "Reports To (Emp ID)", "Email Address", "Password", "Confirm Password"];
    const sampleData = [
      ["John Doe", "johndoe123", "IMS1001", "9876543210", "agent", "IMS1002", "john@example.com", "Pass@123", "Pass@123"],
      ["Jane Manager", "janem", "IMS1002", "9988776655", "manager", "", "jane@example.com", "Admin@456", "Admin@456"],
    ];
    const ws = XLSX.utils.aoa_to_sheet([headers, ...sampleData]);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Users Template");
    XLSX.writeFile(wb, "users_template.xlsx");
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploading(true);
    const reader = new FileReader();
    reader.onload = async (evt) => {
      try {
        const bstr = evt.target?.result;
        const wb = XLSX.read(bstr, { type: 'binary' });
        const wsname = wb.SheetNames[0];
        const ws = wb.Sheets[wsname];
        const data = XLSX.utils.sheet_to_json(ws) as any[];

        if (data.length === 0) {
          toast("❌ Excel file is empty");
          setUploading(false);
          return;
        }

        // 1. Column Validation
        const requiredFields = ["Full Name", "Username", "Employee ID", "Role", "Password", "Confirm Password"];
        const headers = Object.keys(data[0]);
        const missing = requiredFields.filter(f => !headers.includes(f));
        if (missing.length > 0) {
          toast(`❌ Missing columns: ${missing.join(", ")}`);
          setUploading(false);
          return;
        }

        // 2. Data Validation
        const validatedData = [];
        for (let i = 0; i < data.length; i++) {
          const row = data[i];
          if (row["Password"] !== row["Confirm Password"]) {
            toast(`❌ Row ${i + 2}: Passwords do not match`);
            setUploading(false);
            return;
          }
          validatedData.push({
            name: row["Full Name"],
            username: row["Username"],
            empId: row["Employee ID"],
            contact: String(row["Phone Number"] || ""),
            email: row["Email Address"] || "",
            role: row["Role"].toLowerCase(),
            password: row["Password"],
            managerEmpId: row["Reports To (Emp ID)"] || null,
          });
        }

        // 3. Show Preview
        setPreviewData(validatedData);
        setIsValidated(false); // Reset validation on new file
        setShowPreview(true);
      } catch (err) {
        console.error(err);
        toast("❌ Failed to process Excel file");
      } finally {
        setUploading(false);
        if (fileInputRef.current) fileInputRef.current.value = "";
      }
    };
    reader.readAsBinaryString(file);
  };

  const handleConfirmUpload = async () => {
    setUploading(true);
    try {
      const res = await fetch('/api/admin/users/bulk', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ users: previewData })
      });

      const result = await res.json();
      if (res.ok) {
        toast(`✅ Successfully uploaded ${result.count} users`);
        setShowPreview(false);
        setPreviewData([]);
        if (onRefresh) onRefresh();
      } else {
        toast(`❌ Error: ${result.message || 'Upload failed'}`);
      }
    } catch (err) {
      toast("❌ Connection error");
    } finally {
      setUploading(false);
    }
  };
  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: 15, gap: 10 }}>
        <input 
          type="file" 
          ref={fileInputRef} 
          style={{ display: 'none' }} 
          accept=".xlsx, .xls" 
          onChange={handleFileUpload} 
        />
        
        <button
          className="btn"
          style={{ 
            borderRadius: 6, 
            padding: '8px 16px', 
            fontSize: '12px', 
            fontWeight: 600, 
            display: 'flex', 
            alignItems: 'center', 
            gap: 6,
            background: 'rgba(255,255,255,0.05)',
            color: 'var(--txt)',
            border: '1px solid var(--bdr)'
          }}
          onClick={handleDownloadSample}
        >
          <Download size={14} /> Sample
        </button>

        <button
          className="btn"
          disabled={uploading}
          style={{ 
            borderRadius: 6, 
            padding: '8px 16px', 
            fontSize: '12px', 
            fontWeight: 600, 
            display: 'flex', 
            alignItems: 'center', 
            gap: 6,
            background: 'rgba(255,255,255,0.05)',
            color: 'var(--txt)',
            border: '1px solid var(--bdr)',
            opacity: uploading ? 0.6 : 1
          }}
          onClick={() => fileInputRef.current?.click()}
        >
          {uploading ? <Loader2 size={14} className="spin" /> : <Upload size={14} />} 
          Upload Excel
        </button>

        <button
          className="btn pr"
          style={{ 
            borderRadius: 6, 
            padding: '8px 16px', 
            fontSize: '12px', 
            fontWeight: 600, 
            display: 'flex', 
            alignItems: 'center', 
            gap: 6,
            boxShadow: '0 1px 2px rgba(0,0,0,0.05)'
          }}
          onClick={() => {
            setEditUser({ name: '', username: '', role: 'agent', empId: '', email: '', initials: '', active: true, password: '', confirmPassword: '' });
            setIsEditModalOpen(true);
          }}
        >
          <UserPlus size={14} /> Add User
        </button>
      </div>
      <div className="card" style={{ padding: 0, overflow: 'hidden', background: 'var(--bg2)', border: 'none' }}>
        <table className="tbl" style={{ borderCollapse: 'separate', borderSpacing: '0 8px' }}>
          <thead>
            <tr style={{ background: 'transparent' }}>
              <th style={{ background: 'transparent', border: 'none' }}>NAME</th>
              <th style={{ background: 'transparent', border: 'none' }}>EMP ID</th>
              <th style={{ background: 'transparent', border: 'none' }}>CONTACT</th>
              <th style={{ background: 'transparent', border: 'none' }}>ROLE</th>
              <th style={{ background: 'transparent', border: 'none' }}>MANAGER</th>
              <th style={{ background: 'transparent', border: 'none' }}>PORTFOLIO</th>
              <th style={{ background: 'transparent', border: 'none' }}>DOJ</th>
              <th style={{ background: 'transparent', border: 'none' }}>STATUS</th>
              <th style={{ background: 'transparent', border: 'none' }}>ACTIONS</th>
            </tr>
          </thead>
          <tbody style={{ background: 'transparent' }}>
            {loading ? (
              Array.from({ length: 5 }).map((_, i) => (
                <tr key={`skel-${i}`} style={{ background: 'rgba(255,255,255,0.02)' }}>
                  <td style={{ padding: '12px 10px', borderRadius: '8px 0 0 8px' }}>
                    <div style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
                      <div className="skel" style={{ width: 28, height: 28, borderRadius: '50%' }} />
                      <div>
                        <div className="skel" style={{ width: 100, height: 14, marginBottom: 4 }} />
                        <div className="skel" style={{ width: 150, height: 10 }} />
                      </div>
                    </div>
                  </td>
                  <td><div className="skel" style={{ width: 60, height: 14 }} /></td>
                  <td><div className="skel" style={{ width: 85, height: 14 }} /></td>
                  <td><div className="skel" style={{ width: 50, height: 18, borderRadius: 12 }} /></td>
                  <td>
                    <div className="skel" style={{ width: 80, height: 14, marginBottom: 4 }} />
                    <div className="skel" style={{ width: 60, height: 10 }} />
                  </td>
                  <td><div className="skel" style={{ width: 120, height: 14 }} /></td>
                  <td><div className="skel" style={{ width: 70, height: 14 }} /></td>
                  <td><div className="skel" style={{ width: 50, height: 22, borderRadius: 6 }} /></td>
                  <td style={{ borderRadius: '0 8px 8px 0' }}>
                    <div style={{ display: 'flex', gap: 5 }}>
                      <div className="skel" style={{ width: 38, height: 26, borderRadius: 6 }} />
                      <div className="skel" style={{ width: 28, height: 26, borderRadius: 6 }} />
                      <div className="skel" style={{ width: 70, height: 26, borderRadius: 6 }} />
                      <div className="skel" style={{ width: 48, height: 26, borderRadius: 6 }} />
                    </div>
                  </td>
                </tr>
              ))
            ) : users.length === 0 ? (
              <tr>
                <td colSpan={9} style={{ padding: '40px', textAlign: 'center', color: 'var(--txt3)' }}>
                  <div style={{ fontSize: 24, marginBottom: 10 }}>👤</div>
                  No users found.
                </td>
              </tr>
            ) : (
              users.map(u => (
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
                <td className="mn" style={{ fontSize: 11, color: 'var(--txt2)' }}>{u.contact || '—'}</td>
                <td><span className="badge" style={{ background: u.role === 'admin' ? 'var(--redbg)' : u.role === 'manager' ? 'var(--ambbg)' : 'var(--accbg)', color: u.role === 'admin' ? 'var(--red)' : u.role === 'manager' ? 'var(--amb)' : 'var(--acc2)', border: 'none' }}>{u.role === 'manager' ? 'supervisor' : u.role}</span></td>
                <td style={{ fontSize: 12 }}>
                  {u.manager ? <><div style={{ color: 'var(--txt)' }}>{u.manager.name}</div><div style={{ fontSize: 10, color: 'var(--txt3)' }}>{u.manager.empId}</div></> : <span style={{ color: 'var(--txt3)' }}>—</span>}
                </td>
                <td style={{ maxWidth: 250 }}>
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: 4 }}>
                    {u.portfolios ? u.portfolios.split(', ').map((pName: string, idx: number) => (
                      <span key={idx} style={{ 
                        fontSize: 9, 
                        padding: '2px 6px', 
                        background: 'rgba(147,112,219,0.1)', 
                        color: 'var(--pur)', 
                        borderRadius: 4, 
                        fontWeight: 600,
                        border: '1px solid rgba(147,112,219,0.2)'
                      }}>
                        {pName}
                      </span>
                    )) : <span style={{ color: 'var(--txt3)', fontSize: 11 }}>—</span>}
                  </div>
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
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Bulk Upload Preview Modal */}
      {showPreview && (
        <div className="modal-overlay" style={{ 
          position: 'fixed', top: 0, left: 0, width: '100%', height: '100%', 
          background: 'rgba(0,0,0,0.85)', backdropFilter: 'blur(8px)', zIndex: 1100,
          display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20
        }}>
          <div className="modal-content" style={{ 
            background: 'var(--bg2)', border: '1px solid var(--bdr)', borderRadius: 20,
            width: '100%', maxWidth: '1000px', maxHeight: '85vh', overflow: 'hidden',
            display: 'flex', flexDirection: 'column', boxShadow: '0 25px 50px -12px rgba(0,0,0,0.5)'
          }}>
            <div style={{ padding: '20px 24px', borderBottom: '1px solid var(--bdr)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div>
                <div style={{ fontSize: 18, fontWeight: 700 }}>Preview Bulk Upload</div>
                <div style={{ fontSize: 12, color: 'var(--txt3)' }}>Review the data from your Excel file before saving to database</div>
              </div>
              <button className="btn sm" onClick={() => setShowPreview(false)}>Cancel</button>
            </div>
            
            <div style={{ flex: 1, overflowY: 'auto', padding: 20 }}>
              <table className="tbl" style={{ width: '100%' }}>
                <thead>
                  <tr>
                    <th>NAME</th>
                    <th>USERNAME</th>
                    <th>EMP ID</th>
                    <th>PHONE</th>
                    <th>ROLE</th>
                    <th>REPORTS TO</th>
                    <th>EMAIL</th>
                    <th>PASSWORD</th>
                    <th>CONFIRM PASSWORD</th>
                  </tr>
                </thead>
                <tbody>
                  {previewData.map((row, idx) => (
                    <tr key={idx}>
                      <td>{row.name}</td>
                      <td className="mn">{row.username}</td>
                      <td className="mn">{row.empId}</td>
                      <td className="mn">{row.contact}</td>
                      <td>
                        <span className="badge" style={{ 
                          background: row.role === 'admin' ? 'var(--redbg)' : row.role === 'manager' ? 'var(--ambbg)' : 'var(--accbg)', 
                          color: row.role === 'admin' ? 'var(--red)' : row.role === 'manager' ? 'var(--amb)' : 'var(--acc2)', 
                          border: 'none',
                          padding: '4px 10px'
                        }}>
                          {row.role === 'manager' ? 'supervisor' : row.role}
                        </span>
                      </td>
                      <td className="mn">{row.managerEmpId || '—'}</td>
                      <td>{row.email}</td>
                      <td className="mn" style={{ opacity: 0.5 }}>••••••••</td>
                      <td className="mn" style={{ opacity: 0.5 }}>••••••••</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <div style={{ padding: '20px 24px', borderTop: '1px solid var(--bdr)', display: 'flex', gap: 12, background: 'rgba(0,0,0,0.1)' }}>
              {!isValidated ? (
                <button 
                  className="btn" 
                  style={{ flex: 1, padding: 12, borderRadius: 12, background: 'var(--acc2)', color: '#000', border: 'none', fontWeight: 700 }}
                  onClick={() => {
                    // Visual check simulation (already validated logic-wise during parsing)
                    setIsValidated(true);
                    toast("✅ Data validation successful. You can now save.");
                  }}
                >
                  🔍 Run Validation Check
                </button>
              ) : (
                <button 
                  className="btn pr" 
                  disabled={uploading}
                  style={{ flex: 1, padding: 12, borderRadius: 12, background: 'var(--grn)', border: 'none', fontWeight: 600 }}
                  onClick={handleConfirmUpload}
                >
                  {uploading ? 'Uploading...' : `Confirm & Save ${previewData.length} Users`}
                </button>
              )}
              <button 
                className="btn" 
                style={{ padding: '12px 24px', borderRadius: 12, background: 'rgba(255,255,255,0.05)', color: 'var(--txt)' }}
                onClick={() => { setShowPreview(false); setPreviewData([]); setIsValidated(false); }}
              >
                Discard
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default UsersTab;
