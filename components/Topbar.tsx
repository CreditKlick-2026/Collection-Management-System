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
  const [notifications, setNotifications] = useState<any[]>([]);
  const [showNotifs, setShowNotifs] = useState(false);

  const fetchNotifs = async () => {
    try {
      const res = await fetch('/api/notifications');
      if (res.ok) {
        const data = await res.json();
        setNotifications(data);
      }
    } catch (e) {}
  };

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
    const intervalTime = setInterval(updateTime, 1000);
    
    fetchNotifs();
    const intervalNotif = setInterval(fetchNotifs, 30000);

    return () => {
      clearInterval(intervalTime);
      clearInterval(intervalNotif);
    };
  }, []);

  const toggleTheme = () => {
    const newTheme = theme === 'dark' ? 'light' : 'dark';
    setTheme(newTheme);
    localStorage.setItem('theme', newTheme);
    document.documentElement.setAttribute('data-theme', newTheme);
  };

  const clearNotifs = async () => {
    try {
      await fetch('/api/notifications', { method: 'DELETE' });
      setNotifications([]);
      setShowNotifs(false);
    } catch (e) {}
  };

  return (
    <div className="topbar">
      <div className="tb-logo">
        <img src="/logo.png" alt="CMS Logo" style={{ height: '28px', marginRight: '10px' }} />
        Collection Management System
      </div>
      <div className="tb-ml">
        <div style={{ position: 'relative' }}>
          <button 
            onClick={() => setShowNotifs(!showNotifs)} 
            className="btn sm" 
            style={{ padding: '4px 8px', fontSize: '14px', background: 'transparent', border: '1px solid var(--bdr)', position: 'relative' }}
          >
            🔔
            {notifications.length > 0 && (
              <span style={{ position: 'absolute', top: -5, right: -5, background: 'var(--red)', color: '#fff', fontSize: '9px', padding: '1px 4px', borderRadius: '10px', fontWeight: 'bold', border: '1px solid var(--bg)' }}>
                {notifications.length}
              </span>
            )}
          </button>

          {showNotifs && (
            <div style={{ 
              position: 'absolute', top: '120%', right: 0, width: '280px', 
              background: 'var(--bg2)', border: '1px solid var(--bdr)', borderRadius: '10px', 
              boxShadow: '0 10px 30px rgba(0,0,0,0.4)', zIndex: 1000, overflow: 'hidden' 
            }}>
              <div style={{ padding: '12px 15px', borderBottom: '1px solid var(--bdr)', display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: 'var(--bg3)' }}>
                <span style={{ fontSize: '12px', fontWeight: 'bold', color: 'var(--txt)' }}>Today's PTP Alerts</span>
                <button onClick={clearNotifs} style={{ fontSize: '10px', color: 'var(--red)', background: 'transparent', border: 'none', cursor: 'pointer' }}>Clear All</button>
              </div>
              <div style={{ maxHeight: '300px', overflowY: 'auto' }}>
                {notifications.length === 0 ? (
                  <div style={{ padding: '20px', textAlign: 'center', color: 'var(--txt3)', fontSize: '11px' }}>
                    No PTP reminders for today
                  </div>
                ) : (
                  notifications.map((n, i) => (
                    <div key={i} style={{ padding: '10px 15px', borderBottom: i < notifications.length - 1 ? '1px solid var(--faint)' : 'none', display: 'flex', flexDirection: 'column', gap: 4 }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                        <span style={{ fontSize: '11px', fontWeight: 600, color: 'var(--acc2)' }}>{n.title}</span>
                        <span style={{ fontSize: '9px', color: 'var(--txt3)' }}>{n.time}</span>
                      </div>
                      <div style={{ fontSize: '11px', color: 'var(--txt)' }}>{n.message}</div>
                      <div style={{ fontSize: '9px', color: 'var(--txt3)', fontFamily: 'monospace' }}>A/C: {n.account}</div>
                    </div>
                  ))
                )}
              </div>
            </div>
          )}
        </div>

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
