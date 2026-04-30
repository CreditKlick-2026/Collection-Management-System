"use client";
import React from 'react';

interface SidebarProps {
  activePage: string;
  setActivePage: (page: string) => void;
  user: any;
}

const Sidebar: React.FC<SidebarProps> = ({ activePage, setActivePage, user }) => {
  return (
    <div className="sidebar">
      <div className="ns">Operations</div>
      <div className={`ni ${activePage === 'dashboard' ? 'on' : ''}`} onClick={() => setActivePage('dashboard')}>▣ Dashboard</div>
      <div className={`ni ${activePage === 'leads' ? 'on' : ''}`} onClick={() => setActivePage('leads')}>◉ Leads<span className="ni-dot"></span></div>
      
      <div className="ns">Recovery</div>
      <div className={`ni ${activePage === 'payments' ? 'on' : ''}`} onClick={() => setActivePage('payments')}>◈ Payments</div>
      <div className={`ni ${activePage === 'ptp' ? 'on' : ''}`} onClick={() => setActivePage('ptp')}>₹ Promise to Pay</div>
      <div className={`ni ${activePage === 'disputes' ? 'on' : ''}`} onClick={() => setActivePage('disputes')}>△ Disputes</div>
      
      {(user?.role === 'admin' || user?.role === 'manager') && (
        <>
          <div className="ns">Management</div>
          <div className={`ni ${activePage === 'approvals' ? 'on' : ''}`} onClick={() => setActivePage('approvals')}>⏳ Approvals</div>
          <div className={`ni ${activePage === 'manager' ? 'on' : ''}`} onClick={() => setActivePage('manager')}>📊 Manager Panel</div>
        </>
      )}
      
      {user?.role === 'admin' && (
        <div className={`ni ${activePage === 'admin' ? 'on' : ''}`} onClick={() => setActivePage('admin')}>⚙ Admin Panel</div>
      )}
    </div>
  );
};

export default Sidebar;
