import React from 'react';

interface AdminProgressBarsProps {
  activeJob: any;
  totalCustomers: number | null;
  setActiveJob: (val: any) => void;
  setTotalCustomers: (val: any) => void;
  setSkippedPage: (val: number) => void;
  setShowSkipped: (val: boolean) => void;
  fetchSkippedRecords: (jobId: string, page: number) => void;
  activeDeleteJob: any;
  setActiveDeleteJob: (val: any) => void;
  deleteProgress: any;
  setDeleteProgress: (val: any) => void;
}

const AdminProgressBars: React.FC<AdminProgressBarsProps> = ({
  activeJob,
  totalCustomers,
  setActiveJob,
  setTotalCustomers,
  setSkippedPage,
  setShowSkipped,
  fetchSkippedRecords,
  activeDeleteJob,
  setActiveDeleteJob,
  deleteProgress,
  setDeleteProgress
}) => {
  return (
    <>
      {/* Sticky Progress Bar for Background Jobs */}
      {activeJob && (
        <div style={{
          position: 'sticky', top: 0, zIndex: 1000,
          background: activeJob.status === 'completed' ? 'rgba(34,197,94,0.08)' : activeJob.status === 'failed' ? 'rgba(226,75,74,0.08)' : 'var(--bg2)',
          borderBottom: `1px solid ${activeJob.status === 'completed' ? 'rgba(34,197,94,0.3)' : activeJob.status === 'failed' ? 'rgba(226,75,74,0.3)' : 'var(--bdr)'}`,
          padding: '12px 20px', backdropFilter: 'blur(10px)'
        }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
              <div style={{ fontSize: 20 }}>
                {activeJob.status === 'completed' ? '✅' : activeJob.status === 'failed' ? '❌' : '⏳'}
              </div>
              <div>
                <div style={{ fontSize: 13, fontWeight: 800, color: 'var(--txt)' }}>
                  {activeJob.status === 'completed' ? 'Upload Completed' : activeJob.status === 'failed' ? 'Upload Failed' : 'Processing Bulk Upload...'}
                </div>
                <div style={{ fontSize: 10, color: 'var(--txt3)', marginTop: 2 }}>
                  {activeJob.fileName} &nbsp;·&nbsp;
                  <span style={{ color: 'var(--acc2)', fontWeight: 600 }}>{activeJob.processedRows}</span> of <span style={{ fontWeight: 600 }}>{activeJob.totalRows}</span> rows processed
                </div>
              </div>
            </div>

            <div style={{ display: 'flex', gap: 16, alignItems: 'center' }}>
              {/* Live DB count — the real number */}
              {totalCustomers !== null && (
                <div style={{ textAlign: 'right', borderRight: '1px solid var(--bdr)', paddingRight: 16 }}>
                  <div style={{ fontSize: 9, fontWeight: 800, color: 'var(--txt3)', letterSpacing: 1 }}>TOTAL IN DB</div>
                  <div style={{ fontSize: 18, fontWeight: 900, color: 'var(--txt)', fontVariantNumeric: 'tabular-nums' }}>
                    {totalCustomers.toLocaleString('en-IN')}
                  </div>
                </div>
              )}
              <div style={{ textAlign: 'right' }}>
                <div style={{ fontSize: 9, fontWeight: 800, color: '#2ecca7', letterSpacing: 1 }}>NEW</div>
                <div style={{ fontSize: 18, fontWeight: 900, color: '#2ecca7', fontVariantNumeric: 'tabular-nums' }}>{activeJob.successCount ?? 0}</div>
              </div>
              <div style={{ textAlign: 'right' }}>
                <div style={{ fontSize: 9, fontWeight: 800, color: 'var(--acc2)', letterSpacing: 1 }}>UPDATED</div>
                <div style={{ fontSize: 18, fontWeight: 900, color: 'var(--acc2)', fontVariantNumeric: 'tabular-nums' }}>{activeJob.updatedCount ?? 0}</div>
              </div>
              <div style={{ textAlign: 'right', cursor: (activeJob.skippedCount ?? 0) > 0 ? 'pointer' : 'default' }}
                onClick={() => {
                  if ((activeJob.skippedCount ?? 0) > 0 && activeJob.id) {
                    setSkippedPage(1);
                    setShowSkipped(true);
                    fetchSkippedRecords(activeJob.id, 1);
                  }
                }}
                title={(activeJob.skippedCount ?? 0) > 0 ? 'Click to view skipped records' : ''}
              >
                <div style={{ fontSize: 9, fontWeight: 800, color: (activeJob.skippedCount ?? 0) > 0 ? '#f59e0b' : 'var(--txt3)', letterSpacing: 1 }}>SKIPPED</div>
                <div style={{ fontSize: 16, fontWeight: 800, fontVariantNumeric: 'tabular-nums', color: (activeJob.skippedCount ?? 0) > 0 ? '#f59e0b' : 'inherit', textDecoration: (activeJob.skippedCount ?? 0) > 0 ? 'underline' : 'none' }}>{activeJob.skippedCount ?? 0}</div>
              </div>
              <div style={{ textAlign: 'right' }}>
                <div style={{ fontSize: 9, fontWeight: 800, color: activeJob.errorCount > 0 ? 'var(--red)' : 'var(--txt3)', letterSpacing: 1 }}>ERRORS</div>
                <div style={{ fontSize: 16, fontWeight: 800, color: activeJob.errorCount > 0 ? 'var(--red)' : 'inherit', fontVariantNumeric: 'tabular-nums' }}>{activeJob.errorCount ?? 0}</div>
              </div>
              {(activeJob.status === 'completed' || activeJob.status === 'failed') && (
                <button onClick={() => { setActiveJob(null); setTotalCustomers(null); }} style={{ background: 'var(--bg3)', border: '1px solid var(--bdr)', padding: '5px 12px', borderRadius: 6, fontSize: 11, fontWeight: 700, color: 'var(--txt)' }}>Close</button>
              )}
            </div>
          </div>

          {/* Progress bar */}
          <div style={{ height: 5, background: 'rgba(255,255,255,0.05)', borderRadius: 3, overflow: 'hidden' }}>
            <div style={{
              height: '100%',
              background: activeJob.status === 'completed' ? '#22c55e' : activeJob.status === 'failed' ? 'var(--red)' : 'var(--acc)',
              width: `${activeJob.totalRows > 0 ? (activeJob.processedRows / activeJob.totalRows) * 100 : 0}%`,
              transition: 'width 0.4s ease-out'
            }} />
          </div>
        </div>
      )}
      
      {/* Sticky Progress Bar for Background Delete Jobs */}
      {activeDeleteJob && (
        <div style={{
          position: 'sticky', top: 0, zIndex: 1000,
          background: activeDeleteJob._done ? 'rgba(34,197,94,0.08)' : 'rgba(239,68,68,0.08)',
          borderBottom: `1px solid ${activeDeleteJob._done ? 'rgba(34,197,94,0.3)' : 'rgba(239,68,68,0.3)'}`,
          padding: '12px 20px', backdropFilter: 'blur(10px)'
        }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
              <div style={{ fontSize: 20 }}>
                {activeDeleteJob._done ? '✅' : '🗑️'}
              </div>
              <div>
                <div style={{ fontSize: 13, fontWeight: 800, color: 'var(--txt)' }}>
                  {activeDeleteJob._done ? 'Delete Completed' : 'Deleting Bulk Upload...'}
                </div>
                <div style={{ fontSize: 10, color: 'var(--txt3)', marginTop: 2 }}>
                  {activeDeleteJob.fileName || 'Unknown File'} &nbsp;·&nbsp;
                  <span style={{ color: 'var(--red)', fontWeight: 600 }}>{deleteProgress?.deletedRecords || 0}</span> of <span style={{ fontWeight: 600 }}>{deleteProgress?.totalRecords || 0}</span> records permanently removed
                </div>
              </div>
            </div>

            <div style={{ display: 'flex', gap: 16, alignItems: 'center' }}>
              <div style={{ textAlign: 'right' }}>
                <div style={{ fontSize: 9, fontWeight: 800, color: 'var(--red)', letterSpacing: 1 }}>DELETED</div>
                <div style={{ fontSize: 18, fontWeight: 900, color: 'var(--red)', fontVariantNumeric: 'tabular-nums' }}>{deleteProgress?.deletedRecords || 0}</div>
              </div>
              {activeDeleteJob._done && (
                <button onClick={() => { setActiveDeleteJob(null); setDeleteProgress(null); }} style={{ background: 'var(--bg3)', border: '1px solid var(--bdr)', padding: '5px 12px', borderRadius: 6, fontSize: 11, fontWeight: 700, color: 'var(--txt)' }}>Close</button>
              )}
            </div>
          </div>

          {/* Progress bar */}
          <div style={{ height: 5, background: 'rgba(255,255,255,0.05)', borderRadius: 3, overflow: 'hidden' }}>
            <div style={{
              height: '100%',
              background: activeDeleteJob._done ? '#22c55e' : 'var(--red)',
              width: `${(deleteProgress?.totalRecords || 0) > 0 ? ((deleteProgress?.deletedRecords || 0) / deleteProgress!.totalRecords) * 100 : 0}%`,
              transition: 'width 0.4s ease-out'
            }} />
          </div>
        </div>
      )}
    </>
  );
};

export default AdminProgressBars;
