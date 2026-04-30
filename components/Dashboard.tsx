"use client";
import React from 'react';

const Dashboard: React.FC = () => {
  return (
    <div className="page on">
      <div className="ph">
        <div>
          <div className="ph-t">▣ Dashboard</div>
          <div className="ph-s">Recovery center overview</div>
        </div>
      </div>
      <div className="page-body">
        <div className="g4" style={{ marginBottom: 14 }}>
          <div className="kpi">
            <div className="kpi-l">Collected Today</div>
            <div className="kpi-v" style={{ color: 'var(--grn)' }}>₹24,810</div>
          </div>
          <div className="kpi">
            <div className="kpi-l">Calls Made</div>
            <div className="kpi-v">312</div>
          </div>
          <div className="kpi">
            <div className="kpi-l">Contact Rate</div>
            <div className="kpi-v">64%</div>
            <div className="prog"><div className="prog-f" style={{ width: '64%', background: 'var(--acc)' }}></div></div>
          </div>
          <div className="kpi">
            <div className="kpi-l">Promise to Pay</div>
            <div className="kpi-v" style={{ color: 'var(--amb)' }}>₹61,430</div>
          </div>
        </div>
        
        <div className="g2">
          <div className="card">
            <div style={{ fontSize: 12, fontWeight: 600, color: 'var(--txt)', marginBottom: 10 }}>Call Outcomes Today</div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 7 }}>
              <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 11, marginBottom: 3 }}>
                  <span style={{ color: 'var(--txt2)' }}>Right Party Contact</span><span>148</span>
                </div>
                <div className="prog"><div className="prog-f" style={{ width: '47%', background: 'var(--grn)' }}></div></div>
              </div>
              <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 11, marginBottom: 3 }}>
                  <span style={{ color: 'var(--txt2)' }}>No Answer</span><span>96</span>
                </div>
                <div className="prog"><div className="prog-f" style={{ width: '31%', background: 'var(--amb)' }}></div></div>
              </div>
              <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 11, marginBottom: 3 }}>
                  <span style={{ color: 'var(--txt2)' }}>Wrong Party</span><span>42</span>
                </div>
                <div className="prog"><div className="prog-f" style={{ width: '13%', background: 'var(--red)' }}></div></div>
              </div>
            </div>
          </div>
          
          <div className="card">
            <div style={{ fontSize: 12, fontWeight: 600, color: 'var(--txt)', marginBottom: 10 }}>Portfolio Performance</div>
            <table className="tbl">
              <thead>
                <tr>
                  <th>Portfolio</th>
                  <th>Penetration</th>
                  <th>Collected</th>
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td className="nm">Retail CC</td>
                  <td><div className="prog" style={{ width: 60, marginTop: 0 }}><div className="prog-f" style={{ width: '78%', background: 'var(--acc)' }}></div></div></td>
                  <td className="mn" style={{ color: 'var(--grn)' }}>₹1.2L</td>
                </tr>
                <tr>
                  <td className="nm">Auto Loans</td>
                  <td><div className="prog" style={{ width: 60, marginTop: 0 }}><div className="prog-f" style={{ width: '45%', background: 'var(--amb)' }}></div></div></td>
                  <td className="mn" style={{ color: 'var(--grn)' }}>₹85K</td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
