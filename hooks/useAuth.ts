"use client";
import { useState, useEffect } from 'react';
import { useApp } from '@/context/AppContext';

export function useAuth() {
  const { user, setUser, toast } = useApp();
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const savedUser = localStorage.getItem('dr_user');
    if (savedUser) {
      setUser(JSON.parse(savedUser));
    }
    setLoading(false);
  }, [setUser]);

  const login = async (username: string, password: string, role: string) => {
    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, password, role }),
      });
      
      if (res.ok) {
        const data = await res.json();
        setUser(data.user);
        localStorage.setItem('dr_user', JSON.stringify(data.user));
        toast('Login successful');
        return { success: true };
      } else {
        const err = await res.json();
        toast(err.message || 'Login failed');
        return { success: false, message: err.message };
      }
    } catch (err: any) {
      toast('Network error');
      return { success: false, message: 'Network error' };
    }
  };

  const logout = () => {
    setUser(null);
    localStorage.removeItem('dr_user');
    toast('Logged out');
  };

  return { user, loading, login, logout };
}
