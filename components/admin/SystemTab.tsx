import React from 'react';

export default function SystemTab({
  setFlushAction,
  setIsFlushModalOpen,
  cleanupMonth,
  setCleanupMonth,
  cleanupYear,
  setCleanupYear
}: {
  setFlushAction: (action: 'all' | 'audit' | 'selective') => void;
  setIsFlushModalOpen: (open: boolean) => void;
  cleanupMonth: number;
  setCleanupMonth: (month: number) => void;
  cleanupYear: number;
  setCleanupYear: (year: number) => void;
}) {
  return (
    <div style={{ width: '100%' }}>
      {/* Top Stats */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 15, marginBottom: 25 }}>
        <div className="card" style={{ background: 'var(--bg2)', border: '1px solid var(--bdr)', padding: '16px 20px' }}>
          <div style={{ fontSize: 10, fontWeight: 700, color: 'var(--txt3)', letterSpacing: 0.5, marginBottom: 5, textTransform: 'uppercase' }}>STATUS</div>
          <div style={{ fontSize: 22, fontWeight: 800, color: 'var(--grn)' }}>Online</div>
        </div>
        <div className="card" style={{ background: 'var(--bg2)', border: '1px solid var(--bdr)', padding: '16px 20px' }}>
          <div style={{ fontSize: 10, fontWeight: 700, color: 'var(--txt3)', letterSpacing: 0.5, marginBottom: 5, textTransform: 'uppercase' }}>DATABASE</div>
          <div style={{ fontSize: 20, fontWeight: 700, color: 'var(--txt)' }}>PostgreSQL 15.0</div>
        </div>
        <div className="card" style={{ background: 'var(--bg2)', border: '1px solid var(--bdr)', padding: '16px 20px' }}>
          <div style={{ fontSize: 10, fontWeight: 700, color: 'var(--txt3)', letterSpacing: 0.5, marginBottom: 5, textTransform: 'uppercase' }}>LAST BACKUP</div>
          <div style={{ fontSize: 20, fontWeight: 700, color: 'var(--txt)' }}>2h ago</div>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 0.8fr', gap: 20 }}>
        <div className="card" style={{ background: 'var(--bg2)', border: '1px solid var(--bdr)', padding: '24px' }}>
          <div style={{ fontSize: 14, fontWeight: 700, color: 'var(--acc2)', marginBottom: 20 }}>Maintenance & Cleanup</div>
          <div style={{ background: 'rgba(79,125,255,0.04)', border: '1px solid rgba(79,125,255,0.15)', borderRadius: 10, padding: '20px', display: 'flex', flexDirection: 'column', gap: 15 }}>
            <div>
              <div style={{ fontSize: 13, fontWeight: 700, color: 'var(--acc2)', display: 'flex', alignItems: 'center', gap: 8 }}>🧹 Clear Audit Logs</div>
              <div style={{ fontSize: 11, color: 'var(--txt3)', marginTop: 5, lineHeight: 1.5 }}>This will remove all system audit logs. Leads and payments will be preserved.</div>
            </div>
            <button className="btn" style={{ background: 'rgba(79,125,255,0.1)', color: 'var(--acc2)', border: '1px solid rgba(79,125,255,0.2)', padding: '10px', fontSize: 12, fontWeight: 600 }} onClick={() => {
              setFlushAction('audit');
              setIsFlushModalOpen(true);
            }}>Clear Audit Logs</button>
          </div>

          <div style={{ background: 'rgba(245,166,35,0.04)', border: '1px solid rgba(245,166,35,0.15)', borderRadius: 10, padding: '20px', display: 'flex', flexDirection: 'column', gap: 15, marginTop: 20 }}>
            <div>
              <div style={{ fontSize: 13, fontWeight: 700, color: 'var(--amb)', display: 'flex', alignItems: 'center', gap: 8 }}>📅 Selective Lead Cleanup</div>
              <div style={{ fontSize: 11, color: 'var(--txt3)', marginTop: 5, lineHeight: 1.5 }}>Delete leads by Month/Year. <b>Leads with payment records will NOT be deleted.</b></div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
              <div className="ff">
                <select className="finp" style={{ height: 38, fontSize: 12 }} value={cleanupMonth} onChange={e => setCleanupMonth(Number(e.target.value))}>
                  {['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'].map((m, i) => (
                    <option key={m} value={i + 1}>{m}</option>
                  ))}
                </select>
              </div>
              <div className="ff">
                <select className="finp" style={{ height: 38, fontSize: 12 }} value={cleanupYear} onChange={e => setCleanupYear(Number(e.target.value))}>
                  {[2024, 2025, 2026, 2027].map(y => (
                    <option key={y} value={y}>{y}</option>
                  ))}
                </select>
              </div>
            </div>

            <button className="btn" style={{ background: 'rgba(245,166,35,0.1)', color: 'var(--amb)', border: '1px solid rgba(245,166,35,0.2)', padding: '10px', fontSize: 12, fontWeight: 600 }} onClick={() => {
              setFlushAction('selective');
              setIsFlushModalOpen(true);
            }}>Delete Selected Leads</button>
          </div>
        </div>

        {/* Danger Zone */}
        <div className="card" style={{ background: 'var(--bg2)', border: '1px solid var(--bdr)', padding: '24px' }}>
          <div style={{ fontSize: 14, fontWeight: 700, color: 'var(--red)', marginBottom: 20 }}>Danger Zone</div>
          <div style={{ background: 'rgba(226,75,74,0.04)', border: '1px solid rgba(226,75,74,0.15)', borderRadius: 10, padding: '20px', display: 'flex', flexDirection: 'column', gap: 15 }}>
            <div>
              <div style={{ fontSize: 13, fontWeight: 700, color: 'var(--red)', display: 'flex', alignItems: 'center', gap: 8 }}>⚠ Flush All Data</div>
              <div style={{ fontSize: 11, color: 'var(--txt3)', marginTop: 5, lineHeight: 1.5 }}>This will permanently delete all records including leads, payments, and logs. This action cannot be undone.</div>
            </div>
            <button className="btn" style={{ background: 'rgba(226,75,74,0.1)', color: 'var(--red)', border: '1px solid rgba(226,75,74,0.2)', padding: '10px', fontSize: 12, fontWeight: 600 }} onClick={() => {
              setFlushAction('all');
              setIsFlushModalOpen(true);
            }}>Delete All Data</button>
          </div>
        </div>
      </div>
    </div>
  );
}
