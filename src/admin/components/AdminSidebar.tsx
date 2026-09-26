import React from 'react';
import {
  LayoutDashboard,
  BarChart3,
  BookOpen,
  Image as ImageIcon,
  DollarSign,
  Search,
  Activity,
  Database,
  History,
  Settings,
  X,
  ShieldCheck,
  ExternalLink,
} from 'lucide-react';

export type AdminSectionId =
  | 'dashboard'
  | 'analytics'
  | 'blog'
  | 'media'
  | 'ads'
  | 'seo'
  | 'health'
  | 'backups'
  | 'activity'
  | 'settings';

interface NavItem {
  id: AdminSectionId;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
  badge?: string;
  isPhase1?: boolean;
}

const NAV_ITEMS: NavItem[] = [
  { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard, isPhase1: true },
  { id: 'blog', label: 'Blog CMS', icon: BookOpen, isPhase1: true },
  { id: 'media', label: 'Media Assets', icon: ImageIcon, isPhase1: true },
  { id: 'analytics', label: 'Analytics', icon: BarChart3, isPhase1: true },
  { id: 'ads', label: 'Ads & Monetization', icon: DollarSign, isPhase1: true },
  { id: 'seo', label: 'SEO Management', icon: Search, badge: 'Phase 5' },
  { id: 'health', label: 'Site Health', icon: Activity, badge: 'Phase 6' },
  { id: 'backups', label: 'Backups / Export', icon: Database, badge: 'Phase 6' },
  { id: 'activity', label: 'Activity Log', icon: History, isPhase1: true },
  { id: 'settings', label: 'System Settings', icon: Settings, isPhase1: true },
];

interface AdminSidebarProps {
  currentSection: AdminSectionId;
  onSelectSection: (id: AdminSectionId) => void;
  isOpenMobile: boolean;
  onCloseMobile: () => void;
}

export const AdminSidebar: React.FC<AdminSidebarProps> = ({
  currentSection,
  onSelectSection,
  isOpenMobile,
  onCloseMobile,
}) => {
  const content = (
    <div className="flex flex-col h-full bg-[#0d131f] border-r border-slate-800/80 text-slate-200 w-64 select-none">
      {/* Brand Header */}
      <div className="p-5 border-b border-slate-800/70 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-lg bg-emerald-500 flex items-center justify-center text-slate-950 font-bold shadow-md shadow-emerald-500/20">
            <ShieldCheck className="w-5 h-5 text-slate-950" />
          </div>
          <div>
            <div className="text-sm font-bold tracking-tight text-white flex items-center gap-1.5">
              Deskwork
              <span className="text-[10px] uppercase font-mono px-1.5 py-0.5 rounded bg-emerald-950 text-emerald-400 border border-emerald-800/60">
                P1 Core
              </span>
            </div>
            <div className="text-[11px] text-slate-400">Command Center</div>
          </div>
        </div>

        {isOpenMobile && (
          <button
            onClick={onCloseMobile}
            className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 md:hidden"
            aria-label="Close sidebar"
          >
            <X className="w-5 h-5" />
          </button>
        )}
      </div>

      {/* Navigation Links */}
      <div className="flex-1 overflow-y-auto p-3 space-y-1">
        <div className="px-3 pt-2 pb-1 text-[10px] font-semibold uppercase tracking-wider text-slate-400">
          Navigation
        </div>

        {NAV_ITEMS.map((item) => {
          const Icon = item.icon;
          const isActive = currentSection === item.id;
          return (
            <button
              key={item.id}
              onClick={() => {
                onSelectSection(item.id);
                onCloseMobile();
              }}
              className={`w-full flex items-center justify-between px-3 py-2 rounded-xl text-xs font-medium transition-all ${
                isActive
                  ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 shadow-sm'
                  : 'text-slate-400 hover:text-slate-100 hover:bg-slate-800/50'
              }`}
            >
              <div className="flex items-center gap-2.5">
                <Icon className={`w-4 h-4 ${isActive ? 'text-emerald-400' : 'text-slate-500'}`} />
                <span>{item.label}</span>
              </div>
              {item.badge ? (
                <span className="text-[9px] font-mono px-1.5 py-0.5 rounded bg-slate-800 text-slate-400 border border-slate-700/60">
                  {item.badge}
                </span>
              ) : item.isPhase1 ? (
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500/80" />
              ) : null}
            </button>
          );
        })}
      </div>

      {/* Quick Public Site Access Footer */}
      <div className="p-3 border-t border-slate-800/70 bg-[#090e17]">
        <div className="px-3 py-1 text-[10px] font-semibold uppercase tracking-wider text-slate-400 mb-1">
          Public Website
        </div>
        <a
          href="/"
          target="_blank"
          rel="noopener noreferrer"
          className="flex items-center justify-between w-full px-3 py-2 rounded-lg text-xs text-slate-300 hover:text-white hover:bg-slate-800/60 transition-colors"
        >
          <span>Live Tools Hub</span>
          <ExternalLink className="w-3.5 h-3.5 text-slate-400" />
        </a>
        <a
          href="/blog/"
          target="_blank"
          rel="noopener noreferrer"
          className="flex items-center justify-between w-full px-3 py-2 rounded-lg text-xs text-slate-300 hover:text-white hover:bg-slate-800/60 transition-colors"
        >
          <span>Public Blog</span>
          <ExternalLink className="w-3.5 h-3.5 text-slate-400" />
        </a>
      </div>
    </div>
  );

  return (
    <>
      {/* Desktop Persistent Sidebar */}
      <aside className="hidden md:flex h-screen sticky top-0 shrink-0 z-20">
        {content}
      </aside>

      {/* Mobile Drawer */}
      {isOpenMobile && (
        <div className="fixed inset-0 z-50 flex md:hidden">
          <div
            className="fixed inset-0 bg-slate-950/80 backdrop-blur-xs"
            onClick={onCloseMobile}
            aria-hidden="true"
          />
          <div className="relative z-10 h-full shadow-2xl">
            {content}
          </div>
        </div>
      )}
    </>
  );
};
