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

import { useRouter } from 'next/navigation';
import { ButtonGroup, Button } from '@shopify/polaris';
import '@/styles/Login.css';

export default function Home() {
  const { user, loading, login, logout } = useAuth();
  const router = useRouter();
  const [authData, setAuthData] = useState({ username: '', password: '' });
  const [showPwd, setShowPwd] = useState(false);
  const [userType, setUserType] = useState("agent");

  useEffect(() => {
    if (!loading && user) {
      if (user.role === 'admin') router.push('/admin');
      else if (user.role === 'manager') router.push('/manager');
      else router.push('/dashboard');
    }
  }, [user, loading, router]);

  const handleLogin = async () => {
    const res = await login(authData.username, authData.password, userType);
    if (res.success) {
      // Redirection will be handled by useEffect above
    }
  };

  if (loading) return <div style={{ color: 'white', padding: 20 }}>Loading...</div>;

  if (!user) {
    return (
      <div className="login-container">
        {/* Left side with branding */}
        <div className="branding-side">
          <div className="branding-content animate__animated animate__fadeIn">
            <p className="branding-title animate__animated animate__fadeInUp">
              IMS
            </p>
            <p className="branding-sub animate__animated animate__fadeIn">
              Collection Management System
            </p>
          </div>
        </div>

        {/* Right side login form */}
        <div className="form-side">
          <div className="login-card animate__animated animate__fadeIn">
            <div className="decorative-square"></div>

            <div className="card-header animate__animated animate__fadeInUp">
              <div className="logo-circle">
                <img src="/cms_logo.png" style={{ width: '100%', height: '100%', borderRadius: '50%', objectFit: 'contain' }} alt="CMS Logo" />
              </div>
              <p className="login-title">
                Login to Dashboard
              </p>
            </div>

            <form className="login-form" onSubmit={(e) => { e.preventDefault(); handleLogin(); }}>
              <div className="form-group">
                <label className="user-type-label">Login As:</label>
                <div style={{ marginTop: '4px' }}>
                  <ButtonGroup variant="segmented" fullWidth>
                    <Button 
                      pressed={userType === 'agent'} 
                      onClick={() => setUserType('agent')}
                    >
                      Agent
                    </Button>
                    <Button 
                      pressed={userType === 'supervisor'} 
                      onClick={() => setUserType('supervisor')}
                    >
                      Supervisor
                    </Button>
                    <Button 
                      pressed={userType === 'admin'} 
                      onClick={() => setUserType('admin')}
                    >
                      Admin
                    </Button>
                  </ButtonGroup>
                </div>
              </div>

              <div className="form-group">
                <label className="input-label">Emp Id</label>
                <input
                  className="input-field"
                  type="text"
                  placeholder="Enter your emp ID"
                  value={authData.username}
                  onChange={e => setAuthData({ ...authData, username: e.target.value })}
                />
              </div>

              <div className="form-group">
                <label className="input-label">Password</label>
                <div className="password-wrapper">
                  <input
                    className="input-field"
                    type={showPwd ? "text" : "password"}
                    placeholder="Password"
                    value={authData.password}
                    onChange={e => setAuthData({ ...authData, password: e.target.value })}
                  />
                  <button
                    type="button"
                    className="eye-btn"
                    onClick={() => setShowPwd(!showPwd)}
                  >
                    {showPwd ? '👁' : '👁‍🗨'}
                  </button>
                </div>
              </div>

              <button
                type="submit"
                className="submit-btn"
              >
                Login
              </button>
            </form>
          </div>
        </div>
      </div>
    );
  }

  return null;
}
