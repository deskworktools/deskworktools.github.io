import React, { useState, useEffect, useCallback } from 'react';
import { LoginScreen } from './components/LoginScreen';
import { AdminSidebar, AdminSectionId } from './components/AdminSidebar';
import { AdminHeader } from './components/AdminHeader';
import { SectionPlaceholder } from './components/SectionPlaceholder';
import { DashboardView } from './views/DashboardView';
import { ActivityLogView } from './views/ActivityLogView';
import { SystemSettingsView } from './views/SystemSettingsView';
import { BlogCmsView } from './views/BlogCmsView';
import { MediaVaultView } from './views/MediaVaultView';
import { AnalyticsView } from './views/AnalyticsView';
import { AdsView } from './views/AdsView';
import { DashboardOverview } from '../../server/data/types';

export const AdminApp: React.FC = () => {
  const [checkingAuth, setCheckingAuth] = useState(true);
  const [authenticated, setAuthenticated] = useState(false);
  const [currentSection, setCurrentSection] = useState<AdminSectionId>('dashboard');
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [overview, setOverview] = useState<DashboardOverview | null>(null);
  const [loadingOverview, setLoadingOverview] = useState(false);
  const [loggingOut, setLoggingOut] = useState(false);

  const checkAuth = useCallback(async () => {
    try {
      const res = await fetch('/api/admin/auth/me');
      if (res.ok) {
        const data = await res.json();
        if (data.authenticated) {
          setAuthenticated(true);
        } else {
          setAuthenticated(false);
        }
      } else {
        setAuthenticated(false);
      }
    } catch {
      setAuthenticated(false);
    } finally {
      setCheckingAuth(false);
    }
  }, []);

  const fetchOverview = useCallback(async () => {
    setLoadingOverview(true);
    try {
      const res = await fetch('/api/admin/overview');
      if (res.ok) {
        const data = await res.json();
        setOverview(data);
      }
    } catch (err) {
      console.error('Failed to load overview:', err);
    } finally {
      setLoadingOverview(false);
    }
  }, []);

  useEffect(() => {
    checkAuth();
  }, [checkAuth]);

  useEffect(() => {
    if (authenticated) {
      fetchOverview();
    }
  }, [authenticated, fetchOverview]);

  const handleLogout = async () => {
    setLoggingOut(true);
    try {
      await fetch('/api/admin/auth/logout', { method: 'POST' });
    } catch (err) {
      console.error('Logout error:', err);
    } finally {
      setAuthenticated(false);
      setLoggingOut(false);
      setOverview(null);
    }
  };

  if (checkingAuth) {
    return (
      <div className="min-h-screen bg-[#090D14] flex flex-col items-center justify-center text-slate-400 space-y-3">
        <div className="w-6 h-6 border-2 border-emerald-500 border-t-transparent rounded-full animate-spin" />
        <span className="text-xs font-medium tracking-wide">Verifying Secure Admin Session...</span>
      </div>
    );
  }

  if (!authenticated) {
    return <LoginScreen onLoginSuccess={() => setAuthenticated(true)} />;
  }

  return (
    <div className="min-h-screen bg-[#090D14] text-slate-100 flex flex-col md:flex-row antialiased font-sans">
      <AdminSidebar
        currentSection={currentSection}
        onSelectSection={(id) => setCurrentSection(id)}
        isOpenMobile={mobileMenuOpen}
        onCloseMobile={() => setMobileMenuOpen(false)}
      />

      <div className="flex-1 flex flex-col min-w-0">
        <AdminHeader
          currentSection={currentSection}
          onToggleMobileMenu={() => setMobileMenuOpen(!mobileMenuOpen)}
          onLogout={handleLogout}
          loggingOut={loggingOut}
        />

        <main className="flex-1 overflow-y-auto pb-12">
          {currentSection === 'dashboard' && (
            <DashboardView
              overview={overview}
              loading={loadingOverview}
              onRefresh={fetchOverview}
              onNavigateToSection={(s) => setCurrentSection(s as AdminSectionId)}
            />
          )}

          {currentSection === 'blog' && <BlogCmsView />}

          {currentSection === 'media' && <MediaVaultView />}

          {currentSection === 'analytics' && <AnalyticsView />}

          {currentSection === 'ads' && <AdsView />}

          {currentSection === 'activity' && <ActivityLogView />}

          {currentSection === 'settings' && <SystemSettingsView />}

          {currentSection !== 'dashboard' &&
            currentSection !== 'blog' &&
            currentSection !== 'media' &&
            currentSection !== 'analytics' &&
            currentSection !== 'ads' &&
            currentSection !== 'activity' &&
            currentSection !== 'settings' && (
              <SectionPlaceholder
                sectionId={currentSection}
                onNavigateToDashboard={() => setCurrentSection('dashboard')}
              />
            )}
        </main>
      </div>
    </div>
  );
};
