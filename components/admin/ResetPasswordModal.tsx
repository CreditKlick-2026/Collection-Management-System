import React from 'react';

interface ResetPasswordModalProps {
  isPasswordModalOpen: boolean;
  resetUser: any;
  setIsPasswordModalOpen: (val: boolean) => void;
  newPassword: string;
  setNewPassword: (val: string) => void;
  handlePasswordReset: () => void;
  resetting: boolean;
}

const ResetPasswordModal: React.FC<ResetPasswordModalProps> = ({
  isPasswordModalOpen,
  resetUser,
  setIsPasswordModalOpen,
  newPassword,
  setNewPassword,
  handlePasswordReset,
  resetting
}) => {
  if (!isPasswordModalOpen || !resetUser) return null;

  return (
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
  );
};

export default ResetPasswordModal;
