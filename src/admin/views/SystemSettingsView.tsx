import React, { useState, useEffect } from 'react';
import { Settings, Server, HardDrive, ShieldCheck, RefreshCw } from 'lucide-react';

interface SystemInfo {
  nodeVersion: string;
  platform: string;
  uptimeSeconds: number;
  environment: string;
  storageDriver: string;
  storagePersistenceNote: string;
}

export const SystemSettingsView: React.FC = () => {
  const [info, setInfo] = useState<SystemInfo | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchSystem = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/admin/system');
      if (res.ok) {
        const data = await res.json();
        setInfo(data);
      }
    } catch (err) {
      console.error('Failed to fetch system info:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSystem();
  }, []);

  return (
    <div className="p-4 md:p-8 max-w-5xl mx-auto space-y-6">
      <div className="flex items-center justify-between bg-[#111724] border border-slate-800 rounded-2xl p-6">
        <div>
          <h2 className="text-lg font-bold text-white tracking-tight flex items-center gap-2">
            <Settings className="w-5 h-5 text-emerald-400" />
            System Architecture & Environment
          </h2>
          <p className="text-xs text-slate-400 mt-1">
            Server runtime inspection, storage abstraction driver, and security posture.
          </p>
        </div>

        <button
          onClick={fetchSystem}
          disabled={loading}
          className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-slate-900 hover:bg-slate-800 border border-slate-700/80 text-xs font-medium text-slate-200 transition-colors cursor-pointer disabled:opacity-50"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin text-emerald-400' : 'text-slate-400'}`} />
          <span>Refresh</span>
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Runtime Environment Card */}
        <div className="bg-[#111724] border border-slate-800 rounded-2xl p-6 space-y-4">
          <h3 className="text-sm font-bold text-slate-200 uppercase tracking-wider flex items-center gap-2">
            <Server className="w-4 h-4 text-sky-400" />
            Server Runtime
          </h3>

          <div className="space-y-3 text-xs">
            <div className="flex justify-between py-1.5 border-b border-slate-800/80">
              <span className="text-slate-400">Node.js Engine:</span>
              <span className="font-mono text-slate-200">{info?.nodeVersion || '—'}</span>
            </div>
            <div className="flex justify-between py-1.5 border-b border-slate-800/80">
              <span className="text-slate-400">Operating System / Platform:</span>
              <span className="font-mono text-slate-200">{info?.platform || '—'}</span>
            </div>
            <div className="flex justify-between py-1.5 border-b border-slate-800/80">
              <span className="text-slate-400">Deployment Environment:</span>
              <span className="font-mono text-emerald-400">{info?.environment || '—'}</span>
            </div>
            <div className="flex justify-between py-1.5 border-b border-slate-800/80">
              <span className="text-slate-400">Process Uptime:</span>
              <span className="font-mono text-slate-200">
                {info ? `${info.uptimeSeconds} seconds` : '—'}
              </span>
            </div>
          </div>
        </div>

        {/* Storage Driver Card */}
        <div className="bg-[#111724] border border-slate-800 rounded-2xl p-6 space-y-4">
          <h3 className="text-sm font-bold text-slate-200 uppercase tracking-wider flex items-center gap-2">
            <HardDrive className="w-4 h-4 text-amber-400" />
            Persistence Layer
          </h3>

          <div className="space-y-3 text-xs">
            <div className="flex justify-between py-1.5 border-b border-slate-800/80">
              <span className="text-slate-400">Active Storage Driver:</span>
              <span className="font-mono text-amber-400">{info?.storageDriver || '—'}</span>
            </div>
            <div className="flex justify-between py-1.5 border-b border-slate-800/80">
              <span className="text-slate-400">Interface Decoupling:</span>
              <span className="text-emerald-400 font-semibold">IStorageDriver (Abstracted)</span>
            </div>
            <div className="flex justify-between py-1.5 border-b border-slate-800/80">
              <span className="text-slate-400">Cloud Run Persistence:</span>
              <span className="text-amber-400 font-medium">Instance Ephemeral</span>
            </div>
          </div>

          <p className="text-[11px] text-slate-400 leading-relaxed bg-slate-900/60 p-3 rounded-xl border border-slate-800">
            {info?.storagePersistenceNote || 'Storage layer ready for database driver.'}
          </p>
        </div>
      </div>

      {/* Security Specifications Card */}
      <div className="bg-[#111724] border border-slate-800 rounded-2xl p-6 space-y-4">
        <h3 className="text-sm font-bold text-slate-200 uppercase tracking-wider flex items-center gap-2">
          <ShieldCheck className="w-4 h-4 text-emerald-400" />
          Security Architecture Verification
        </h3>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 text-xs">
          <div className="p-3 bg-slate-900/70 border border-slate-800 rounded-xl">
            <div className="text-slate-400 text-[11px]">Password Encryption</div>
            <div className="text-emerald-400 font-mono font-medium mt-1">Node crypto.scrypt + Salt</div>
          </div>
          <div className="p-3 bg-slate-900/70 border border-slate-800 rounded-xl">
            <div className="text-slate-400 text-[11px]">Session Protection</div>
            <div className="text-emerald-400 font-mono font-medium mt-1">HttpOnly, SameSite Cookies</div>
          </div>
          <div className="p-3 bg-slate-900/70 border border-slate-800 rounded-xl">
            <div className="text-slate-400 text-[11px]">Brute-Force Shield</div>
            <div className="text-emerald-400 font-mono font-medium mt-1">Rate-Limiter (5 Max / 15m)</div>
          </div>
        </div>
      </div>
    </div>
  );
};
