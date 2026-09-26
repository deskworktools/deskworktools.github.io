import React, { useState, useEffect, useCallback } from 'react';
import {
  BarChart3,
  Users,
  Eye,
  Wrench,
  Download,
  BookOpen,
  RefreshCw,
  AlertTriangle,
  ShieldCheck,
  Calendar,
  Layers,
  FileText,
  Clock,
  Trash2,
  CheckCircle2,
  Info,
} from 'lucide-react';
import { AnalyticsReport } from '../../../server/data/types.js';

export const AnalyticsView: React.FC = () => {
  const [report, setReport] = useState<AnalyticsReport | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [rangeDays, setRangeDays] = useState<number>(7);
  const [showPrivacyDetails, setShowPrivacyDetails] = useState(false);
  const [resetting, setResetting] = useState(false);
  const [showResetConfirm, setShowResetConfirm] = useState(false);
  const [resetSuccess, setResetSuccess] = useState(false);

  const fetchReport = useCallback(async (days: number) => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`/api/admin/analytics/report?range=${days}`, {
        credentials: 'include',
      });
      if (res.status === 401) {
        setError('Session expired or unauthorized. Please re-authenticate.');
        return;
      }
      if (!res.ok) {
        throw new Error(`Server returned HTTP ${res.status}`);
      }
      const data: AnalyticsReport = await res.json();
      setReport(data);
    } catch (err: any) {
      console.error('Failed to load analytics report:', err);
      setError('Could not retrieve analytics data. Check server connectivity.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchReport(rangeDays);
  }, [rangeDays, fetchReport]);

  const handleResetData = async () => {
    setResetting(true);
    try {
      const res = await fetch('/api/admin/analytics/reset', {
        method: 'DELETE',
        credentials: 'include',
      });
      if (res.ok) {
        setResetSuccess(true);
        setShowResetConfirm(false);
        await fetchReport(rangeDays);
        setTimeout(() => setResetSuccess(false), 4000);
      } else {
        alert('Failed to reset analytics.');
      }
    } catch (err) {
      console.error('Reset error:', err);
      alert('Error communicating with server.');
    } finally {
      setResetting(false);
    }
  };

  const hasData = report && report.totals.pageViews > 0;

  return (
    <div className="p-4 md:p-8 max-w-7xl mx-auto space-y-6 animate-fade-in text-slate-100">
      {/* Top Header Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-800 pb-5">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-xl md:text-2xl font-bold tracking-tight text-white flex items-center gap-2.5">
              <BarChart3 className="w-6 h-6 text-emerald-400" />
              Anonymous Analytics &amp; Reporting
            </h1>
            <span className="px-2 py-0.5 text-[10px] font-mono rounded bg-emerald-950 text-emerald-400 border border-emerald-800/80 uppercase">
              Phase 3
            </span>
          </div>
          <p className="text-xs md:text-sm text-slate-400 mt-1">
            Privacy-first anonymous telemetry. Zero tracking cookies, zero raw IPs, no cross-day profiling.
          </p>
        </div>

        <div className="flex items-center gap-2.5 flex-wrap">
          {/* Range Selector */}
          <div className="inline-flex items-center rounded-xl bg-slate-900 border border-slate-800 p-1 text-xs">
            <Calendar className="w-3.5 h-3.5 text-slate-500 ml-2 mr-1" />
            <button
              onClick={() => setRangeDays(1)}
              className={`px-2.5 py-1 rounded-lg font-medium transition-all ${
                rangeDays === 1
                  ? 'bg-emerald-500 text-slate-950 shadow-sm font-semibold'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              Today
            </button>
            <button
              onClick={() => setRangeDays(7)}
              className={`px-2.5 py-1 rounded-lg font-medium transition-all ${
                rangeDays === 7
                  ? 'bg-emerald-500 text-slate-950 shadow-sm font-semibold'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              7 Days
            </button>
            <button
              onClick={() => setRangeDays(30)}
              className={`px-2.5 py-1 rounded-lg font-medium transition-all ${
                rangeDays === 30
                  ? 'bg-emerald-500 text-slate-950 shadow-sm font-semibold'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              30 Days
            </button>
            <button
              onClick={() => setRangeDays(90)}
              className={`px-2.5 py-1 rounded-lg font-medium transition-all ${
                rangeDays === 90
                  ? 'bg-emerald-500 text-slate-950 shadow-sm font-semibold'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              All Time
            </button>
          </div>

          {/* Refresh Button */}
          <button
            onClick={() => fetchReport(rangeDays)}
            disabled={loading}
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-xl bg-slate-900 border border-slate-800 text-slate-300 hover:text-white hover:bg-slate-800 transition-all disabled:opacity-50"
            title="Refresh statistics"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin text-emerald-400' : ''}`} />
            Refresh
          </button>

          {/* Purge / Reset Button */}
          <button
            onClick={() => setShowResetConfirm(true)}
            className="flex items-center gap-1 px-2.5 py-1.5 text-xs rounded-xl bg-slate-900 border border-slate-800 text-slate-400 hover:text-rose-400 hover:border-rose-900/50 transition-all"
            title="Purge telemetry data"
          >
            <Trash2 className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {resetSuccess && (
        <div className="p-3 bg-emerald-950/60 border border-emerald-800 text-emerald-300 text-xs rounded-xl flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
          Analytics data purged successfully. Ephemeral counters have been reset.
        </div>
      )}

      {/* Cloud Run Ephemeral Storage Warning Banner */}
      <div className="bg-[#111724] border border-amber-500/30 rounded-2xl p-4 md:p-5 relative overflow-hidden">
        <div className="flex items-start gap-3.5">
          <div className="w-8 h-8 rounded-lg bg-amber-500/10 border border-amber-500/20 flex items-center justify-center shrink-0 mt-0.5">
            <AlertTriangle className="w-4 h-4 text-amber-400" />
          </div>
          <div className="space-y-1.5 text-xs md:text-sm">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="font-bold text-amber-300">Storage Notice:</span>
              <span className="font-mono text-[11px] px-2 py-0.5 rounded bg-amber-950/80 text-amber-300 border border-amber-800/60">
                Current storage: local JSON / development storage
              </span>
            </div>
            <p className="text-slate-300 leading-relaxed text-xs">
              This environment runs on containerized storage. Local filesystem JSON data is{' '}
              <strong className="text-amber-200">ephemeral</strong> and resets whenever Cloud Run replaces or scales container instances. The storage architecture is isolated via the <code className="text-slate-300 bg-slate-900 px-1 py-0.5 rounded border border-slate-800">IStorageDriver</code> interface, allowing straightforward zero-downtime migration to a durable cloud database (such as PostgreSQL, Cloud SQL, or Firestore) in subsequent updates.
            </p>
          </div>
        </div>
      </div>

      {/* Privacy Guarantee Disclosure Banner */}
      <div className="bg-[#111724] border border-slate-800 rounded-2xl p-4 text-xs">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <ShieldCheck className="w-4 h-4 text-emerald-400 shrink-0" />
            <span className="font-semibold text-white">Privacy-Preserving Telemetry Architecture</span>
            <span className="text-[11px] text-emerald-400 bg-emerald-950/70 border border-emerald-800/60 px-2 py-0.5 rounded-full">
              Zero Cookies &bull; No Raw IPs
            </span>
          </div>
          <button
            onClick={() => setShowPrivacyDetails(!showPrivacyDetails)}
            className="text-slate-400 hover:text-white underline text-[11px]"
          >
            {showPrivacyDetails ? 'Hide Details' : 'View Privacy Specification'}
          </button>
        </div>

        {showPrivacyDetails && (
          <div className="mt-3 pt-3 border-t border-slate-800/80 grid grid-cols-1 md:grid-cols-2 gap-3 text-slate-300 leading-relaxed">
            <div className="space-y-1">
              <span className="font-semibold text-white">1. What is Calculated:</span>
              <p className="text-[11px] text-slate-400">
                A one-way HMAC-SHA256 pseudo-identifier computed using the connection IP and a secret in-memory server salt. The salt rotates automatically every UTC day and is never written to disk.
              </p>
            </div>
            <div className="space-y-1">
              <span className="font-semibold text-white">2. What is Stored:</span>
              <p className="text-[11px] text-slate-400">
                Only truncated 16-character hashes for same-day visitor deduplication, along with aggregate integer counters. Zero IP addresses, form fields, resume texts, or query params are ever recorded.
              </p>
            </div>
            <div className="space-y-1">
              <span className="font-semibold text-white">3. Retention Window:</span>
              <p className="text-[11px] text-slate-400">
                Daily temporary hashes are wiped upon day rollover, preserving only the aggregate scalar count. Aggregated daily stats are pruned after 90 days. Recent events are capped at 100 entries.
              </p>
            </div>
            <div className="space-y-1">
              <span className="font-semibold text-white">4. Individual Identification:</span>
              <p className="text-[11px] text-slate-400">
                Non-reversible one-way HMAC-SHA256 with truncated output. Cross-day visitor correlation is prevented because the secret HMAC salt rotates every UTC day in memory and is never persisted to disk.
              </p>
            </div>
          </div>
        )}
      </div>

      {error && (
        <div className="p-4 bg-rose-950/60 border border-rose-800 text-rose-300 rounded-2xl text-xs flex items-center gap-2">
          <AlertTriangle className="w-4 h-4 shrink-0 text-rose-400" />
          {error}
        </div>
      )}

      {/* Primary Key Metric Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3.5">
        {/* Total Page Views */}
        <div className="bg-[#111724] border border-slate-800/90 rounded-2xl p-4 relative overflow-hidden">
          <div className="flex items-center justify-between text-slate-400 mb-2">
            <span className="text-[11px] font-medium uppercase tracking-wider text-slate-400">Page Views</span>
            <Eye className="w-4 h-4 text-sky-400" />
          </div>
          <div className="text-2xl md:text-3xl font-bold text-white tracking-tight">
            {report ? report.totals.pageViews.toLocaleString() : '—'}
          </div>
          <p className="text-[10px] text-slate-400 mt-1">
            {rangeDays === 1 ? 'Recorded today' : `Across last ${rangeDays} days`}
          </p>
        </div>

        {/* Unique Daily Visitors */}
        <div className="bg-[#111724] border border-slate-800/90 rounded-2xl p-4 relative overflow-hidden">
          <div className="flex items-center justify-between text-slate-400 mb-2">
            <span className="text-[11px] font-medium uppercase tracking-wider text-slate-400">Unique Visitors</span>
            <Users className="w-4 h-4 text-emerald-400" />
          </div>
          <div className="text-2xl md:text-3xl font-bold text-white tracking-tight">
            {report ? report.totals.uniqueVisitors.toLocaleString() : '—'}
          </div>
          <p className="text-[10px] text-slate-400 mt-1">
            Daily deduplicated (instance-local while using ephemeral storage)
          </p>
        </div>

        {/* Tool Actions & Uses */}
        <div className="bg-[#111724] border border-slate-800/90 rounded-2xl p-4 relative overflow-hidden">
          <div className="flex items-center justify-between text-slate-400 mb-2">
            <span className="text-[11px] font-medium uppercase tracking-wider text-slate-400">Tool Actions</span>
            <Wrench className="w-4 h-4 text-amber-400" />
          </div>
          <div className="text-2xl md:text-3xl font-bold text-white tracking-tight">
            {report ? report.totals.toolUses.toLocaleString() : '—'}
          </div>
          <p className="text-[10px] text-slate-400 mt-1">
            {report ? `${report.totals.toolOpens} tool tabs opened` : '—'}
          </p>
        </div>

        {/* PDF Exports Completed */}
        <div className="bg-[#111724] border border-slate-800/90 rounded-2xl p-4 relative overflow-hidden">
          <div className="flex items-center justify-between text-slate-400 mb-2">
            <span className="text-[11px] font-medium uppercase tracking-wider text-slate-400">PDF Exports</span>
            <Download className="w-4 h-4 text-violet-400" />
          </div>
          <div className="text-2xl md:text-3xl font-bold text-white tracking-tight">
            {report ? report.totals.exports.toLocaleString() : '—'}
          </div>
          <p className="text-[10px] text-slate-400 mt-1">
            Resume &amp; document downloads
          </p>
        </div>

        {/* Blog Article Views */}
        <div className="bg-[#111724] border border-slate-800/90 rounded-2xl p-4 relative overflow-hidden col-span-2 sm:col-span-1">
          <div className="flex items-center justify-between text-slate-400 mb-2">
            <span className="text-[11px] font-medium uppercase tracking-wider text-slate-400">Blog Views</span>
            <BookOpen className="w-4 h-4 text-emerald-400" />
          </div>
          <div className="text-2xl md:text-3xl font-bold text-white tracking-tight">
            {report ? report.totals.blogViews.toLocaleString() : '—'}
          </div>
          <p className="text-[10px] text-slate-400 mt-1">
            CMS article page reads
          </p>
        </div>
      </div>

      {/* Honest Empty State Check */}
      {!loading && !hasData && (
        <div className="bg-[#111724] border border-slate-800 rounded-2xl p-8 text-center space-y-3">
          <div className="w-12 h-12 rounded-2xl bg-slate-800/80 border border-slate-700/60 flex items-center justify-center text-slate-400 mx-auto">
            <Info className="w-6 h-6 text-slate-400" />
          </div>
          <h3 className="text-base font-bold text-white">No Telemetry Recorded Yet</h3>
          <p className="text-xs md:text-sm text-slate-400 max-w-xl mx-auto leading-relaxed">
            Telemetry ingestion is active and listening at <code className="text-slate-300 bg-slate-900 px-1 py-0.5 rounded border border-slate-800">POST /api/analytics/event</code>. As visitors navigate the public website, open tools (Resume Builder, GPA Calculator, Document Converter), or download PDFs, real anonymous events will immediately populate this dashboard.
          </p>
          <div className="pt-2">
            <a
              href="/"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-emerald-500 text-slate-950 text-xs font-semibold hover:bg-emerald-400 transition-all"
            >
              Open Public Site in New Tab to Test
            </a>
          </div>
        </div>
      )}

      {/* Detailed Aggregated Breakdowns */}
      {hasData && report && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Top Tools Breakdown */}
          <div className="bg-[#111724] border border-slate-800 rounded-2xl p-5 space-y-4">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div className="flex items-center gap-2">
                <Wrench className="w-4 h-4 text-amber-400" />
                <h2 className="text-sm font-bold text-white">Tool Utilization</h2>
              </div>
              <span className="text-[10px] text-slate-400 uppercase tracking-wider font-mono">
                Opens / Actions
              </span>
            </div>

            {report.topTools.length === 0 ? (
              <p className="text-xs text-slate-500 py-4 text-center">No tool events logged yet.</p>
            ) : (
              <div className="space-y-3">
                {report.topTools.map((t) => (
                  <div key={t.name} className="space-y-1">
                    <div className="flex items-center justify-between text-xs">
                      <span className="font-medium text-slate-300 capitalize">
                        {t.name.replace(/-/g, ' ')}
                      </span>
                      <span className="font-mono text-slate-400">
                        {t.uses} uses &bull; {t.opens} opens
                      </span>
                    </div>
                    <div className="w-full bg-slate-900 h-1.5 rounded-full overflow-hidden">
                      <div
                        className="bg-amber-400 h-full rounded-full"
                        style={{
                          width: `${Math.min(
                            100,
                            (t.total / Math.max(1, report.topTools[0].total)) * 100,
                          )}%`,
                        }}
                      />
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Top Exported Resume Templates */}
          <div className="bg-[#111724] border border-slate-800 rounded-2xl p-5 space-y-4">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div className="flex items-center gap-2">
                <Layers className="w-4 h-4 text-violet-400" />
                <h2 className="text-sm font-bold text-white">Exported Templates</h2>
              </div>
              <span className="text-[10px] text-slate-400 uppercase tracking-wider font-mono">
                Downloads
              </span>
            </div>

            {report.topTemplates.length === 0 ? (
              <p className="text-xs text-slate-500 py-4 text-center">No PDF exports logged yet.</p>
            ) : (
              <div className="space-y-3">
                {report.topTemplates.map((tmpl) => (
                  <div key={tmpl.name} className="space-y-1">
                    <div className="flex items-center justify-between text-xs">
                      <span className="font-medium text-slate-300 capitalize">
                        {tmpl.name.replace(/-/g, ' ')}
                      </span>
                      <span className="font-mono text-emerald-400 font-semibold">
                        {tmpl.exports} {tmpl.exports === 1 ? 'download' : 'downloads'}
                      </span>
                    </div>
                    <div className="w-full bg-slate-900 h-1.5 rounded-full overflow-hidden">
                      <div
                        className="bg-violet-400 h-full rounded-full"
                        style={{
                          width: `${Math.min(
                            100,
                            (tmpl.exports / Math.max(1, report.topTemplates[0].exports)) * 100,
                          )}%`,
                        }}
                      />
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Top Pages Visited */}
          <div className="bg-[#111724] border border-slate-800 rounded-2xl p-5 space-y-4">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div className="flex items-center gap-2">
                <FileText className="w-4 h-4 text-sky-400" />
                <h2 className="text-sm font-bold text-white">Top Visited Pages</h2>
              </div>
              <span className="text-[10px] text-slate-400 uppercase tracking-wider font-mono">
                Views
              </span>
            </div>

            {report.topPages.length === 0 ? (
              <p className="text-xs text-slate-500 py-4 text-center">No page views recorded yet.</p>
            ) : (
              <div className="space-y-3">
                {report.topPages.slice(0, 7).map((p) => (
                  <div key={p.path} className="flex items-center justify-between text-xs">
                    <span className="font-mono text-slate-300 truncate max-w-[200px]" title={p.path}>
                      {p.path}
                    </span>
                    <span className="font-mono text-sky-400 font-semibold px-2 py-0.5 rounded bg-sky-950/60 border border-sky-800/40">
                      {p.views}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* Daily Trends Table */}
      {hasData && report && report.dailyTrends.length > 0 && (
        <div className="bg-[#111724] border border-slate-800 rounded-2xl p-5 space-y-4">
          <div className="flex items-center justify-between border-b border-slate-800 pb-3">
            <div className="flex items-center gap-2">
              <Calendar className="w-4 h-4 text-emerald-400" />
              <h2 className="text-sm font-bold text-white">Daily Activity Trends</h2>
            </div>
            <span className="text-xs text-slate-400">
              {report.dateRange.start} &rarr; {report.dateRange.end}
            </span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs text-slate-300">
              <thead className="bg-slate-900/80 text-slate-400 uppercase font-mono text-[10px] border-b border-slate-800">
                <tr>
                  <th className="py-2.5 px-3">Date (UTC)</th>
                  <th className="py-2.5 px-3 text-right">Page Views</th>
                  <th className="py-2.5 px-3 text-right">Unique Visitors</th>
                  <th className="py-2.5 px-3 text-right">Tool Uses</th>
                  <th className="py-2.5 px-3 text-right">PDF Exports</th>
                  <th className="py-2.5 px-3 text-right">Blog Reads</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60 font-mono">
                {report.dailyTrends.map((d) => (
                  <tr key={d.date} className="hover:bg-slate-800/30 transition-colors">
                    <td className="py-2 px-3 font-semibold text-white">{d.date}</td>
                    <td className="py-2 px-3 text-right text-sky-400">{d.pageViews}</td>
                    <td className="py-2 px-3 text-right text-emerald-400">{d.uniqueVisitors}</td>
                    <td className="py-2 px-3 text-right text-amber-400">{d.toolUses}</td>
                    <td className="py-2 px-3 text-right text-violet-400">{d.exports}</td>
                    <td className="py-2 px-3 text-right text-slate-300">{d.blogViews}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Recent Anonymous Events Stream */}
      {hasData && report && report.recentEvents.length > 0 && (
        <div className="bg-[#111724] border border-slate-800 rounded-2xl p-5 space-y-3">
          <div className="flex items-center justify-between border-b border-slate-800 pb-3">
            <div className="flex items-center gap-2">
              <Clock className="w-4 h-4 text-slate-400" />
              <h2 className="text-sm font-bold text-white">Recent Anonymous Telemetry Stream</h2>
            </div>
            <span className="text-[10px] text-slate-500 font-mono">
              Latest {report.recentEvents.length} events
            </span>
          </div>

          <div className="space-y-1.5 max-h-72 overflow-y-auto pr-1">
            {report.recentEvents.map((ev) => (
              <div
                key={ev.id}
                className="flex items-center justify-between px-3 py-2 rounded-xl bg-slate-900/70 border border-slate-800/70 text-xs font-mono"
              >
                <div className="flex items-center gap-2.5">
                  <span
                    className={`px-1.5 py-0.5 rounded text-[10px] uppercase font-bold ${
                      ev.eventType === 'page_view'
                        ? 'bg-sky-950 text-sky-400 border border-sky-800/50'
                        : ev.eventType === 'export_completed'
                        ? 'bg-violet-950 text-violet-400 border border-violet-800/50'
                        : ev.eventType === 'tool_used'
                        ? 'bg-amber-950 text-amber-400 border border-amber-800/50'
                        : ev.eventType === 'tool_opened'
                        ? 'bg-slate-800 text-slate-300 border border-slate-700/50'
                        : 'bg-emerald-950 text-emerald-400 border border-emerald-800/50'
                    }`}
                  >
                    {ev.eventType}
                  </span>
                  <span className="text-slate-200 font-medium truncate max-w-xs md:max-w-md">
                    {ev.target}
                  </span>
                </div>
                <span className="text-[11px] text-slate-400 shrink-0">
                  {new Date(ev.timestamp).toLocaleTimeString([], {
                    hour: '2-digit',
                    minute: '2-digit',
                    second: '2-digit',
                  })}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Reset Confirmation Modal */}
      {showResetConfirm && (
        <div className="fixed inset-0 bg-black/75 z-50 flex items-center justify-center p-4">
          <div className="bg-[#111724] border border-slate-800 rounded-2xl max-w-md w-full p-6 space-y-4 shadow-2xl">
            <div className="flex items-center gap-3 text-rose-400">
              <AlertTriangle className="w-6 h-6 shrink-0" />
              <h3 className="text-base font-bold text-white">Purge Telemetry Data?</h3>
            </div>
            <p className="text-xs text-slate-300 leading-relaxed">
              This will reset all in-memory and local JSON telemetry counters to zero. This administrative action will be permanently recorded in the Admin Activity Log.
            </p>
            <div className="flex items-center justify-end gap-2.5 pt-2">
              <button
                onClick={() => setShowResetConfirm(false)}
                className="px-3.5 py-1.5 rounded-xl border border-slate-800 text-slate-300 hover:bg-slate-800 text-xs font-medium"
              >
                Cancel
              </button>
              <button
                onClick={handleResetData}
                disabled={resetting}
                className="px-3.5 py-1.5 rounded-xl bg-rose-600 hover:bg-rose-500 text-white text-xs font-semibold shadow-sm transition-all"
              >
                {resetting ? 'Purging...' : 'Confirm Purge'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
