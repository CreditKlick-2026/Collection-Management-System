"use client";
import React, { useState, useEffect } from 'react';

interface TopbarProps {
  user: any;
  activePage: string;
  logout: () => void;
  toggleMobileMenu?: () => void;
}

const Topbar: React.FC<TopbarProps> = ({ user, activePage, logout, toggleMobileMenu }) => {
  const [time, setTime] = useState('--:--:--');
  const [theme, setTheme] = useState<'dark' | 'light'>('dark');
  const [notifications, setNotifications] = useState<any[]>([]);
  const [showNotifs, setShowNotifs] = useState(false);
  const [showProfile, setShowProfile] = useState(false);

  const fetchNotifs = async () => {
    try {
      const res = await fetch('/api/notifications');
      if (res.ok) {
        const data = await res.json();
        setNotifications(data);
      }
    } catch (e) { }
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
    } catch (e) { }
  };

  return (
    <div className="topbar">
      <div className="tb-logo" style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
        {toggleMobileMenu && (
          <button className="mobile-menu-btn" onClick={toggleMobileMenu}>
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="3" y1="12" x2="21" y2="12"></line><line x1="3" y1="6" x2="21" y2="6"></line><line x1="3" y1="18" x2="21" y2="18"></line></svg>
          </button>
        )}
        <img src="/cms_logo.png" alt="CMS Logo" style={{ height: '32px' }} />
        <span className="logo-text">Collection Management System</span>
      </div>
      <div className="tb-ml">
        <div style={{ position: 'relative' }}>
          <button
            onClick={() => setShowNotifs(!showNotifs)}
            className="btn sm"
            style={{ padding: '6px 8px', background: 'transparent', border: '1px solid var(--bdr)', position: 'relative', color: 'var(--txt2)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
          >
            <span>Notification</span>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M6 8a6 6 0 0 1 12 0c0 7 3 9 3 9H3s3-2 3-9" />
              <path d="M10.3 21a1.94 1.94 0 0 0 3.4 0" />
            </svg>
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

        <button onClick={toggleTheme} className="btn sm" style={{ padding: '6px 8px', background: 'transparent', border: '1px solid var(--bdr)', color: 'var(--txt2)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          {theme === 'dark' ? (
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="12" cy="12" r="4" />
              <path d="M12 2v2" /><path d="M12 20v2" />
              <path d="m4.93 4.93 1.41 1.41" /><path d="m17.66 17.66 1.41 1.41" />
              <path d="M2 12h2" /><path d="M20 12h2" />
              <path d="m6.34 17.66-1.41 1.41" /><path d="m19.07 4.93-1.41 1.41" />
            </svg>
          ) : (
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M12 3a6 6 0 0 0 9 9 9 9 0 1 1-9-9Z" />
            </svg>
          )}
        </button>
        <div style={{ fontFamily: 'monospace', fontSize: '11px', color: 'var(--txt3)', background: 'var(--bg3)', padding: '2px 8px', borderRadius: '4px' }}>
          {time}
        </div>
        <div style={{ position: 'relative' }}>
          <div
            onClick={() => setShowProfile(!showProfile)}
            style={{
              display: 'flex', alignItems: 'center', gap: 10, cursor: 'pointer',
              padding: '4px 12px', borderRadius: '100px',
              border: `1px solid ${showProfile ? 'var(--acc)' : 'transparent'}`,
              background: showProfile ? 'var(--bg3)' : 'var(--bg2)',
              transition: 'all 0.2s cubic-bezier(0.4, 0, 0.2, 1)',
              userSelect: 'none',
              outline: 'none',
              height: '36px'
            }}
            className="profile-trigger"
          >
            <div className="av" style={{
              margin: 0, width: '26px', height: '26px', fontSize: '10px',
              background: 'linear-gradient(135deg, var(--acc) 0%, var(--acc2) 100%)',
              color: '#fff', border: 'none', fontWeight: 700,
              boxShadow: '0 2px 4px rgba(0,0,0,0.1)'
            }}>
              {user?.initials || user?.name?.split(' ').map((n: any) => n[0]).join('').substring(0, 2).toUpperCase() || '--'}
            </div>
            <span style={{
              fontSize: '8px',
              color: showProfile ? 'var(--acc)' : 'var(--txt3)',
              transform: showProfile ? 'rotate(180deg)' : 'rotate(0deg)',
              transition: 'transform 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
              opacity: 0.7
            }}>▼</span>
          </div>

          {showProfile && (
            <div style={{
              position: 'absolute', top: 'calc(100% + 12px)', right: 0, width: '210px',
              background: 'var(--bg2)', border: '1px solid var(--bdr)', borderRadius: '12px',
              boxShadow: '0 10px 40px -10px rgba(0,0,0,0.3)',
              zIndex: 1001, overflow: 'visible',
              animation: 'slideIn 0.2s cubic-bezier(0, 0, 0.2, 1)'
            }}>
              {/* Pointer Arrow */}
              <div style={{
                position: 'absolute', top: '-6px', right: '18px', width: '12px', height: '12px',
                background: 'var(--bg2)', borderLeft: '1px solid var(--bdr)', borderTop: '1px solid var(--bdr)',
                transform: 'rotate(45deg)', zIndex: 1
              }} />

              <div style={{ position: 'relative', zIndex: 2, borderRadius: '12px', overflow: 'hidden', background: 'var(--bg2)' }}>
                {/* User Info Header */}
                <div style={{ padding: '16px', display: 'flex', alignItems: 'center', gap: '14px', borderBottom: '1px solid var(--bdr)' }}>
                  <div className="av" style={{
                    width: '44px', height: '44px', fontSize: '16px', margin: 0,
                    background: 'linear-gradient(135deg, var(--acc) 0%, var(--acc2) 100%)',
                    color: '#fff', border: '2px solid var(--bg)', boxShadow: '0 4px 10px rgba(0,0,0,0.15)',
                    fontWeight: 800, flexShrink: 0
                  }}>
                    {user?.initials || user?.name?.split(' ').map((n: any) => n[0]).join('').substring(0, 2).toUpperCase() || '--'}
                  </div>
                  <div style={{ display: 'flex', flexDirection: 'column', flex: 1, minWidth: 0 }}>
                    <span style={{ fontSize: '15px', fontWeight: 700, color: 'var(--txt)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', marginBottom: '2px' }}>
                      {user?.name || 'System Admin'}
                    </span>
                    <span style={{ fontSize: '12px', color: 'var(--txt3)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', marginBottom: '6px' }}>
                      {user?.email || 'admin@dr.com'}
                    </span>
                    <div>
                      <span style={{
                        background: 'rgba(79, 125, 255, 0.1)', color: 'var(--acc)',
                        fontSize: '9px', padding: '3px 8px', borderRadius: '4px',
                        fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.5px',
                        border: '1px solid rgba(79, 125, 255, 0.2)',
                        display: 'inline-block'
                      }}>
                        {user?.role || 'Admin'}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Menu Items */}
                <div style={{ padding: '8px' }}>
                  <button
                    className="profile-menu-item logout"
                    style={{
                      width: '100%', justifyContent: 'flex-start', background: 'transparent', border: 'none',
                      padding: '10px 12px', color: 'var(--red)', fontSize: '14px', display: 'flex',
                      alignItems: 'center', gap: '12px', borderRadius: '8px', cursor: 'pointer',
                      transition: 'all 0.2s ease', fontWeight: 600
                    }}
                    onClick={() => {
                      if (confirm('Are you sure you want to logout?')) {
                        logout();
                      }
                    }}
                  >
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"></path>
                      <polyline points="16 17 21 12 16 7"></polyline>
                      <line x1="21" y1="12" x2="9" y2="12"></line>
                    </svg>
                    <span>Sign Out</span>
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>

        <style jsx>{`
          .profile-menu-item:hover {
            background: var(--bg3) !important;
          }
          .profile-menu-item.logout:hover {
            background: rgba(255, 59, 48, 0.1) !important;
          }
          @keyframes slideIn {
            from { opacity: 0; transform: translateY(-10px); }
            to { opacity: 1; transform: translateY(0); }
          }
        `}</style>
      </div>
    </div>
  );
};

export default Topbar;
