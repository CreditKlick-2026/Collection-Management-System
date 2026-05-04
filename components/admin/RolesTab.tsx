import React from 'react';

const RolesTab: React.FC = () => {
  return (
    <div style={{ width: '100%' }}>
      <div style={{ background: 'rgba(79,125,255,0.05)', border: '1px solid rgba(79,125,255,0.2)', padding: '12px 20px', borderRadius: 10, color: 'var(--acc2)', fontSize: 12, marginBottom: 20 }}>
        🛡 <b>Role-based access matrix.</b> This view is read-only and shows which features are available to each role.
      </div>

      <div className="card" style={{ padding: 0, overflow: 'hidden', background: 'var(--bg2)', border: '1px solid var(--bdr)', borderRadius: 12 }}>
        <div style={{ overflowX: 'auto' }}>
          <table className="tbl" style={{ borderCollapse: 'collapse', width: '100%' }}>
            <thead>
              <tr style={{ background: 'rgba(255,255,255,0.02)', borderBottom: '1px solid var(--bdr)' }}>
                <th style={{ padding: '16px 20px', color: 'var(--txt3)', fontSize: 10, textTransform: 'uppercase', letterSpacing: 1, textAlign: 'left', width: '40%' }}>Feature</th>
                <th style={{ padding: '16px 20px', color: 'var(--txt3)', fontSize: 10, textTransform: 'uppercase', letterSpacing: 1, textAlign: 'center' }}>Admin</th>
                <th style={{ padding: '16px 20px', color: 'var(--txt3)', fontSize: 10, textTransform: 'uppercase', letterSpacing: 1, textAlign: 'center' }}>Manager</th>
                <th style={{ padding: '16px 20px', color: 'var(--txt3)', fontSize: 10, textTransform: 'uppercase', letterSpacing: 1, textAlign: 'center' }}>Agent</th>
              </tr>
            </thead>
            <tbody>
              {[
                { f: 'View Dashboard', a: true, m: true, g: true },
                { f: 'View All Leads', a: true, m: true, g: true },
                { f: 'Edit Customer', a: true, m: true, g: true },
                { f: 'Log Calls', a: true, m: true, g: true },
                { f: 'Create PTP', a: true, m: true, g: true },
                { f: 'Record Payment (Pending Approval)', a: true, m: true, g: true },
                { f: 'Approve/Reject Payments', a: true, m: true, g: false },
                { f: 'Bulk Upload', a: true, m: true, g: false },
                { f: 'Column Config', a: true, m: false, g: false },
                { f: 'Admin Panel', a: true, m: false, g: false },
                { f: 'Manager Panel', a: true, m: true, g: false },
                { f: 'Portfolio Assignment', a: true, m: false, g: false },
                { f: 'Lists Config (Modes/Statuses)', a: true, m: false, g: false },
                { f: 'Audit Logs', a: true, m: false, g: false },
              ].map((row, i) => (
                <tr key={row.f} style={{ borderBottom: '1px solid rgba(255,255,255,0.03)', background: i % 2 === 0 ? 'transparent' : 'rgba(255,255,255,0.01)' }}>
                  <td style={{ padding: '14px 20px', fontSize: 13, color: 'var(--txt2)' }}>{row.f}</td>
                  <td style={{ padding: '14px 20px', textAlign: 'center' }}>
                    {row.a ? <span style={{ color: 'var(--grn)', fontSize: 16 }}>✓</span> : <span style={{ color: 'var(--red)', fontSize: 14, opacity: 0.5 }}>✕</span>}
                  </td>
                  <td style={{ padding: '14px 20px', textAlign: 'center' }}>
                    {row.m ? <span style={{ color: 'var(--grn)', fontSize: 16 }}>✓</span> : <span style={{ color: 'var(--red)', fontSize: 14, opacity: 0.5 }}>✕</span>}
                  </td>
                  <td style={{ padding: '14px 20px', textAlign: 'center' }}>
                    {row.g ? <span style={{ color: 'var(--grn)', fontSize: 16 }}>✓</span> : <span style={{ color: 'var(--red)', fontSize: 14, opacity: 0.5 }}>✕</span>}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default RolesTab;
