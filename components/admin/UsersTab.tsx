import React from 'react';

interface UsersTabProps {
  users: any[];
  setEditUser: (user: any) => void;
  setIsEditModalOpen: (open: boolean) => void;
  handleEditClick: (user: any) => void;
  setResetUser: (user: any) => void;
  setIsPasswordModalOpen: (open: boolean) => void;
  handleDeactivateClick: (user: any) => void;
  handleDeleteUser: (user: any) => void;
}

const UsersTab: React.FC<UsersTabProps> = ({
  users,
  setEditUser,
  setIsEditModalOpen,
  handleEditClick,
  setResetUser,
  setIsPasswordModalOpen,
  handleDeactivateClick,
  handleDeleteUser
}) => {
  return (
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
  );
};

export default UsersTab;
