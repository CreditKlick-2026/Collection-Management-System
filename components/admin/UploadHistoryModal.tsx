import React from 'react';

interface UploadHistoryModalProps {
  showHistoryModal: boolean;
  setShowHistoryModal: (val: boolean) => void;
  historyLoading: boolean;
  uploadHistory: any[];
  activeDeleteJob: any;
  deleteProgress: any;
  startDeleteUploadStream: (job: any) => void;
}

const UploadHistoryModal: React.FC<UploadHistoryModalProps> = ({
  showHistoryModal,
  setShowHistoryModal,
  historyLoading,
  uploadHistory,
  activeDeleteJob,
  deleteProgress,
  startDeleteUploadStream
}) => {
  if (!showHistoryModal) return null;

  return (
    <div style={{
      position: 'fixed', inset: 0, zIndex: 9999,
      background: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(6px)',
      display: 'flex', justifyContent: 'center', alignItems: 'center',
      animation: 'fadeIn 0.2s ease'
    }} onClick={() => setShowHistoryModal(false)}>
      <div style={{
        background: 'var(--bg2)', border: '1px solid var(--bdr)', borderRadius: 16,
        width: '90%', maxWidth: 900, maxHeight: '85vh',
        display: 'flex', flexDirection: 'column',
        boxShadow: '0 20px 40px rgba(0,0,0,0.3)', overflow: 'hidden'
      }} onClick={e => e.stopPropagation()}>
        {/* Header */}
        <div style={{
          padding: '20px 24px', borderBottom: '1px solid var(--bdr)',
          display: 'flex', justifyContent: 'space-between', alignItems: 'center',
          background: 'var(--bg3)'
        }}>
          <div>
            <div style={{ fontSize: 16, fontWeight: 800, color: 'var(--txt)' }}>📋 Upload History</div>
            <div style={{ fontSize: 11, color: 'var(--txt3)', marginTop: 2 }}>
              View and manage previous bulk upload jobs
            </div>
          </div>
          <button
            onClick={() => setShowHistoryModal(false)}
            style={{ background: 'var(--bg3)', border: '1px solid var(--bdr)', borderRadius: 8, padding: '6px 14px', fontSize: 12, fontWeight: 700, color: 'var(--txt)', cursor: 'pointer' }}
          >✕ Close</button>
        </div>

        {/* Content */}
        <div style={{ flex: 1, overflowY: 'auto', padding: '0 24px' }}>
          {historyLoading ? (
            <div style={{ padding: 40, textAlign: 'center', color: 'var(--txt3)' }}>Loading...</div>
          ) : uploadHistory.length > 0 ? (
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 12, marginTop: 10 }}>
              <thead>
                <tr style={{ borderBottom: '1px solid var(--bdr)' }}>
                  <th style={{ textAlign: 'left', padding: '12px 8px', color: 'var(--txt3)', fontSize: 10, fontWeight: 800, letterSpacing: 0.8 }}>DATE</th>
                  <th style={{ textAlign: 'left', padding: '12px 8px', color: 'var(--txt3)', fontSize: 10, fontWeight: 800, letterSpacing: 0.8 }}>FILE</th>
                  <th style={{ textAlign: 'left', padding: '12px 8px', color: 'var(--txt3)', fontSize: 10, fontWeight: 800, letterSpacing: 0.8 }}>STATUS</th>
                  <th style={{ textAlign: 'center', padding: '12px 8px', color: 'var(--txt3)', fontSize: 10, fontWeight: 800, letterSpacing: 0.8 }}>IMPORTED</th>
                  <th style={{ textAlign: 'right', padding: '12px 8px', color: 'var(--txt3)', fontSize: 10, fontWeight: 800, letterSpacing: 0.8 }}>ACTIONS</th>
                </tr>
              </thead>
              <tbody>
                {uploadHistory.map((job) => (
                  <tr key={job.id} style={{ borderBottom: '1px solid rgba(255,255,255,0.03)' }}>
                    <td style={{ padding: '10px 8px', color: 'var(--txt3)' }}>
                      {new Date(job.createdAt).toLocaleString()}
                    </td>
                    <td style={{ padding: '10px 8px', color: 'var(--txt)' }}>
                      <span style={{ fontWeight: 600 }}>{job.fileName || 'Unknown File'}</span>
                    </td>
                    <td style={{ padding: '10px 8px' }}>
                      <span style={{ 
                        background: job.status === 'completed' ? 'rgba(34,197,94,0.1)' : job.status === 'failed' ? 'rgba(239,68,68,0.1)' : 'rgba(245,158,11,0.1)', 
                        color: job.status === 'completed' ? '#22c55e' : job.status === 'failed' ? '#ef4444' : '#f59e0b',
                        padding: '4px 8px', borderRadius: 4, fontSize: 10, fontWeight: 700, textTransform: 'uppercase'
                      }}>
                        {job.status}
                      </span>
                    </td>
                    <td style={{ padding: '10px 8px', textAlign: 'center', color: 'var(--acc2)', fontWeight: 600 }}>
                      {job.successCount} / {job.totalRows}
                    </td>
                    <td style={{ padding: '10px 8px', textAlign: 'right' }}>
                      {activeDeleteJob?.id === job.id ? (
                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: 10 }}>
                          <div style={{ fontSize: 11, color: 'var(--red)' }}>
                            Deleting... {deleteProgress ? `${deleteProgress.deletedRecords}/${deleteProgress.totalRecords}` : ''}
                          </div>
                          <div style={{ width: 80, height: 4, background: 'rgba(239,68,68,0.2)', borderRadius: 2, overflow: 'hidden' }}>
                            <div style={{ height: '100%', background: 'var(--red)', width: deleteProgress?.totalRecords ? `${(deleteProgress.deletedRecords / deleteProgress.totalRecords) * 100}%` : '0%', transition: 'width 0.2s' }}></div>
                          </div>
                        </div>
                      ) : (
                        <button
                          onClick={() => startDeleteUploadStream(job)}
                          style={{ background: 'rgba(239,68,68,0.1)', color: 'var(--red)', border: '1px solid rgba(239,68,68,0.2)', padding: '6px 12px', borderRadius: 6, fontSize: 11, fontWeight: 700, cursor: 'pointer' }}
                        >
                          🗑️ Delete Data
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          ) : (
            <div style={{ padding: 40, textAlign: 'center', color: 'var(--txt3)' }}>
              No upload history found.
            </div>
          )}
        </div>
        
        <div style={{ padding: 16, borderTop: '1px solid var(--bdr)', background: 'var(--bg3)', textAlign: 'center', fontSize: 11, color: 'var(--txt3)' }}>
          Deleting an upload will permanently remove all records imported during that specific job.
        </div>
      </div>
    </div>
  );
};

export default UploadHistoryModal;
