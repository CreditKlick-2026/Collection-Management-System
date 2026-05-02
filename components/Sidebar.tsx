"use client";
import React from 'react';

interface SidebarProps {
  activePage: string;
  setActivePage: (page: string) => void;
  user: any;
  isMobileOpen?: boolean;
}

const Sidebar: React.FC<SidebarProps> = ({ activePage, setActivePage, user, isMobileOpen }) => {
  const navItems = [
    { 
      id: 'dashboard', label: 'Dashboard', section: 'OPERATIONS',
      icon: <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect width="7" height="9" x="3" y="3" rx="1"/><rect width="7" height="5" x="14" y="3" rx="1"/><rect width="7" height="9" x="14" y="12" rx="1"/><rect width="7" height="5" x="3" y="16" rx="1"/></svg>
    },
    { 
      id: 'leads', label: 'Leads', section: 'OPERATIONS', hasDot: true,
      icon: <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M22 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg>
    },
    { 
      id: 'payment', label: 'Payments', section: 'RECOVERY',
      icon: <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect width="20" height="14" x="2" y="5" rx="2"/><line x1="2" x2="22" y1="10" y2="10"/></svg>
    },
    { 
      id: 'ptp', label: 'Promise to Pay', section: 'RECOVERY',
      icon: <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M6 3h12"/><path d="M6 8h12"/><path d="m6 13 8.5 8"/><path d="M6 13h3c2.24 0 4-1.79 4-4s-1.76-4-4-4H6"/></svg>
    },
    { 
      id: 'disputes', label: 'Disputes', section: 'RECOVERY',
      icon: <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/><line x1="12" x2="12" y1="7" y2="11"/><line x1="12" x2="12.01" y1="15" y2="15"/></svg>
    },
    { 
      id: 'approvals', label: 'Approvals', section: 'MANAGEMENT', roles: ['admin', 'manager'],
      icon: <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/><polyline points="22 4 12 14.01 9 11.01"/></svg>
    },
    { 
      id: 'manager', label: 'Manager Panel', section: 'MANAGEMENT', roles: ['admin', 'manager'],
      icon: <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="12" x2="12" y1="20" y2="10"/><line x1="18" x2="18" y1="20" y2="4"/><line x1="6" x2="6" y1="20" y2="16"/></svg>
    },
    { 
      id: 'admin', label: 'Admin Panel', section: 'MANAGEMENT', roles: ['admin'],
      icon: <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12.22 2h-.44a2 2 0 0 0-2 2v.18a2 2 0 0 1-1 1.73l-.43.25a2 2 0 0 1-2 0l-.15-.08a2 2 0 0 0-2.73.73l-.22.38a2 2 0 0 0 .73 2.73l.15.1a2 2 0 0 1 1 1.72v.51a2 2 0 0 1-1 1.74l-.15.09a2 2 0 0 0-.73 2.73l.22.38a2 2 0 0 0 2.73.73l.15-.08a2 2 0 0 1 2 0l.43.25a2 2 0 0 1 1 1.73V20a2 2 0 0 0 2 2h.44a2 2 0 0 0 2-2v-.18a2 2 0 0 1 1-1.73l.43-.25a2 2 0 0 1 2 0l.15.08a2 2 0 0 0 2.73-.73l.22-.39a2 2 0 0 0-.73-2.73l-.15-.08a2 2 0 0 1-1-1.74v-.5a2 2 0 0 1 1-1.74l.15-.09a2 2 0 0 0 .73-2.73l-.22-.38a2 2 0 0 0-2.73-.73l-.15.08a2 2 0 0 1-2 0l-.43-.25a2 2 0 0 1-1-1.73V4a2 2 0 0 0-2-2z"/><circle cx="12" cy="12" r="3"/></svg>
    },
  ];

  const sections = ['OPERATIONS', 'RECOVERY', 'MANAGEMENT'];

  return (
    <div className={`sidebar ${isMobileOpen ? 'mobile-open' : ''}`}>
      {sections.map(sec => {
        const items = navItems.filter(i => i.section === sec && (!i.roles || i.roles.includes(user?.role)));
        if (items.length === 0) return null;

        return (
          <React.Fragment key={sec}>
            <div className="ns">{sec}</div>
            {items.map(item => (
              <div 
                key={item.id} 
                className={`ni ${activePage === item.id ? 'on' : ''}`} 
                onClick={() => setActivePage(item.id)}
              >
                <span>{item.icon}</span>
                {item.label}
                {item.hasDot && <span className="ni-dot"></span>}
              </div>
            ))}
            <div style={{ height: 10 }}></div>
          </React.Fragment>
        );
      })}
    </div>
  );
};

export default Sidebar;
