"use client";
import React, { useState, useEffect } from 'react';

const Dashboard: React.FC = () => {
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState<any>(null);
  const [currentTime, setCurrentTime] = useState(new Date().toLocaleTimeString());
  
  const date = new Date();
  const [month, setMonth] = useState((date.getMonth() + 1).toString());
  const [year, setYear] = useState(date.getFullYear().toString());

  const [lastUpdated, setLastUpdated] = useState<string>('');

  const months = [
    {v:'1',l:'Jan'},{v:'2',l:'Feb'},{v:'3',l:'Mar'},{v:'4',l:'Apr'},{v:'5',l:'May'},{v:'6',l:'Jun'},
    {v:'7',l:'Jul'},{v:'8',l:'Aug'},{v:'9',l:'Sep'},{v:'10',l:'Oct'},{v:'11',l:'Nov'},{v:'12',l:'Dec'}
  ];

  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date().toLocaleTimeString()), 1000);
    return () => clearInterval(timer);
  }, []);

  useEffect(() => {
    console.log('Dashboard: Date filter changed:', { month, year });
    fetchDashboardData();
  }, [month, year]);

  const fetchDashboardData = async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/dashboard?month=${month}&year=${year}`);
      const json = await res.json();
      console.log('Dashboard: Received data:', json);
      setData(json);
      setLastUpdated(new Date().toLocaleTimeString());
    } catch (e) { console.error(e); }
    finally { setLoading(false); }
  };

  const formatAmt = (num: number) => {
    if (!num) return '₹0';
    if (num >= 1000) return `₹${(num / 1000).toFixed(1)}K`;
    return `₹${num.toLocaleString('en-IN')}`;
  };

  const getMonthLabel = () => {
    const label = months.find(m => m.v === month)?.l || '';
    return label;
  };

  return (
    <div className="page on" key={`${month}-${year}`}>
      <div className="ph" style={{ justifyContent: 'space-between', paddingBottom: 20 }}>
        <div>
          <div className="ph-t">▣ Dashboard <span style={{ fontSize: 10, opacity: 0.5 }}>(v1.1)</span></div>
          <div className="ph-s">Recovery center overview • {currentTime} {lastUpdated && `• Last updated: ${lastUpdated}`}</div>
        </div>
        <div style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
          <div style={{ fontSize: 11, color: 'var(--txt3)', marginRight: 10 }}>Total Leads: <b style={{ color: 'var(--txt)' }}>250</b></div>
          <select className="finp" style={{ width: 110 }} value={month} onChange={e => setMonth(e.target.value)}>
            {months.map(m => <option key={m.v} value={m.v}>{m.l}</option>)}
          </select>
          <select className="finp" style={{ width: 80 }} value={year} onChange={e => setYear(e.target.value)}>
            {['2024','2025','2026'].map(y => <option key={y} value={y}>{y}</option>)}
          </select>
        </div>
      </div>

      <div className="page-body">
        {loading || !data ? (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 20 }}>
            {[1,2,3,4].map(i => <div key={i} className="skel" style={{ height: 100, borderRadius: 12 }} />)}
          </div>
        ) : (
          <>
            <div className="g4" style={{ marginBottom: 20 }}>
              <div className="kpi">
                <div className="kpi-l">Collected ({getMonthLabel()})</div>
                <div className="kpi-v" style={{ color: 'var(--grn)' }}>{formatAmt(data.collected)}</div>
              </div>
              <div className="kpi">
                <div className="kpi-l">Calls Made</div>
                <div className="kpi-v">{data.callsMade || 0}</div>
              </div>
              <div className="kpi">
                <div className="kpi-l">Contact Rate</div>
                <div className="kpi-v">{data.contactRate || 0}%</div>
                <div className="prog"><div className="prog-f" style={{ width: `${data.contactRate || 0}%`, background: 'var(--acc)' }}></div></div>
              </div>
              <div className="kpi">
                <div className="kpi-l">Promise to Pay</div>
                <div className="kpi-v" style={{ color: 'var(--amb)' }}>{formatAmt(data.promiseToPay)}</div>
              </div>
            </div>
            
            <div className="g2">
              <div className="card">
                <div style={{ fontSize: 13, fontWeight: 700, color: 'var(--txt)', marginBottom: 15 }}>Call Outcomes ({getMonthLabel()})</div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                  <div className="outcome-row">
                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12, marginBottom: 5 }}>
                      <span style={{ color: 'var(--txt2)' }}>Right Party Contact</span><span style={{ fontWeight: 600 }}>{data.callOutcomes?.rpc || 0}</span>
                    </div>
                    <div className="prog" style={{ height: 6 }}>
                      <div className="prog-f" style={{ width: `${data.callsMade > 0 ? (data.callOutcomes?.rpc / data.callsMade) * 100 : 0}%`, background: 'var(--grn)' }}></div>
                    </div>
                  </div>
                  <div className="outcome-row">
                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12, marginBottom: 5 }}>
                      <span style={{ color: 'var(--txt2)' }}>No Answer</span><span style={{ fontWeight: 600 }}>{data.callOutcomes?.noAnswer || 0}</span>
                    </div>
                    <div className="prog" style={{ height: 6 }}>
                      <div className="prog-f" style={{ width: `${data.callsMade > 0 ? (data.callOutcomes?.noAnswer / data.callsMade) * 100 : 0}%`, background: 'var(--amb)' }}></div>
                    </div>
                  </div>
                  <div className="outcome-row">
                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12, marginBottom: 5 }}>
                      <span style={{ color: 'var(--txt2)' }}>Wrong Party</span><span style={{ fontWeight: 600 }}>{data.callOutcomes?.wrongParty || 0}</span>
                    </div>
                    <div className="prog" style={{ height: 6 }}>
                      <div className="prog-f" style={{ width: `${data.callsMade > 0 ? (data.callOutcomes?.wrongParty / data.callsMade) * 100 : 0}%`, background: 'var(--red)' }}></div>
                    </div>
                  </div>
                </div>
              </div>
              
              <div className="card">
                <div style={{ fontSize: 13, fontWeight: 700, color: 'var(--txt)', marginBottom: 15 }}>Portfolio Performance</div>
                <div style={{ overflowX: 'auto' }}>
                  <table className="tbl">
                    <thead>
                      <tr><th>Portfolio</th><th>Penetration</th><th>Collected</th></tr>
                    </thead>
                    <tbody>
                      {data.portfolios?.map((p: any, i: number) => (
                        <tr key={i}>
                          <td className="nm">{p.name}</td>
                          <td><div className="prog" style={{ width: 60 }}><div className="prog-f" style={{ width: `${p.penetration}%`, background: 'var(--acc)' }}></div></div></td>
                          <td className="mn" style={{ color: 'var(--grn)' }}>{formatAmt(p.collected)}</td>
                        </tr>
                      ))}
                      {(!data.portfolios || data.portfolios.length === 0) && (
                        <tr><td colSpan={3} style={{ textAlign: 'center', padding: 20, color: 'var(--txt3)' }}>No portfolio data</td></tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
};

export default Dashboard;
