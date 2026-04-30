"use client";
import React, { useState, useEffect } from 'react';
import { useApp } from '@/context/AppContext';

const ManagerPanel = () => {
  const { toast } = useApp();
  const [activeTab, setActiveTab] = useState('team');
  const [team, setTeam] = useState<any[]>([]);

  useEffect(() => {
    fetchTeam();
  }, []);

  const fetchTeam = async () => {
    try {
      const res = await fetch('/api/admin/users');
      if (res.ok) {
        const data = await res.json();
        // Just filter for agents to show in manager panel
        setTeam(data.filter((u: any) => u.role === 'agent' && u.active));
      }
    } catch (e) {
      console.error(e);
    }
  };

  const reportAccess = ['call_summary', 'ptp_summary', 'payment_summary', 'team_performance', 'portfolio_aging', 'dispute_summary'];
  const labels: any = {
    call_summary: 'Call Summary', ptp_summary: 'PTP Summary', payment_summary: 'Payment Summary', 
    team_performance: 'Team Performance', portfolio_aging: 'Portfolio Aging', dispute_summary: 'Dispute Summary'
  };

  return (
    <div id="pg-manager" className="page on">
      <div className="ph">
        <div>
          <div className="ph-t">📊 Manager Panel</div>
          <div className="ph-s">Team management and reports</div>
        </div>
      </div>
      <div className="page-body">
        <div className="tabs">
          <div className={`tab ${activeTab === 'team' ? 'on' : ''}`} onClick={() => setActiveTab('team')}>👥 Team</div>
          <div className={`tab ${activeTab === 'upload' ? 'on' : ''}`} onClick={() => setActiveTab('upload')}>↑ Upload</div>
          <div className={`tab ${activeTab === 'reports' ? 'on' : ''}`} onClick={() => setActiveTab('reports')}>📊 Reports</div>
        </div>

        {activeTab === 'team' && (
          <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
            <div style={{ overflowX: 'auto' }}>
              <table className="tbl">
                <thead>
                  <tr>
                    <th>Agent</th>
                    <th>Emp ID</th>
                    <th>Portfolio</th>
                    <th>Assigned</th>
                    <th>Status</th>
                  </tr>
                </thead>
                <tbody>
                  {team.map(a => (
                    <tr key={a.id}>
                      <td>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 7 }}>
                          <div style={{ width: 26, height: 26, borderRadius: '50%', background: 'var(--accbg)', color: 'var(--acc2)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 9, fontWeight: 700 }}>{a.initials}</div>
                          <span className="nm">{a.name}</span>
                        </div>
                      </td>
                      <td className="mn">{a.empId}</td>
                      <td style={{ fontSize: 11, color: 'var(--pur)' }}>{a.portfolios}</td>
                      <td className="mn" style={{ color: 'var(--acc2)' }}>{a.assigned_count}</td>
                      <td><span className="badge grn">Active</span></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {activeTab === 'upload' && (
          <div>
            <div className="info-box blue">Upload customer allocations.</div>
            <label style={{ border: '2px dashed var(--bdr2)', borderRadius: 9, padding: 20, textAlign: 'center', cursor: 'pointer', display: 'block', color: 'var(--txt3)', marginBottom: 12 }}>
              <input type="file" style={{ display: 'none' }} onChange={(e) => toast(`File: ${e.target.files?.[0]?.name}`)} />
              <div style={{ fontSize: 22, marginBottom: 6 }}>↑</div>
              <div style={{ fontSize: 12, fontWeight: 600, color: 'var(--txt2)' }}>Click to select .CSV or .XLSX</div>
            </label>
            <div style={{ display: 'flex', gap: 8 }}>
              <button className="btn pr" onClick={() => toast('Upload started...')}>↑ Upload</button>
              <button className="btn gn" onClick={() => toast('Sample downloaded ✓')}>↓ Sample</button>
            </div>
          </div>
        )}

        {activeTab === 'reports' && (
          <div className="g2">
            {reportAccess.map(k => (
              <div key={k} className="card" style={{ cursor: 'pointer' }}>
                <div style={{ fontSize: 13, fontWeight: 500, color: 'var(--txt)', marginBottom: 4 }}>{labels[k] || k}</div>
                <div style={{ display: 'flex', gap: 6, marginTop: 8 }}>
                  <button className="btn sm pr" onClick={() => toast('Generating...')}>View</button>
                  <button className="btn sm" onClick={() => toast('Exporting...')}>Export CSV</button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default ManagerPanel;
