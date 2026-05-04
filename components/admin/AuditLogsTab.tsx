import React from 'react';

interface AuditLogsTabProps {
  auditLogs: any[];
}

const AuditLogsTab: React.FC<AuditLogsTabProps> = ({ auditLogs }) => {
  return (
    <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
      <div style={{ overflowX: 'auto' }}>
        <table className="tbl">
          <thead>
            <tr>
              <th>Timestamp</th>
              <th>User</th>
              <th>Action</th>
              <th>Entity</th>
              <th>Details</th>
            </tr>
          </thead>
          <tbody>
            {auditLogs.map((log: any) => (
              <tr key={log.id}>
                <td className="mn" style={{ fontSize: 11, color: 'var(--txt3)' }}>
                  {new Date(log.timestamp).toLocaleString()}
                </td>
                <td>
                  <div style={{ fontSize: 13, fontWeight: 600 }}>{log.user?.name}</div>
                  <div style={{ fontSize: 10, color: 'var(--txt3)' }}>{log.user?.empId}</div>
                </td>
                <td>
                  <span className="badge" style={{
                    background: log.action.includes('REJECTED') ? 'rgba(226,75,74,0.1)' :
                      log.action.includes('APPROVED') ? 'rgba(46,204,138,0.1)' : 'rgba(79,125,255,0.1)',
                    color: log.action.includes('REJECTED') ? 'var(--red)' :
                      log.action.includes('APPROVED') ? 'var(--grn)' : 'var(--acc2)',
                    fontSize: 10
                  }}>
                    {log.action}
                  </span>
                </td>
                <td>
                  <div style={{ fontSize: 12 }}>{log.entityType}</div>
                  <div style={{ fontSize: 10, color: 'var(--txt3)' }}>ID: {log.entityId}</div>
                </td>
                <td style={{ fontSize: 11, color: 'var(--txt2)', maxWidth: 300, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                  {JSON.stringify(log.details)}
                </td>
              </tr>
            ))}
            {auditLogs.length === 0 && (
              <tr><td colSpan={5} style={{ textAlign: 'center', padding: 40, color: 'var(--txt3)' }}>No audit logs found.</td></tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default AuditLogsTab;
