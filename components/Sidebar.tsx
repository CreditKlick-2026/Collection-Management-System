"use client";
import React from 'react';

interface SidebarProps {
  activePage: string;
  setActivePage: (page: string) => void;
  user: any;
}

const Sidebar: React.FC<SidebarProps> = ({ activePage, setActivePage, user }) => {
  const navItems = [
    { id: 'dashboard', label: 'Dashboard', icon: '▣', section: 'OPERATIONS' },
    { id: 'leads', label: 'Leads', icon: '◉', section: 'OPERATIONS', hasDot: true },
    { id: 'payment', label: 'Payments', icon: '◈', section: 'RECOVERY' },
    { id: 'ptp', label: 'Promise to Pay', icon: '₹', section: 'RECOVERY' },
    { id: 'disputes', label: 'Disputes', icon: '△', section: 'RECOVERY' },
    { id: 'approvals', label: 'Approvals', icon: '⏳', section: 'MANAGEMENT', roles: ['admin', 'manager'] },
    { id: 'manager', label: 'Manager Panel', icon: '📊', section: 'MANAGEMENT', roles: ['admin', 'manager'] },
    { id: 'admin', label: 'Admin Panel', icon: '⚙', section: 'MANAGEMENT', roles: ['admin'] },
  ];

  const sections = ['OPERATIONS', 'RECOVERY', 'MANAGEMENT'];

  return (
    <div className="sidebar">
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
