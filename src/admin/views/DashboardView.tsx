import React from 'react';
import {
  FileText,
  DollarSign,
  BarChart2,
  HardDrive,
  ExternalLink,
  ShieldCheck,
  RefreshCw,
  FolderOpen,
} from 'lucide-react';
import { DashboardOverview } from '../../../server/data/types';

interface DashboardViewProps {
  overview: DashboardOverview | null;
  loading: boolean;
  onRefresh: () => void;
  onNavigateToSection: (section: string) => void;
}

export const DashboardView: React.FC<DashboardViewProps> = ({
  overview,
  loading,
  onRefresh,
  onNavigateToSection,
}) => {
  return (
    <div className="p-4 md:p-8 max-w-6xl mx-auto space-y-6">
      {/* Top Welcome Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-[#111724] border border-slate-800 rounded-2xl p-6">
        <div>
          <div className="flex items-center gap-2 text-xs font-semibold text-emerald-400 uppercase tracking-wider mb-1">
            <ShieldCheck className="w-4 h-4 text-emerald-400" />
            Operational Console
          </div>
          <h1 className="text-xl md:text-2xl font-bold text-white tracking-tight">
            Deskwork Command Center
          </h1>
          <p className="text-xs text-slate-400 mt-1">
            Private management suite for Deskwork Tools. System health, real-time counters, and administrative controls.
          </p>
        </div>

        <button
          onClick={onRefresh}
          disabled={loading}
          className="self-start sm:self-auto flex items-center gap-2 px-3.5 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 border border-slate-700/80 text-xs font-medium text-slate-200 transition-colors cursor-pointer disabled:opacity-50"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin text-emerald-400' : 'text-slate-400'}`} />
          <span>{loading ? 'Refreshing...' : 'Refresh Metrics'}</span>
        </button>
      </div>

      {/* Real Metric Cards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Published Posts */}
        <div
          onClick={() => onNavigateToSection('blog')}
          className="bg-[#111724] border border-slate-800/90 hover:border-emerald-500/40 rounded-2xl p-5 relative overflow-hidden cursor-pointer transition-all group"
        >
          <div className="flex items-center justify-between text-slate-400 mb-3">
            <span className="text-xs font-medium uppercase tracking-wider text-slate-400 group-hover:text-emerald-400 transition-colors">Published Posts</span>
            <FileText className="w-4 h-4 text-sky-400" />
          </div>
          <div className="text-3xl font-bold text-white tracking-tight">
            {overview ? overview.publishedPostsCount : '—'}
          </div>
          <p className="text-[11px] text-slate-400 mt-2">
            Live articles listed in <code className="text-slate-300 font-mono">blog/posts.json</code> &rarr;
          </p>
        </div>

        {/* Draft Posts */}
        <div
          onClick={() => onNavigateToSection('blog')}
          className="bg-[#111724] border border-slate-800/90 hover:border-amber-500/40 rounded-2xl p-5 relative overflow-hidden cursor-pointer transition-all group"
        >
          <div className="flex items-center justify-between text-slate-400 mb-3">
            <span className="text-xs font-medium uppercase tracking-wider text-slate-400 group-hover:text-amber-400 transition-colors">Draft Articles</span>
            <FolderOpen className="w-4 h-4 text-amber-400" />
          </div>
          <div className="text-3xl font-bold text-white tracking-tight">
            {overview ? overview.draftPostsCount : '—'}
          </div>
          <p className="text-[11px] text-slate-400 mt-2">
            Staged unpublished CMS drafts &rarr;
          </p>
        </div>

        {/* Ad Placements Configured */}
        <div
          onClick={() => onNavigateToSection('ads')}
          className="bg-[#111724] border border-slate-800/90 hover:border-emerald-500/40 rounded-2xl p-5 relative overflow-hidden cursor-pointer transition-all group"
        >
          <div className="flex items-center justify-between text-slate-400 mb-3">
            <span className="text-xs font-medium uppercase tracking-wider text-slate-400">Ad Slots Configured</span>
            <DollarSign className="w-4 h-4 text-emerald-400 group-hover:scale-110 transition-transform" />
          </div>
          <div className="text-3xl font-bold text-white tracking-tight">
            {overview ? overview.adPlacementsCount : '—'}
          </div>
          <p className="text-[11px] text-slate-400 mt-2">
            Header, blog, tool & mobile placement slots &rarr;
          </p>
        </div>

        {/* Active Placements */}
        <div
          onClick={() => onNavigateToSection('ads')}
          className="bg-[#111724] border border-slate-800/90 hover:border-emerald-500/40 rounded-2xl p-5 relative overflow-hidden cursor-pointer transition-all group"
        >
          <div className="flex items-center justify-between text-slate-400 mb-3">
            <span className="text-xs font-medium uppercase tracking-wider text-slate-400">Active Ad Units</span>
            <span className="w-2 h-2 rounded-full bg-emerald-500" />
          </div>
          <div className="text-3xl font-bold text-white tracking-tight">
            {overview ? overview.activeAdPlacementsCount : '—'}
          </div>
          <p className="text-[11px] text-slate-400 mt-2">
            Configure live monetization &rarr;
          </p>
        </div>
      </div>

      {/* Phase 3 Analytics Status & Summary */}
      <div className="bg-[#111724] border border-slate-800 rounded-2xl p-6 md:p-8 space-y-4">
        <div className="flex items-center justify-between flex-wrap gap-3">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-emerald-950/80 border border-emerald-800/60 flex items-center justify-center text-emerald-400">
              <BarChart2 className="w-5 h-5 text-emerald-400" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-base font-bold text-white">Tool &amp; Page Analytics</h2>
                <span className="px-2 py-0.5 rounded text-[10px] font-mono uppercase bg-emerald-950 text-emerald-400 border border-emerald-800/80">
                  Active
                </span>
              </div>
              <div className="inline-flex items-center gap-1.5 text-xs text-emerald-400 font-medium">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                Anonymous Telemetry Ingestion Active
              </div>
            </div>
          </div>

          <button
            onClick={() => onNavigateToSection('analytics')}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-900 border border-slate-800 text-xs font-semibold text-emerald-400 hover:text-emerald-300 hover:border-emerald-800/60 transition-all"
          >
            View Full Analytics Report &rarr;
          </button>
        </div>

        <p className="text-xs md:text-sm text-slate-300 leading-relaxed max-w-3xl">
          Deskwork Tools uses zero tracking cookies and zero raw IP logging. Visitor uniqueness is calculated via ephemeral daily HMAC hashes that rotate automatically.
        </p>

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-1 text-xs">
          <div className="p-3 bg-slate-900/70 border border-slate-800 rounded-xl">
            <div className="text-slate-400 text-[11px]">Today&apos;s Page Views</div>
            <div className="font-semibold text-sky-400 text-lg mt-0.5 font-mono">
              {overview?.analyticsSummary ? overview.analyticsSummary.todayPageViews : 0}
            </div>
          </div>
          <div className="p-3 bg-slate-900/70 border border-slate-800 rounded-xl">
            <div className="text-slate-400 text-[11px]">Today&apos;s Visitors</div>
            <div className="font-semibold text-emerald-400 text-lg mt-0.5 font-mono">
              {overview?.analyticsSummary ? overview.analyticsSummary.todayVisitors : 0}
            </div>
          </div>
          <div className="p-3 bg-slate-900/70 border border-slate-800 rounded-xl">
            <div className="text-slate-400 text-[11px]">Today&apos;s Tool Actions</div>
            <div className="font-semibold text-amber-400 text-lg mt-0.5 font-mono">
              {overview?.analyticsSummary ? overview.analyticsSummary.todayToolUses : 0}
            </div>
          </div>
          <div className="p-3 bg-slate-900/70 border border-slate-800 rounded-xl">
            <div className="text-slate-400 text-[11px]">Today&apos;s PDF Exports</div>
            <div className="font-semibold text-violet-400 text-lg mt-0.5 font-mono">
              {overview?.analyticsSummary ? overview.analyticsSummary.todayExports : 0}
            </div>
          </div>
        </div>
      </div>

      {/* Cloud Run Storage Architecture Notice */}
      <div className="bg-[#111724] border border-slate-800 rounded-2xl p-6">
        <div className="flex items-start gap-3.5">
          <HardDrive className="w-5 h-5 text-amber-400 shrink-0 mt-0.5" />
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <h3 className="text-sm font-bold text-white">Storage Driver Architecture Notice</h3>
              <span className="text-[10px] uppercase font-mono px-2 py-0.5 rounded bg-amber-950/60 text-amber-400 border border-amber-800/60">
                Cloud Run Ephemeral Note
              </span>
            </div>
            <p className="text-xs text-slate-300 leading-relaxed">
              <strong>Active Storage Engine:</strong> <span className="text-emerald-400 font-mono">{overview?.storageDriver || 'JSON Storage Driver'}</span>.
              Local container storage on Cloud Run is ephemeral across instance replacement. For Phase 1, the repository layer (<code className="text-slate-300 font-mono">server/data/repository.ts</code>) completely abstracts the storage driver. The Admin UI communicates strictly through this interface, ensuring an instant, non-breaking upgrade path to Cloud SQL, PostgreSQL, or Firestore whenever long-term multi-instance persistence is required.
            </p>
          </div>
        </div>
      </div>

      {/* Quick Website Navigation Cards */}
      <div className="bg-[#111724] border border-slate-800 rounded-2xl p-6">
        <h3 className="text-sm font-bold text-white uppercase tracking-wider mb-4">
          Quick Access: Verify Live Public Website
        </h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
          <a
            href="/"
            target="_blank"
            rel="noopener noreferrer"
            className="p-4 bg-slate-900 hover:bg-slate-800/80 border border-slate-800 hover:border-slate-700 rounded-xl transition-all group"
          >
            <div className="flex items-center justify-between text-xs font-semibold text-white mb-1">
              <span>Homepage & Hub</span>
              <ExternalLink className="w-3.5 h-3.5 text-slate-400 group-hover:text-emerald-400 transition-colors" />
            </div>
            <p className="text-[11px] text-slate-400">
              Review live tools, scanner, image tools, and GPA calculator
            </p>
          </a>

          <a
            href="/?tab=resume"
            target="_blank"
            rel="noopener noreferrer"
            className="p-4 bg-slate-900 hover:bg-slate-800/80 border border-slate-800 hover:border-slate-700 rounded-xl transition-all group"
          >
            <div className="flex items-center justify-between text-xs font-semibold text-emerald-400 mb-1">
              <span>Resume Builder</span>
              <ExternalLink className="w-3.5 h-3.5 text-emerald-400" />
            </div>
            <p className="text-[11px] text-slate-400">
              Verify all 10 templates, Japanese JIS format, and PDF export
            </p>
          </a>

          <a
            href="/blog/"
            target="_blank"
            rel="noopener noreferrer"
            className="p-4 bg-slate-900 hover:bg-slate-800/80 border border-slate-800 hover:border-slate-700 rounded-xl transition-all group"
          >
            <div className="flex items-center justify-between text-xs font-semibold text-white mb-1">
              <span>Public Blog</span>
              <ExternalLink className="w-3.5 h-3.5 text-slate-400 group-hover:text-emerald-400 transition-colors" />
            </div>
            <p className="text-[11px] text-slate-400">
              Check live article feed and category filters
            </p>
          </a>

          <a
            href="/about.html"
            target="_blank"
            rel="noopener noreferrer"
            className="p-4 bg-slate-900 hover:bg-slate-800/80 border border-slate-800 hover:border-slate-700 rounded-xl transition-all group"
          >
            <div className="flex items-center justify-between text-xs font-semibold text-white mb-1">
              <span>About & Policies</span>
              <ExternalLink className="w-3.5 h-3.5 text-slate-400 group-hover:text-emerald-400 transition-colors" />
            </div>
            <p className="text-[11px] text-slate-400">
              Check static pages: contact, FAQ, privacy, and terms
            </p>
          </a>
        </div>
      </div>
    </div>
  );
};
