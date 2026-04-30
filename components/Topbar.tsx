"use client";
import React, { useState, useEffect } from 'react';

interface TopbarProps {
  user: any;
  activePage: string;
  logout: () => void;
}

const Topbar: React.FC<TopbarProps> = ({ user, activePage, logout }) => {
  const [time, setTime] = useState('--:--:--');

  useEffect(() => {
    const updateTime = () => {
      const now = new Date();
      setTime(now.toLocaleTimeString('en-US', { hour12: false }));
    };
    updateTime();
    const interval = setInterval(updateTime, 1000);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="topbar">
      <div className="tb-logo"><div className="tb-sq">DR</div>DebtRecover Pro</div>
      <span className="badge acc" style={{ textTransform: 'capitalize' }}>{activePage}</span>
      <span className="badge grn" id="tb-total">Total Leads: 250</span>
      <span className="badge amb" id="tb-pending" style={{ display: 'none', cursor: 'pointer' }}>⏳ Pending Reviews</span>
      
      <div className="tb-ml">
        <div style={{ fontFamily: 'monospace', fontSize: '11px', color: 'var(--txt3)', background: 'var(--bg3)', padding: '2px 8px', borderRadius: '4px' }}>
          {time}
        </div>
        <span className="badge amb" style={{ textTransform: 'capitalize' }}>{user?.role}</span>
        <div className="av">{user?.initials || user?.name?.split(' ').map((n:any)=>n[0]).join('').substring(0,2).toUpperCase() || '--'}</div>
        <span style={{ fontSize: '12px', color: 'var(--txt2)' }}>{user?.name}</span>
        <button className="btn sm dn" onClick={() => {
          if (confirm('Are you sure you want to logout?')) {
            logout();
          }
        }}>⮐ Logout</button>
      </div>
    </div>
  );
};

export default Topbar;
