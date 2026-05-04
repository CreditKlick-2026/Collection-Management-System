import React from 'react';

interface ReportsTabProps {
  toast: (msg: string) => void;
}

const ReportsTab: React.FC<ReportsTabProps> = ({ toast }) => {
  return (
    <div style={{ width: '100%' }}>
      <div style={{ background: 'rgba(245,166,35,0.08)', border: '1px solid rgba(245,166,35,0.2)', padding: '12px 20px', borderRadius: 10, color: 'var(--amb)', fontSize: 12, marginBottom: 20 }}>
        📊 <b>Admin controls which reports each role can access.</b> Changes will be applied to all users in that role.
      </div>

      <div className="card" style={{ padding: 0, overflow: 'hidden', background: 'var(--bg2)', border: '1px solid var(--bdr)', borderRadius: 12 }}>
        <div style={{ overflowX: 'auto' }}>
          <table className="tbl" style={{ borderCollapse: 'collapse', width: '100%' }}>
            <thead>
              <tr style={{ background: 'rgba(255,255,255,0.02)', borderBottom: '1px solid var(--bdr)' }}>
                <th style={{ padding: '16px 20px', color: 'var(--txt3)', fontSize: 10, textTransform: 'uppercase', letterSpacing: 1, textAlign: 'left', width: '30%' }}>Report</th>
                <th style={{ padding: '16px 20px', color: 'var(--txt3)', fontSize: 10, textTransform: 'uppercase', letterSpacing: 1, textAlign: 'left', width: '30%' }}>Description</th>
                <th style={{ padding: '16px 20px', color: 'var(--txt3)', fontSize: 10, textTransform: 'uppercase', letterSpacing: 1, textAlign: 'center' }}>Admin</th>
                <th style={{ padding: '16px 20px', color: 'var(--txt3)', fontSize: 10, textTransform: 'uppercase', letterSpacing: 1, textAlign: 'center' }}>Manager</th>
                <th style={{ padding: '16px 20px', color: 'var(--txt3)', fontSize: 10, textTransform: 'uppercase', letterSpacing: 1, textAlign: 'center' }}>Agent</th>
              </tr>
            </thead>
            <tbody>
              {[
                { r: 'Call Summary', d: 'Call activity', a: true, m: true, g: true },
                { r: 'PTP Summary', d: 'PTP tracking', a: true, m: true, g: true },
                { r: 'Payment Summary', d: 'Collections', a: true, m: true, g: false },
                { r: 'Team Performance', d: 'Agent metrics', a: true, m: true, g: false },
                { r: 'Portfolio Aging', d: 'DPD analysis', a: true, m: false, g: false },
                { r: 'Dispute Summary', d: 'Dispute tracking', a: true, m: false, g: false },
                { r: 'Audit Logs', d: 'Full trail', a: true, m: false, g: false },
                { r: 'System Reports', d: 'Upload history', a: true, m: false, g: false },
              ].map((row, i) => (
                <tr key={row.r} style={{ borderBottom: '1px solid rgba(255,255,255,0.03)', background: i % 2 === 0 ? 'transparent' : 'rgba(255,255,255,0.01)' }}>
                  <td style={{ padding: '14px 20px', fontSize: 13, fontWeight: 700, color: 'var(--txt)' }}>{row.r}</td>
                  <td style={{ padding: '14px 20px', fontSize: 11, color: 'var(--txt3)' }}>{row.d}</td>
                  <td style={{ padding: '14px 20px', textAlign: 'center' }}>
                    <input type="checkbox" checked={row.a} disabled style={{ accentColor: 'var(--acc)' }} />
                  </td>
                  <td style={{ padding: '14px 20px', textAlign: 'center' }}>
                    <input type="checkbox" defaultChecked={row.m} style={{ accentColor: 'var(--acc)' }} />
                  </td>
                  <td style={{ padding: '14px 20px', textAlign: 'center' }}>
                    <input type="checkbox" defaultChecked={row.g} style={{ accentColor: 'var(--acc)' }} />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
      <div style={{ marginTop: 20 }}>
        <button className="btn pr" style={{ padding: '10px 24px', fontSize: 13, borderRadius: 8 }} onClick={() => toast('Report access settings saved ✓')}>✓ Save Settings</button>
      </div>
    </div>
  );
};

export default ReportsTab;
