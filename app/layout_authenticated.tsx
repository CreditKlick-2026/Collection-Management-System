"use client";
import React, { useEffect } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { useAuth } from '@/hooks/useAuth';
import Sidebar from '@/components/Sidebar';
import Topbar from '@/components/Topbar';

export default function AuthenticatedLayout({ children }: { children: React.ReactNode }) {
  const { user, loading, logout } = useAuth();
  const router = useRouter();
  const pathname = usePathname();

  const [mobileMenuOpen, setMobileMenuOpen] = React.useState(false);

  useEffect(() => {
    if (!loading && !user) {
      router.push('/');
    }
  }, [user, loading, router]);

  useEffect(() => {
    setMobileMenuOpen(false);
  }, [pathname]);

  if (loading) return <div style={{ color: 'white', padding: 20 }}>Loading...</div>;
  if (!user) return null;

  // Extract active page from pathname (e.g., /leads -> leads)
  const activePage = pathname.split('/').pop() || 'dashboard';

  return (
    <div id="sc-app" className="screen active">
      <div className="app-shell">
        <Topbar user={user} activePage={activePage} logout={logout} toggleMobileMenu={() => setMobileMenuOpen(!mobileMenuOpen)} />
        <div className="body-row">
          {mobileMenuOpen && (
            <div className="mobile-overlay" onClick={() => setMobileMenuOpen(false)}></div>
          )}
          <Sidebar activePage={activePage} setActivePage={(p) => router.push(`/${p}`)} user={user} isMobileOpen={mobileMenuOpen} />
          <div className="main-area">
            {children}
          </div>
        </div>
      </div>
    </div>
  );
}
