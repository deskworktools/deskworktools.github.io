import React from 'react';
import { Menu, LogOut, ExternalLink, HardDrive } from 'lucide-react';
import { AdminSectionId } from './AdminSidebar';

interface AdminHeaderProps {
  currentSection: AdminSectionId;
  onToggleMobileMenu: () => void;
  onLogout: () => void;
  loggingOut?: boolean;
}

const SECTION_TITLES: Record<AdminSectionId, { title: string; subtitle: string }> = {
  dashboard: { title: 'Command Overview', subtitle: 'Real-time site metrics and operational status' },
  analytics: { title: 'Tool & Usage Analytics', subtitle: 'Privacy-first anonymous telemetry (Phase 2)' },
  blog: { title: 'Blog Content Management', subtitle: 'Semantic article editor and automated publishing (Phase 2)' },
  media: { title: 'Media & Asset Vault', subtitle: 'Optimized blog imagery and web assets (Phase 2)' },
  ads: { title: 'Ads & Monetization Control', subtitle: 'AdSense & Adsterra placement manager (Phase 2)' },
  seo: { title: 'SEO & Metadata Engine', subtitle: 'Open Graph, robots, and automated sitemap checks (Phase 2)' },
  health: { title: 'Site Health & Audit', subtitle: 'Availability, sitemap, and resource integrity checks (Phase 2)' },
  backups: { title: 'Data Backup & Disaster Recovery', subtitle: 'Snapshot exports and confirmed restore protocols (Phase 2)' },
  activity: { title: 'Audit & Activity Logs', subtitle: 'Historical administrative event records' },
  settings: { title: 'System Architecture & Settings', subtitle: 'Server environment and storage driver configurations' },
};

export const AdminHeader: React.FC<AdminHeaderProps> = ({
  currentSection,
  onToggleMobileMenu,
  onLogout,
  loggingOut,
}) => {
  const current = SECTION_TITLES[currentSection] || { title: 'Admin Console', subtitle: '' };

  return (
    <header className="sticky top-0 z-10 bg-[#0d131f]/90 backdrop-blur-md border-b border-slate-800/80 px-4 md:px-6 py-3.5 flex items-center justify-between">
      <div className="flex items-center gap-3">
        <button
          onClick={onToggleMobileMenu}
          className="p-2 -ml-2 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800/60 md:hidden"
          aria-label="Open navigation menu"
        >
          <Menu className="w-5 h-5" />
        </button>

        <div>
          <h2 className="text-base font-bold text-white tracking-tight flex items-center gap-2">
            {current.title}
          </h2>
          <p className="text-[11px] text-slate-400 hidden sm:block">
            {current.subtitle}
          </p>
        </div>
      </div>

      <div className="flex items-center gap-2 sm:gap-3">
        {/* Quick Links Dropdown / Pill Group */}
        <div className="hidden lg:flex items-center gap-1 bg-slate-900 border border-slate-800 rounded-xl p-1 text-xs">
          <a
            href="/"
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-1.5 px-2.5 py-1 text-slate-300 hover:text-white hover:bg-slate-800 rounded-lg transition-colors"
          >
            <span>Live Site</span>
            <ExternalLink className="w-3 h-3 text-slate-400" />
          </a>
          <a
            href="/blog/"
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-1.5 px-2.5 py-1 text-slate-300 hover:text-white hover:bg-slate-800 rounded-lg transition-colors"
          >
            <span>Blog</span>
            <ExternalLink className="w-3 h-3 text-slate-400" />
          </a>
          <a
            href="/?tab=resume"
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-1.5 px-2.5 py-1 text-emerald-400 hover:text-emerald-300 hover:bg-emerald-950/40 rounded-lg transition-colors font-medium"
          >
            <span>Resume Builder</span>
            <ExternalLink className="w-3 h-3 text-emerald-400" />
          </a>
        </div>

        {/* Storage Driver Indicator */}
        <div className="hidden sm:flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-slate-900/80 border border-slate-800 text-[11px] text-slate-400">
          <HardDrive className="w-3.5 h-3.5 text-amber-400" />
          <span>Driver: <strong className="text-slate-300 font-medium">JSON (Dev)</strong></span>
        </div>

        {/* Secure Logout Button */}
        <button
          onClick={onLogout}
          disabled={loggingOut}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-900 hover:bg-rose-950/40 border border-slate-800 hover:border-rose-800/60 text-xs font-medium text-slate-300 hover:text-rose-200 transition-colors cursor-pointer disabled:opacity-50"
          title="Sign out of Admin Command Center"
        >
          <LogOut className="w-3.5 h-3.5" />
          <span className="hidden sm:inline">{loggingOut ? 'Signing out...' : 'Sign Out'}</span>
        </button>
      </div>
    </header>
  );
};
