import React from 'react';

interface SkippedRecordsModalProps {
  showSkipped: boolean;
  setShowSkipped: (val: boolean) => void;
  skippedData: any;
  skippedLoading: boolean;
  activeJob: any;
  skippedPage: number;
  fetchSkippedRecords: (jobId: string, page: number) => void;
}

const SkippedRecordsModal: React.FC<SkippedRecordsModalProps> = ({
  showSkipped,
  setShowSkipped,
  skippedData,
  skippedLoading,
  activeJob,
  skippedPage,
  fetchSkippedRecords
}) => {
  if (!showSkipped) return null;

  return (
    <div style={{
      position: 'fixed', inset: 0, zIndex: 9999,
      background: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(6px)',
      display: 'flex', justifyContent: 'center', alignItems: 'center',
      animation: 'fadeIn 0.2s ease'
    }} onClick={() => setShowSkipped(false)}>
      <div style={{
        background: 'var(--bg2)', border: '1px solid var(--bdr)',
        borderRadius: 16, width: '90%', maxWidth: 800, maxHeight: '80vh',
        display: 'flex', flexDirection: 'column', overflow: 'hidden',
        animation: 'scaleIn 0.2s ease'
      }} onClick={e => e.stopPropagation()}>
        {/* Header */}
        <div style={{
          padding: '20px 24px', borderBottom: '1px solid var(--bdr)',
          display: 'flex', justifyContent: 'space-between', alignItems: 'center'
        }}>
          <div>
            <div style={{ fontSize: 16, fontWeight: 800, color: '#f59e0b' }}>⚠ Skipped Records</div>
            <div style={{ fontSize: 11, color: 'var(--txt3)', marginTop: 2 }}>
              {skippedData?.pagination?.total ?? 0} records were skipped during this upload
            </div>
          </div>
          <button
            onClick={() => setShowSkipped(false)}
            style={{ background: 'var(--bg3)', border: '1px solid var(--bdr)', borderRadius: 8, padding: '6px 14px', fontSize: 12, fontWeight: 700, color: 'var(--txt)', cursor: 'pointer' }}
          >✕ Close</button>
        </div>

        {/* Table */}
        <div style={{ flex: 1, overflowY: 'auto', padding: '0 24px' }}>
          {skippedLoading ? (
            <div style={{ padding: 40, textAlign: 'center', color: 'var(--txt3)' }}>Loading...</div>
          ) : skippedData?.records?.length ? (
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 12 }}>
              <thead>
                <tr style={{ borderBottom: '1px solid var(--bdr)' }}>
                  <th style={{ textAlign: 'left', padding: '12px 8px', color: 'var(--txt3)', fontSize: 10, fontWeight: 800, letterSpacing: 0.8 }}>#</th>
                  <th style={{ textAlign: 'left', padding: '12px 8px', color: 'var(--txt3)', fontSize: 10, fontWeight: 800, letterSpacing: 0.8 }}>ACCOUNT NO</th>
                  <th style={{ textAlign: 'left', padding: '12px 8px', color: 'var(--txt3)', fontSize: 10, fontWeight: 800, letterSpacing: 0.8 }}>NAME</th>
                  <th style={{ textAlign: 'left', padding: '12px 8px', color: 'var(--txt3)', fontSize: 10, fontWeight: 800, letterSpacing: 0.8 }}>REASON</th>
                </tr>
              </thead>
              <tbody>
                {skippedData.records.map((r: any, i: number) => (
                  <tr key={i} style={{ borderBottom: '1px solid rgba(255,255,255,0.03)' }}>
                    <td style={{ padding: '10px 8px', color: 'var(--txt3)', fontVariantNumeric: 'tabular-nums' }}>
                      {((skippedData.pagination.page - 1) * skippedData.pagination.limit) + i + 1}
                    </td>
                    <td style={{ padding: '10px 8px', color: 'var(--acc2)', fontFamily: 'monospace', fontWeight: 600 }}>
                      {r.account_no}
                    </td>
                    <td style={{ padding: '10px 8px', color: 'var(--txt)' }}>{r.name}</td>
                    <td style={{ padding: '10px 8px', color: '#f59e0b', fontSize: 11 }}>{r.reason}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          ) : (
            <div style={{ padding: 40, textAlign: 'center', color: 'var(--txt3)' }}>
              No skipped records found. Data may have been cleared after 1 hour.
            </div>
          )}
        </div>

        {/* Pagination */}
        {skippedData?.pagination && skippedData.pagination.totalPages > 1 && (
          <div style={{
            padding: '14px 24px', borderTop: '1px solid var(--bdr)',
            display: 'flex', justifyContent: 'space-between', alignItems: 'center'
          }}>
            <div style={{ fontSize: 11, color: 'var(--txt3)' }}>
              Page {skippedData.pagination.page} of {skippedData.pagination.totalPages}
              &nbsp;·&nbsp;{skippedData.pagination.total} total
            </div>
            <div style={{ display: 'flex', gap: 6 }}>
              <button
                disabled={!skippedData.pagination.hasPrev}
                onClick={() => activeJob?.id && fetchSkippedRecords(activeJob.id, skippedPage - 1)}
                style={{
                  background: skippedData.pagination.hasPrev ? 'var(--accbg)' : 'var(--bg3)',
                  color: skippedData.pagination.hasPrev ? 'var(--acc2)' : 'var(--txt3)',
                  border: '1px solid var(--bdr)', borderRadius: 6,
                  padding: '5px 14px', fontSize: 11, fontWeight: 700, cursor: skippedData.pagination.hasPrev ? 'pointer' : 'not-allowed'
                }}
              >← Prev</button>
              <button
                disabled={!skippedData.pagination.hasNext}
                onClick={() => activeJob?.id && fetchSkippedRecords(activeJob.id, skippedPage + 1)}
                style={{
                  background: skippedData.pagination.hasNext ? 'var(--accbg)' : 'var(--bg3)',
                  color: skippedData.pagination.hasNext ? 'var(--acc2)' : 'var(--txt3)',
                  border: '1px solid var(--bdr)', borderRadius: 6,
                  padding: '5px 14px', fontSize: 11, fontWeight: 700, cursor: skippedData.pagination.hasNext ? 'pointer' : 'not-allowed'
                }}
              >Next →</button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default SkippedRecordsModal;
