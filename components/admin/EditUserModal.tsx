import React from 'react';
import { 
  User, 
  Mail, 
  Shield, 
  Key, 
  CheckCircle2, 
  X,
  Briefcase,
  Contact,
  UserCircle,
  Phone
} from 'lucide-react';

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

  const isEditing = !!editUser.id;

  return (
    <div className="modal-overlay" style={{ 
      position: 'fixed', 
      top: 0, 
      left: 0, 
      width: '100%', 
      height: '100%', 
      background: 'rgba(0,0,0,0.85)', 
      backdropFilter: 'blur(8px)',
      zIndex: 1000, 
      display: 'flex', 
      alignItems: 'center', 
      justifyContent: 'center',
      padding: '20px'
    }}>
      <div className="modal-content" style={{ 
        background: 'var(--bg2)', 
        border: '1px solid var(--bdr)', 
        borderRadius: 20, 
        width: '100%', 
        maxWidth: '800px', 
        maxHeight: '90vh', 
        overflow: 'hidden', 
        display: 'flex', 
        flexDirection: 'column',
        boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.5)'
      }}>
        {/* Header */}
        <div style={{ 
          padding: '24px 28px', 
          borderBottom: '1px solid var(--bdr)', 
          display: 'flex', 
          justifyContent: 'space-between', 
          alignItems: 'center',
          background: 'rgba(255,255,255,0.02)'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <div style={{ 
              width: 40, 
              height: 40, 
              borderRadius: 12, 
              background: 'var(--accbg)', 
              color: 'var(--acc2)', 
              display: 'flex', 
              alignItems: 'center', 
              justifyContent: 'center' 
            }}>
              {isEditing ? <User size={20} /> : <UserCircle size={20} />}
            </div>
            <div>
              <div style={{ fontSize: 18, fontWeight: 700, color: 'var(--txt)' }}>
                {isEditing ? 'Update User Profile' : 'Create New User'}
              </div>
              <div style={{ fontSize: 12, color: 'var(--txt3)', marginTop: 2 }}>
                {isEditing ? `Modifying settings for ${editUser.name}` : 'Fill in the details to register a new team member'}
              </div>
            </div>
          </div>
          <button 
            style={{ 
              background: 'rgba(255,255,255,0.05)', 
              border: 'none', 
              color: 'var(--txt3)', 
              width: 32, 
              height: 32, 
              borderRadius: '50%', 
              display: 'flex', 
              alignItems: 'center', 
              justifyContent: 'center',
              cursor: 'pointer',
              transition: 'all 0.2s'
            }} 
            onClick={() => setIsEditModalOpen(false)}
          >
            <X size={18} />
          </button>
        </div>

        {/* Body */}
        <div style={{ flex: 1, overflowY: 'auto', padding: '32px 28px' }}>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '24px' }}>
            
            {/* Full Name */}
            <div className="ff">
              <label style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 11, fontWeight: 600, color: 'var(--txt3)', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 8 }}>
                <User size={12} /> Full Name
              </label>
              <input 
                className="finp" 
                style={{ borderRadius: 10, padding: '12px 14px', background: 'rgba(255,255,255,0.02)', border: '1px solid var(--bdr)' }}
                placeholder="e.g. John Doe"
                value={editUser.name} 
                onChange={e => setEditUser({ ...editUser, name: e.target.value })} 
              />
            </div>

            {/* Username */}
            <div className="ff">
              <label style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 11, fontWeight: 600, color: 'var(--txt3)', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 8 }}>
                <Contact size={12} /> Username
              </label>
              <input 
                className="finp" 
                style={{ borderRadius: 10, padding: '12px 14px', background: 'rgba(255,255,255,0.02)', border: '1px solid var(--bdr)' }}
                placeholder="johndoe123"
                value={editUser.username} 
                onChange={e => setEditUser({ ...editUser, username: e.target.value })} 
              />
            </div>

            {/* Employee ID */}
            <div className="ff">
              <label style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 11, fontWeight: 600, color: 'var(--txt3)', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 8 }}>
                <Briefcase size={12} /> Employee ID
              </label>
              <input 
                className="finp" 
                style={{ borderRadius: 10, padding: '12px 14px', background: 'rgba(255,255,255,0.02)', border: '1px solid var(--bdr)' }}
                placeholder="IMS1001"
                value={editUser.empId} 
                onChange={e => setEditUser({ ...editUser, empId: e.target.value })} 
              />
            </div>

            {/* Role */}
            <div className="ff">
              <label style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 11, fontWeight: 600, color: 'var(--txt3)', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 8 }}>
                <Shield size={12} /> User Role
              </label>
              <select 
                className="finp" 
                style={{ borderRadius: 10, padding: '12px 14px', background: 'rgba(255,255,255,0.02)', border: '1px solid var(--bdr)', cursor: 'pointer' }}
                value={editUser.role} 
                onChange={e => setEditUser({ ...editUser, role: e.target.value })}
              >
                <option value="admin">Admin</option>
                <option value="manager">Supervisor</option>
                <option value="agent">Agent</option>
              </select>
            </div>

            {/* Reports To */}
            {(editUser.role === 'agent' || editUser.role === 'manager') && (
              <div className="ff">
                <label style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 11, fontWeight: 600, color: 'var(--txt3)', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 8 }}>
                  <UserCircle size={12} /> Reporting To (Optional)
                </label>
                <select 
                  className="finp" 
                  style={{ borderRadius: 10, padding: '12px 14px', background: 'rgba(255,255,255,0.02)', border: '1px solid var(--bdr)', cursor: 'pointer' }}
                  value={editUser.managerId || ''} 
                  onChange={e => setEditUser({ ...editUser, managerId: e.target.value })}
                >
                  <option value="">— Select Manager —</option>
                  {users.filter(x => (x.role === 'manager' || x.role === 'admin') && x.id !== editUser.id).map(u => (
                    <option key={u.id} value={u.id}>{u.name} ({u.empId})</option>
                  ))}
                </select>
              </div>
            )}

            {/* Email */}
            <div className="ff">
              <label style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 11, fontWeight: 600, color: 'var(--txt3)', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 8 }}>
                <Mail size={12} /> Email Address
              </label>
              <input 
                className="finp" 
                style={{ borderRadius: 10, padding: '12px 14px', background: 'rgba(255,255,255,0.02)', border: '1px solid var(--bdr)' }}
                placeholder="john@example.com"
                value={editUser.email || ''} 
                onChange={e => setEditUser({ ...editUser, email: e.target.value })} 
              />
            </div>

            {/* Phone Number */}
            <div className="ff">
              <label style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 11, fontWeight: 600, color: 'var(--txt3)', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 8 }}>
                <Phone size={12} /> Phone Number
              </label>
              <input 
                className="finp" 
                style={{ borderRadius: 10, padding: '12px 14px', background: 'rgba(255,255,255,0.02)', border: '1px solid var(--bdr)' }}
                placeholder="e.g. 9876543210"
                value={editUser.contact || ''} 
                onChange={e => setEditUser({ ...editUser, contact: e.target.value })} 
              />
            </div>

            {/* Password Section */}
            {!isEditing && (
              <>
                <div className="ff">
                  <label style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 11, fontWeight: 600, color: 'var(--txt3)', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 8 }}>
                    <Key size={12} /> Password
                  </label>
                  <input 
                    className="finp" 
                    type="password" 
                    style={{ borderRadius: 10, padding: '12px 14px', background: 'rgba(255,255,255,0.02)', border: '1px solid var(--bdr)' }}
                    placeholder="••••••••"
                    value={editUser.password || ''} 
                    onChange={e => setEditUser({ ...editUser, password: e.target.value })} 
                  />
                </div>
                <div className="ff">
                  <label style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 11, fontWeight: 600, color: 'var(--txt3)', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 8 }}>
                    <Key size={12} /> Confirm Password
                  </label>
                  <input 
                    className="finp" 
                    type="password" 
                    style={{ borderRadius: 10, padding: '12px 14px', background: 'rgba(255,255,255,0.02)', border: '1px solid var(--bdr)' }}
                    placeholder="••••••••"
                    value={editUser.confirmPassword || ''} 
                    onChange={e => setEditUser({ ...editUser, confirmPassword: e.target.value })} 
                  />
                </div>
              </>
            )}
          </div>
        </div>

        {/* Footer */}
        <div style={{ 
          padding: '24px 28px', 
          borderTop: '1px solid var(--bdr)', 
          display: 'flex', 
          gap: 12,
          background: 'rgba(0,0,0,0.1)'
        }}>
          <button 
            className="btn pr" 
            style={{ 
              flex: 1, 
              padding: '12px', 
              fontSize: 14, 
              fontWeight: 600,
              background: 'var(--acc)', 
              borderRadius: 12,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: 8,
              border: 'none',
              cursor: 'pointer',
              boxShadow: '0 4px 14px rgba(79, 125, 255, 0.3)'
            }} 
            onClick={handleSave}
          >
            <CheckCircle2 size={18} /> {isEditing ? 'Save Changes' : 'Create User'}
          </button>
          <button 
            className="btn" 
            style={{ 
              padding: '12px 24px', 
              fontSize: 14, 
              fontWeight: 600,
              background: 'rgba(255,255,255,0.05)', 
              color: 'var(--txt)', 
              borderRadius: 12,
              border: '1px solid var(--bdr)',
              cursor: 'pointer'
            }} 
            onClick={() => setIsEditModalOpen(false)}
          >
            Cancel
          </button>
        </div>
      </div>
    </div>
  );
};

export default EditUserModal;
