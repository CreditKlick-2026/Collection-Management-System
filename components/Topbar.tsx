"use client";
import React, { useState, useEffect } from 'react';

interface TopbarProps {
  user: any;
  activePage: string;
  logout: () => void;
}

const Topbar: React.FC<TopbarProps> = ({ user, activePage, logout }) => {
  const [time, setTime] = useState('--:--:--');
  const [theme, setTheme] = useState<'dark' | 'light'>('dark');

  useEffect(() => {
    // Check local storage for theme
    const savedTheme = localStorage.getItem('theme') as 'dark' | 'light' | null;
    if (savedTheme) {
      setTheme(savedTheme);
      document.documentElement.setAttribute('data-theme', savedTheme);
    } else {
      document.documentElement.setAttribute('data-theme', 'dark');
    }

    const updateTime = () => {
      const now = new Date();
      setTime(now.toLocaleTimeString('en-US', { hour12: false }));
    };
    updateTime();
    const interval = setInterval(updateTime, 1000);
    return () => clearInterval(interval);
  }, []);

  const toggleTheme = () => {
    const newTheme = theme === 'dark' ? 'light' : 'dark';
    setTheme(newTheme);
    localStorage.setItem('theme', newTheme);
    document.documentElement.setAttribute('data-theme', newTheme);
  };

  return (
    <div className="topbar">
      <div className="tb-logo">
        <img src="/logo.png" alt="CMS Logo" style={{ height: '28px', marginRight: '10px' }} />
        Collection Management System
      </div>
      <span className="badge acc" style={{ textTransform: 'capitalize' }}>{activePage}</span>
      <span className="badge grn" id="tb-total">Total Leads: 250</span>
      <span className="badge amb" id="tb-pending" style={{ display: 'none', cursor: 'pointer' }}>⏳ Pending Reviews</span>
      
      <div className="tb-ml">
        <button onClick={toggleTheme} className="btn sm" style={{ padding: '4px 8px', fontSize: '14px', background: 'transparent', border: '1px solid var(--bdr)' }}>
          {theme === 'dark' ? '☀️' : '🌙'}
        </button>
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
