import React from 'react';

interface FlushDBModalProps {
  isFlushModalOpen: boolean;
  setIsFlushModalOpen: (val: boolean) => void;
  flushAction: 'all' | 'audit' | 'selective';
  flushPassword: string;
  setFlushPassword: (val: string) => void;
  handleFlushDB: () => void;
  flushing: boolean;
}

const FlushDBModal: React.FC<FlushDBModalProps> = ({
  isFlushModalOpen,
  setIsFlushModalOpen,
  flushAction,
  flushPassword,
  setFlushPassword,
  handleFlushDB,
  flushing
}) => {
  if (!isFlushModalOpen) return null;

  return (
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
  );
};

export default FlushDBModal;
