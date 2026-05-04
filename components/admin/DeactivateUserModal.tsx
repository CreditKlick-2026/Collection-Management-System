import React from 'react';

interface DeactivateUserModalProps {
  isDeactivateModalOpen: boolean;
  deactivatingUser: any;
  setIsDeactivateModalOpen: (val: boolean) => void;
  toggleUserStatus: (user: any) => void;
}

const DeactivateUserModal: React.FC<DeactivateUserModalProps> = ({
  isDeactivateModalOpen,
  deactivatingUser,
  setIsDeactivateModalOpen,
  toggleUserStatus
}) => {
  if (!isDeactivateModalOpen || !deactivatingUser) return null;

  return (
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
  );
};

export default DeactivateUserModal;
