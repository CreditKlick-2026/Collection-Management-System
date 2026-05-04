import React from 'react';

interface EditUserModalProps {
  isEditModalOpen: boolean;
  editUser: any;
  setIsEditModalOpen: (val: boolean) => void;
  setEditUser: (val: any) => void;
  users: any[];
  handleSave: () => void;
}

const EditUserModal: React.FC<EditUserModalProps> = ({
  isEditModalOpen,
  editUser,
  setIsEditModalOpen,
  setEditUser,
  users,
  handleSave
}) => {
  if (!isEditModalOpen || !editUser) return null;

  return (
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
  );
};

export default EditUserModal;
