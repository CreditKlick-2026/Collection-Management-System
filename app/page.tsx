"use client";
import React, { useState, useEffect } from 'react';
import Sidebar from '@/components/Sidebar';
import Topbar from '@/components/Topbar';
import Dashboard from '@/components/Dashboard';
import Leads from '@/components/Leads';
import Payments from '@/components/Payments';
import Approvals from '@/components/Approvals';
import Admin from '@/components/Admin';
import PTPs from '@/components/PTPs';
import Disputes from '@/components/Disputes';
import ManagerPanel from '@/components/ManagerPanel';
import { useAuth } from '@/hooks/useAuth';

export default function Home() {
  const { user, loading, login, logout } = useAuth();
  const [activePage, setActivePage] = useState('dashboard');
  const [authData, setAuthData] = useState({ username: '', password: '' });
  const [showPwd, setShowPwd] = useState(false);

  if (loading) return <div style={{ color: 'white', padding: 20 }}>Loading...</div>;

  if (!user) {
    return (
      <div id="sc-login" className="screen active">
        <div className="login-wrap">
          <div className="login-box">
            <div className="brand">
              <div className="brand-sq">DR</div>
              <div>
                <div className="brand-name">DebtRecover Pro</div>
                <div className="brand-sub">Outbound Recovery System v4.0</div>
              </div>
            </div>
            <div className="divhr"></div>
            <div className="l-title">Welcome Back</div>
            <div className="l-sub">Sign in to your account</div>
            
            <div className="fld">
              <label>Username</label>
              <div className="fld-row">
                <span className="fld-ic">◉</span>
                <input 
                  className="fld-inp" 
                  type="text" 
                  placeholder="Enter username" 
                  value={authData.username} 
                  onChange={e => setAuthData({...authData, username: e.target.value})} 
                  onKeyDown={e => e.key === 'Enter' && login(authData.username, authData.password)}
                />
              </div>
            </div>
            
            <div className="fld">
              <label>Password</label>
              <div className="fld-row">
                <span className="fld-ic">🔒</span>
                <input 
                  className="fld-inp" 
                  type={showPwd ? "text" : "password"} 
                  placeholder="Enter password" 
                  value={authData.password} 
                  onChange={e => setAuthData({...authData, password: e.target.value})} 
                  onKeyDown={e => e.key === 'Enter' && login(authData.username, authData.password)}
                />
                <button className="eye" onClick={() => setShowPwd(!showPwd)}>{showPwd ? '👁' : '👁‍🗨'}</button>
              </div>
            </div>

            <div className="rem-row">
              <label className="rem"><input type="checkbox" defaultChecked /> Remember me</label>
              <button style={{ background: 'none', border: 'none', fontSize: '12px', color: 'var(--acc)', cursor: 'pointer' }}>Forgot password?</button>
            </div>
            
            <button className="login-btn" onClick={() => login(authData.username, authData.password)}>Sign In</button>
            <div className="hint">admin / <b>admin</b> &nbsp;|&nbsp; manager1 / <b>manager1</b> &nbsp;|&nbsp; agent1 / <b>agent1</b></div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div id="sc-app" className="screen active">
      <div className="app-shell">
        <Topbar user={user} activePage={activePage} logout={logout} />
        
        <div className="body-row">
          <Sidebar activePage={activePage} setActivePage={setActivePage} user={user} />
          
          <div className="main-area">
            {activePage === 'dashboard' && <Dashboard />}
            {activePage === 'leads' && <Leads />}
            {activePage === 'payments' && <Payments />}
            {activePage === 'approvals' && <Approvals />}
            {activePage === 'admin' && <Admin />}
            {activePage === 'ptp' && <PTPs />}
            {activePage === 'disputes' && <Disputes />}
            {activePage === 'manager' && <ManagerPanel />}
            
            {!['dashboard', 'leads', 'payments', 'ptp', 'disputes', 'approvals', 'manager', 'admin'].includes(activePage) && (
              <div className="page on" style={{ padding: 20, textAlign: 'center', color: 'var(--txt3)' }}>
                Content for <b>{activePage}</b> is coming soon.
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
