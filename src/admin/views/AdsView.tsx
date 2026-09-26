import React, { useState, useEffect, useCallback } from 'react';
import {
  DollarSign,
  Power,
  RefreshCw,
  AlertTriangle,
  CheckCircle2,
  Edit3,
  Sliders,
  Globe,
  Smartphone,
  Monitor,
  ExternalLink,
  Shield,
  Layers,
  X,
  Save,
  Info,
  Radio,
  Clock,
} from 'lucide-react';
import {
  AdPlacement,
  AdProvidersConfig,
  AdGlobalSettings,
  AdminAdsConfigResponse,
  CustomBannerConfig,
} from '../../../server/data/types.js';

export const AdsView: React.FC = () => {
  const [config, setConfig] = useState<AdminAdsConfigResponse | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [togglingGlobal, setTogglingGlobal] = useState<boolean>(false);

  // Active Tab
  const [activeTab, setActiveTab] = useState<'slots' | 'providers'>('slots');

  // Edit Slot Modal State
  const [editingSlot, setEditingSlot] = useState<AdPlacement | null>(null);
  const [slotForm, setSlotForm] = useState<{
    name: string;
    location: AdPlacement['location'];
    provider: AdPlacement['provider'];
    device: AdPlacement['device'];
    enabled: boolean;
    adUnitId: string;
    format: 'auto' | 'horizontal' | 'rectangle' | 'banner';
    customBanner: CustomBannerConfig;
    notes: string;
  }>({
    name: '',
    location: 'header',
    provider: 'adsense',
    device: 'all',
    enabled: false,
    adUnitId: '',
    format: 'auto',
    customBanner: {
      imageUrl: '',
      destinationUrl: '',
      altText: '',
      title: '',
    },
    notes: '',
  });
  const [savingSlot, setSavingSlot] = useState<boolean>(false);
  const [slotModalError, setSlotModalError] = useState<string | null>(null);

  // Providers Form State
  const [providerForm, setProviderForm] = useState<AdProvidersConfig>({
    adsense: { enabled: false, publisherId: '', autoAdsEnabled: false, notes: '' },
    adsterra: { enabled: false, placementKey: '', notes: '' },
    custom: { enabled: false, notes: '' },
  });
  const [savingProviders, setSavingProviders] = useState<boolean>(false);
  const [providerFormError, setProviderFormError] = useState<string | null>(null);

  // Fetch full configuration
  const fetchConfig = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch('/api/admin/ads/config', { credentials: 'same-origin' });
      if (!res.ok) {
        if (res.status === 401) {
          throw new Error('Admin session expired. Please re-authenticate.');
        }
        throw new Error(`Failed to load ads configuration (HTTP ${res.status}).`);
      }
      const data: AdminAdsConfigResponse = await res.json();
      setConfig(data);
      setProviderForm(data.providers);
    } catch (err: any) {
      setError(err.message || 'Error communicating with ad server.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchConfig();
  }, [fetchConfig]);

  // Flash temporary success notification
  const notifySuccess = (msg: string) => {
    setSuccessMessage(msg);
    setTimeout(() => {
      setSuccessMessage(null);
    }, 4000);
  };

  // Master Global Switch Toggle
  const handleToggleGlobal = async () => {
    if (!config) return;
    setTogglingGlobal(true);
    setError(null);
    try {
      const nextState = !config.global.globalEnabled;
      const res = await fetch('/api/admin/ads/global', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'same-origin',
        body: JSON.stringify({ globalEnabled: nextState }),
      });

      if (!res.ok) {
        const errJson = await res.json().catch(() => ({}));
        throw new Error(errJson.error || 'Failed to update master ad switch');
      }

      const updatedGlobal: AdGlobalSettings = await res.json();
      setConfig((prev) => (prev ? { ...prev, global: updatedGlobal } : null));
      notifySuccess(`Master ad serving is now ${nextState ? 'ENABLED' : 'PAUSED'}.`);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setTogglingGlobal(false);
    }
  };

  // Quick toggle individual slot
  const handleToggleSlot = async (slot: AdPlacement) => {
    try {
      const nextEnabled = !slot.enabled;
      const res = await fetch(`/api/admin/ads/slots/${encodeURIComponent(slot.id)}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'same-origin',
        body: JSON.stringify({ enabled: nextEnabled }),
      });

      if (!res.ok) {
        const errJson = await res.json().catch(() => ({}));
        throw new Error(errJson.error || 'Failed to toggle slot');
      }

      const updatedSlot: AdPlacement = await res.json();
      setConfig((prev) => {
        if (!prev) return null;
        return {
          ...prev,
          slots: prev.slots.map((s) => (s.id === updatedSlot.id ? updatedSlot : s)),
        };
      });
      notifySuccess(`Slot "${slot.name}" set to ${nextEnabled ? 'Active' : 'Disabled'}.`);
    } catch (err: any) {
      setError(err.message);
    }
  };

  // Open Edit Slot Modal
  const openEditSlot = (slot: AdPlacement) => {
    setEditingSlot(slot);
    setSlotModalError(null);
    setSlotForm({
      name: slot.name,
      location: slot.location,
      provider: slot.provider,
      device: slot.device,
      enabled: slot.enabled,
      adUnitId: slot.adUnitId || '',
      format: slot.format || 'auto',
      customBanner: slot.customBanner || {
        imageUrl: '',
        destinationUrl: '',
        altText: '',
        title: '',
      },
      notes: slot.notes || '',
    });
  };

  const closeEditSlot = () => {
    setEditingSlot(null);
    setSlotModalError(null);
  };

  // Save Slot from Modal
  const handleSaveSlot = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingSlot) return;

    setSavingSlot(true);
    setSlotModalError(null);

    try {
      const payload: any = {
        name: slotForm.name.trim(),
        location: slotForm.location,
        provider: slotForm.provider,
        device: slotForm.device,
        enabled: slotForm.enabled,
        adUnitId: slotForm.adUnitId.trim(),
        format: slotForm.format,
        notes: slotForm.notes.trim(),
      };

      if (slotForm.provider === 'custom') {
        if (!slotForm.customBanner.imageUrl.trim() || !slotForm.customBanner.destinationUrl.trim()) {
          throw new Error('Custom provider requires both a valid Image URL and Destination URL.');
        }
        payload.customBanner = {
          imageUrl: slotForm.customBanner.imageUrl.trim(),
          destinationUrl: slotForm.customBanner.destinationUrl.trim(),
          altText: slotForm.customBanner.altText.trim() || 'Advertisement',
          title: slotForm.customBanner.title?.trim() || undefined,
        };
      } else {
        payload.customBanner = null;
      }

      const res = await fetch(`/api/admin/ads/slots/${encodeURIComponent(editingSlot.id)}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'same-origin',
        body: JSON.stringify(payload),
      });

      if (!res.ok) {
        const errJson = await res.json().catch(() => ({}));
        throw new Error(errJson.error || 'Failed to update slot.');
      }

      const updatedSlot: AdPlacement = await res.json();
      setConfig((prev) => {
        if (!prev) return null;
        return {
          ...prev,
          slots: prev.slots.map((s) => (s.id === updatedSlot.id ? updatedSlot : s)),
        };
      });

      notifySuccess(`Ad slot "${updatedSlot.name}" updated successfully.`);
      closeEditSlot();
    } catch (err: any) {
      setSlotModalError(err.message);
    } finally {
      setSavingSlot(false);
    }
  };

  // Save Providers Settings
  const handleSaveProviders = async (e: React.FormEvent) => {
    e.preventDefault();
    setSavingProviders(true);
    setProviderFormError(null);

    try {
      const pubId = providerForm.adsense.publisherId.trim();
      if (pubId && !/^ca-pub-\d{10,20}$/.test(pubId)) {
        throw new Error('AdSense Publisher ID must match format "ca-pub-XXXXXXXXXXXXXXXX" with 10-20 digits.');
      }

      const res = await fetch('/api/admin/ads/providers', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'same-origin',
        body: JSON.stringify(providerForm),
      });

      if (!res.ok) {
        const errJson = await res.json().catch(() => ({}));
        throw new Error(errJson.error || 'Failed to update ad providers.');
      }

      const updatedProviders: AdProvidersConfig = await res.json();
      setConfig((prev) => (prev ? { ...prev, providers: updatedProviders } : null));
      notifySuccess('Ad provider configurations saved successfully.');
    } catch (err: any) {
      setProviderFormError(err.message);
    } finally {
      setSavingProviders(false);
    }
  };

  // Compute stats
  const totalSlots = config?.slots.length || 0;
  const activeSlotsCount =
    config?.slots.filter((s) => {
      if (!s.enabled) return false;
      if (!config.global.globalEnabled) return false;
      if (s.provider === 'adsense') return config.providers.adsense.enabled && Boolean(config.providers.adsense.publisherId);
      if (s.provider === 'adsterra') return config.providers.adsterra.enabled;
      if (s.provider === 'custom') return config.providers.custom.enabled;
      return false;
    }).length || 0;

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-12">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b border-slate-800 pb-5">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-white flex items-center gap-2.5">
            <DollarSign className="w-6 h-6 text-emerald-400" />
            Ads &amp; Monetization Manager
          </h1>
          <p className="text-sm text-slate-400 mt-1">
            Centrally manage public advertising slots, publisher IDs, and banner placements without editing website source files.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={fetchConfig}
            disabled={loading}
            className="flex items-center gap-2 px-3 py-2 rounded-lg bg-[#111724] border border-slate-800 text-xs font-medium text-slate-300 hover:text-white hover:border-slate-700 transition-colors disabled:opacity-50"
            title="Refresh current ad configuration"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
            Refresh
          </button>
        </div>
      </div>

      {/* Cloud Run Ephemeral Storage Notice */}
      <div className="p-4 rounded-xl bg-amber-950/20 border border-amber-800/40 text-amber-300 flex items-start gap-3">
        <Info className="w-5 h-5 text-amber-400 shrink-0 mt-0.5" />
        <div className="text-xs leading-relaxed">
          <span className="font-semibold text-amber-200">Storage Notice: </span>
          Current storage: local JSON / development storage. Ephemeral on Cloud Run container replacement. Ads configuration resets when new instances deploy until migration to durable cloud storage.
        </div>
      </div>

      {/* Alerts */}
      {error && (
        <div className="p-4 rounded-xl bg-rose-950/40 border border-rose-800/60 text-rose-300 text-xs flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <AlertTriangle className="w-4 h-4 text-rose-400 shrink-0" />
            <span>{error}</span>
          </div>
          <button
            type="button"
            onClick={() => setError(null)}
            className="text-slate-400 hover:text-white ml-2"
          >
            &times;
          </button>
        </div>
      )}

      {successMessage && (
        <div className="p-4 rounded-xl bg-emerald-950/40 border border-emerald-800/60 text-emerald-300 text-xs flex items-center gap-2.5">
          <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
          <span>{successMessage}</span>
        </div>
      )}

      {/* Top Overview Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Master Ad Serving Status Card */}
        <div className="bg-[#111724] border border-slate-800/90 rounded-2xl p-5 relative overflow-hidden flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between text-slate-400 mb-2">
              <span className="text-xs font-medium uppercase tracking-wider">Master Ad Serving</span>
              <Power className={`w-4 h-4 ${config?.global.globalEnabled ? 'text-emerald-400' : 'text-slate-500'}`} />
            </div>
            <div className="flex items-center gap-2.5 mt-2">
              <span
                className={`w-3 h-3 rounded-full ${
                  config?.global.globalEnabled
                    ? 'bg-emerald-500 shadow-sm shadow-emerald-500/50 animate-pulse'
                    : 'bg-rose-500'
                }`}
              />
              <span className="text-xl font-bold text-white tracking-tight">
                {config?.global.globalEnabled ? 'ACTIVE (LIVE)' : 'PAUSED'}
              </span>
            </div>
          </div>
          <div className="mt-4 pt-3 border-t border-slate-800/60 flex items-center justify-between">
            <span className="text-[11px] text-slate-400">Master site kill-switch</span>
            <button
              type="button"
              onClick={handleToggleGlobal}
              disabled={togglingGlobal || loading}
              className={`px-2.5 py-1 rounded text-xs font-semibold transition-colors ${
                config?.global.globalEnabled
                  ? 'bg-rose-950/80 text-rose-300 hover:bg-rose-900 border border-rose-800/60'
                  : 'bg-emerald-950/80 text-emerald-300 hover:bg-emerald-900 border border-emerald-800/60'
              } disabled:opacity-50`}
            >
              {config?.global.globalEnabled ? 'Pause All' : 'Enable Ads'}
            </button>
          </div>
        </div>

        {/* Total Configured Slots */}
        <div className="bg-[#111724] border border-slate-800/90 rounded-2xl p-5 relative overflow-hidden flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between text-slate-400 mb-2">
              <span className="text-xs font-medium uppercase tracking-wider">Total Ad Slots</span>
              <Layers className="w-4 h-4 text-cyan-400" />
            </div>
            <div className="text-3xl font-bold text-white tracking-tight mt-1">
              {totalSlots}
            </div>
          </div>
          <p className="text-[11px] text-slate-400 mt-4 pt-3 border-t border-slate-800/60">
            Header, homepage, blog, tool &amp; mobile targets
          </p>
        </div>

        {/* Active Live Ad Units */}
        <div className="bg-[#111724] border border-slate-800/90 rounded-2xl p-5 relative overflow-hidden flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between text-slate-400 mb-2">
              <span className="text-xs font-medium uppercase tracking-wider">Live Ad Units</span>
              <Radio className={`w-4 h-4 ${activeSlotsCount > 0 ? 'text-emerald-400' : 'text-slate-500'}`} />
            </div>
            <div className="text-3xl font-bold text-white tracking-tight mt-1">
              {activeSlotsCount}
            </div>
          </div>
          <p className="text-[11px] text-slate-400 mt-4 pt-3 border-t border-slate-800/60">
            {config?.global.globalEnabled
              ? `${activeSlotsCount} of ${totalSlots} currently eligible to render`
              : '0 units rendering (Master switch paused)'}
          </p>
        </div>

        {/* Provider Integration Status */}
        <div className="bg-[#111724] border border-slate-800/90 rounded-2xl p-5 relative overflow-hidden flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between text-slate-400 mb-2">
              <span className="text-xs font-medium uppercase tracking-wider">Active Providers</span>
              <Shield className="w-4 h-4 text-indigo-400" />
            </div>
            <div className="flex flex-wrap gap-1.5 mt-2">
              <span
                className={`text-[10px] font-medium px-2 py-0.5 rounded border ${
                  config?.providers.adsense.enabled && config.providers.adsense.publisherId
                    ? 'bg-emerald-950/60 text-emerald-300 border-emerald-800/60'
                    : 'bg-slate-900 text-slate-400 border-slate-800'
                }`}
              >
                AdSense: {config?.providers.adsense.enabled ? 'ON' : 'OFF'}
              </span>
              <span
                className={`text-[10px] font-medium px-2 py-0.5 rounded border ${
                  config?.providers.adsterra.enabled
                    ? 'bg-emerald-950/60 text-emerald-300 border-emerald-800/60'
                    : 'bg-slate-900 text-slate-400 border-slate-800'
                }`}
              >
                Adsterra: {config?.providers.adsterra.enabled ? 'ON' : 'OFF'}
              </span>
              <span
                className={`text-[10px] font-medium px-2 py-0.5 rounded border ${
                  config?.providers.custom.enabled
                    ? 'bg-emerald-950/60 text-emerald-300 border-emerald-800/60'
                    : 'bg-slate-900 text-slate-400 border-slate-800'
                }`}
              >
                Custom: {config?.providers.custom.enabled ? 'ON' : 'OFF'}
              </span>
            </div>
          </div>
          <p className="text-[11px] text-slate-400 mt-4 pt-3 border-t border-slate-800/60">
            {config?.global.updatedAt
              ? `Last updated ${new Date(config.global.updatedAt).toLocaleDateString()}`
              : 'Configured'}
          </p>
        </div>
      </div>

      {/* Real-World Provider Performance Policy Disclaimer */}
      <div className="p-4 rounded-xl bg-[#111724] border border-slate-800 text-xs text-slate-300 flex items-start gap-3">
        <Info className="w-4 h-4 text-cyan-400 shrink-0 mt-0.5" />
        <div className="space-y-1">
          <p className="font-semibold text-white">
            Provider Performance Data: Not Connected
          </p>
          <p className="text-slate-400 leading-relaxed">
            Real-time AdSense / Adsterra API reporting is not integrated. Deskwork Tools does not simulate, fabricate, or estimate revenue, RPM, CPC, CTR, impressions, or earnings. View verified performance and payout details directly in your official Google AdSense or Adsterra publisher consoles.
          </p>
        </div>
      </div>

      {/* Tab Controls */}
      <div className="flex border-b border-slate-800 gap-6">
        <button
          type="button"
          onClick={() => setActiveTab('slots')}
          className={`pb-3 text-sm font-semibold border-b-2 transition-colors flex items-center gap-2 ${
            activeTab === 'slots'
              ? 'border-emerald-400 text-emerald-400'
              : 'border-transparent text-slate-400 hover:text-slate-200'
          }`}
        >
          <Layers className="w-4 h-4" />
          Ad Placements / Slots ({totalSlots})
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('providers')}
          className={`pb-3 text-sm font-semibold border-b-2 transition-colors flex items-center gap-2 ${
            activeTab === 'providers'
              ? 'border-emerald-400 text-emerald-400'
              : 'border-transparent text-slate-400 hover:text-slate-200'
          }`}
        >
          <Sliders className="w-4 h-4" />
          Provider Configuration
        </button>
      </div>

      {/* TAB 1: AD PLACEMENTS TABLE */}
      {activeTab === 'slots' && (
        <div className="bg-[#111724] border border-slate-800 rounded-2xl overflow-hidden shadow-sm">
          <div className="p-4 border-b border-slate-800 flex items-center justify-between">
            <h2 className="text-sm font-bold text-white uppercase tracking-wider">
              Configured Placement Slots
            </h2>
            <span className="text-xs text-slate-400">
              Only verified public containers receive ad injections.
            </span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs text-slate-300">
              <thead className="bg-[#0b101b] text-slate-400 uppercase font-semibold text-[10px] tracking-wider border-b border-slate-800">
                <tr>
                  <th className="py-3 px-4">Placement Slot</th>
                  <th className="py-3 px-4">Target Location</th>
                  <th className="py-3 px-4">Provider</th>
                  <th className="py-3 px-4">Device</th>
                  <th className="py-3 px-4">Identifier / Target</th>
                  <th className="py-3 px-4">Status</th>
                  <th className="py-3 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/70">
                {config?.slots.map((slot) => {
                  const isProviderReady =
                    (slot.provider === 'adsense' &&
                      config.providers.adsense.enabled &&
                      Boolean(config.providers.adsense.publisherId)) ||
                    (slot.provider === 'adsterra' && config.providers.adsterra.enabled) ||
                    (slot.provider === 'custom' && config.providers.custom.enabled);

                  const isLive = config.global.globalEnabled && slot.enabled && isProviderReady;

                  return (
                    <tr key={slot.id} className="hover:bg-slate-800/30 transition-colors">
                      <td className="py-3.5 px-4">
                        <div className="font-semibold text-white">{slot.name}</div>
                        <div className="text-[10px] text-slate-400 font-mono mt-0.5">#{slot.id}</div>
                      </td>
                      <td className="py-3.5 px-4">
                        <span className="capitalize px-2 py-0.5 rounded bg-slate-800/80 text-slate-200 border border-slate-700/60 font-mono text-[11px]">
                          {slot.location}
                        </span>
                      </td>
                      <td className="py-3.5 px-4">
                        <span
                          className={`uppercase font-medium px-2 py-0.5 rounded text-[10px] border ${
                            slot.provider === 'adsense'
                              ? 'bg-blue-950/40 text-blue-300 border-blue-800/50'
                              : slot.provider === 'adsterra'
                              ? 'bg-orange-950/40 text-orange-300 border-orange-800/50'
                              : 'bg-emerald-950/40 text-emerald-300 border-emerald-800/50'
                          }`}
                        >
                          {slot.provider}
                        </span>
                      </td>
                      <td className="py-3.5 px-4">
                        <div className="flex items-center gap-1 text-slate-300">
                          {slot.device === 'desktop' && <Monitor className="w-3.5 h-3.5 text-slate-400" />}
                          {slot.device === 'mobile' && <Smartphone className="w-3.5 h-3.5 text-slate-400" />}
                          {slot.device === 'all' && <Globe className="w-3.5 h-3.5 text-slate-400" />}
                          <span className="capitalize">{slot.device}</span>
                        </div>
                      </td>
                      <td className="py-3.5 px-4 font-mono text-[11px] text-slate-300">
                        {slot.adUnitId ? (
                          <span>unit: {slot.adUnitId}</span>
                        ) : slot.customBanner?.destinationUrl ? (
                          <span className="text-emerald-400 truncate block max-w-[180px]">
                            {slot.customBanner.destinationUrl}
                          </span>
                        ) : (
                          <span className="text-slate-500 italic">Default Provider Unit</span>
                        )}
                      </td>
                      <td className="py-3.5 px-4">
                        <div className="flex items-center gap-2">
                          <button
                            type="button"
                            onClick={() => handleToggleSlot(slot)}
                            className={`px-2 py-0.5 rounded text-[11px] font-semibold border transition-colors ${
                              slot.enabled
                                ? 'bg-emerald-950/60 text-emerald-300 border-emerald-800/60 hover:bg-emerald-900/60'
                                : 'bg-slate-800 text-slate-400 border-slate-700 hover:bg-slate-700'
                            }`}
                          >
                            {slot.enabled ? 'Enabled' : 'Disabled'}
                          </button>
                          {isLive && (
                            <span
                              className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"
                              title="Live and rendering"
                            />
                          )}
                        </div>
                      </td>
                      <td className="py-3.5 px-4 text-right">
                        <button
                          type="button"
                          onClick={() => openEditSlot(slot)}
                          className="p-1.5 rounded-lg bg-slate-800 text-slate-300 hover:text-white hover:bg-slate-700 transition-colors inline-flex items-center gap-1 text-xs"
                          title="Configure slot details"
                        >
                          <Edit3 className="w-3.5 h-3.5" />
                          <span>Edit</span>
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* TAB 2: PROVIDER CONFIGURATION */}
      {activeTab === 'providers' && (
        <form onSubmit={handleSaveProviders} className="space-y-6">
          {providerFormError && (
            <div className="p-4 rounded-xl bg-rose-950/40 border border-rose-800/60 text-rose-300 text-xs flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 shrink-0" />
              <span>{providerFormError}</span>
            </div>
          )}

          {/* Google AdSense Card */}
          <div className="bg-[#111724] border border-slate-800 rounded-2xl p-5 space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 border-b border-slate-800 pb-3">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-lg bg-blue-950/60 border border-blue-800/60 flex items-center justify-center text-blue-400 font-bold">
                  G
                </div>
                <div>
                  <h3 className="text-sm font-bold text-white">Google AdSense</h3>
                  <p className="text-[11px] text-slate-400">
                    Official publisher identification for responsive banners and auto-ads.
                  </p>
                </div>
              </div>

              <label className="flex items-center gap-2 cursor-pointer text-xs font-semibold text-white">
                <input
                  type="checkbox"
                  checked={providerForm.adsense.enabled}
                  onChange={(e) =>
                    setProviderForm((prev) => ({
                      ...prev,
                      adsense: { ...prev.adsense, enabled: e.target.checked },
                    }))
                  }
                  className="w-4 h-4 rounded border-slate-700 bg-slate-900 text-emerald-500 focus:ring-emerald-500"
                />
                Enable AdSense
              </label>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-1">
              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1.5">
                  Publisher ID (Public Client ID)
                </label>
                <input
                  type="text"
                  placeholder="ca-pub-1234567890123456"
                  value={providerForm.adsense.publisherId}
                  onChange={(e) =>
                    setProviderForm((prev) => ({
                      ...prev,
                      adsense: { ...prev.adsense, publisherId: e.target.value.trim() },
                    }))
                  }
                  className="w-full px-3 py-2 rounded-lg bg-slate-900 border border-slate-700 text-xs text-white placeholder-slate-500 font-mono focus:outline-none focus:border-emerald-500"
                />
                <p className="text-[10px] text-slate-400 mt-1">
                  Format: <code>ca-pub-</code> followed by 10 to 20 digits. Publicly used by <code>adsbygoogle.js</code>.
                </p>
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1.5">
                  Auto-Ads Integration
                </label>
                <label className="flex items-center gap-2.5 cursor-pointer mt-2 text-xs text-slate-300">
                  <input
                    type="checkbox"
                    checked={providerForm.adsense.autoAdsEnabled}
                    onChange={(e) =>
                      setProviderForm((prev) => ({
                        ...prev,
                        adsense: { ...prev.adsense, autoAdsEnabled: e.target.checked },
                      }))
                    }
                    className="w-4 h-4 rounded border-slate-700 bg-slate-900 text-emerald-500 focus:ring-emerald-500"
                  />
                  <span>Automatically load Google AdSense script on public site</span>
                </label>
                <p className="text-[10px] text-slate-400 mt-1">
                  When enabled, deferred AdSense loader runs automatically when global serving is active.
                </p>
              </div>
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1.5">
                Internal Administrative Notes (Private)
              </label>
              <input
                type="text"
                placeholder="e.g. Account approved Sep 2026, payout threshold set"
                value={providerForm.adsense.notes || ''}
                onChange={(e) =>
                  setProviderForm((prev) => ({
                    ...prev,
                    adsense: { ...prev.adsense, notes: e.target.value },
                  }))
                }
                className="w-full px-3 py-2 rounded-lg bg-slate-900 border border-slate-700 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-emerald-500"
                maxLength={300}
              />
            </div>
          </div>

          {/* Adsterra Card */}
          <div className="bg-[#111724] border border-slate-800 rounded-2xl p-5 space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 border-b border-slate-800 pb-3">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-lg bg-orange-950/60 border border-orange-800/60 flex items-center justify-center text-orange-400 font-bold">
                  A
                </div>
                <div>
                  <h3 className="text-sm font-bold text-white">Adsterra Network</h3>
                  <p className="text-[11px] text-slate-400">
                    Secondary display network for tool work areas and mobile fallback slots.
                  </p>
                </div>
              </div>

              <label className="flex items-center gap-2 cursor-pointer text-xs font-semibold text-white">
                <input
                  type="checkbox"
                  checked={providerForm.adsterra.enabled}
                  onChange={(e) =>
                    setProviderForm((prev) => ({
                      ...prev,
                      adsterra: { ...prev.adsterra, enabled: e.target.checked },
                    }))
                  }
                  className="w-4 h-4 rounded border-slate-700 bg-slate-900 text-emerald-500 focus:ring-emerald-500"
                />
                Enable Adsterra
              </label>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-1">
              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1.5">
                  Placement / Domain Key (Public)
                </label>
                <input
                  type="text"
                  placeholder="e.g. adsterra-key-728x90"
                  value={providerForm.adsterra.placementKey}
                  onChange={(e) =>
                    setProviderForm((prev) => ({
                      ...prev,
                      adsterra: { ...prev.adsterra, placementKey: e.target.value.trim() },
                    }))
                  }
                  className="w-full px-3 py-2 rounded-lg bg-slate-900 border border-slate-700 text-xs text-white placeholder-slate-500 font-mono focus:outline-none focus:border-emerald-500"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1.5">
                  Internal Administrative Notes (Private)
                </label>
                <input
                  type="text"
                  placeholder="e.g. Configured for sidebar and tool footer units"
                  value={providerForm.adsterra.notes || ''}
                  onChange={(e) =>
                    setProviderForm((prev) => ({
                      ...prev,
                      adsterra: { ...prev.adsterra, notes: e.target.value },
                    }))
                  }
                  className="w-full px-3 py-2 rounded-lg bg-slate-900 border border-slate-700 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-emerald-500"
                  maxLength={300}
                />
              </div>
            </div>
          </div>

          {/* Custom Structured Banners Card */}
          <div className="bg-[#111724] border border-slate-800 rounded-2xl p-5 space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 border-b border-slate-800 pb-3">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-lg bg-emerald-950/60 border border-emerald-800/60 flex items-center justify-center text-emerald-400 font-bold">
                  C
                </div>
                <div>
                  <h3 className="text-sm font-bold text-white">Custom Structured Banners</h3>
                  <p className="text-[11px] text-slate-400">
                    Direct sponsor banners or house ads using secure, pre-sanitized image and destination links.
                  </p>
                </div>
              </div>

              <label className="flex items-center gap-2 cursor-pointer text-xs font-semibold text-white">
                <input
                  type="checkbox"
                  checked={providerForm.custom.enabled}
                  onChange={(e) =>
                    setProviderForm((prev) => ({
                      ...prev,
                      custom: { ...prev.custom, enabled: e.target.checked },
                    }))
                  }
                  className="w-4 h-4 rounded border-slate-700 bg-slate-900 text-emerald-500 focus:ring-emerald-500"
                />
                Enable Custom Banners
              </label>
            </div>

            <div className="p-3 rounded-lg bg-slate-900 border border-slate-800 text-[11px] text-slate-400 leading-relaxed">
              <span className="font-semibold text-slate-200">Security Guarantee: </span>
              Arbitrary administrator JavaScript execution is disabled to prevent stored cross-site scripting (XSS). Custom sponsor ads use structured, validated image URLs and outbound links with <code>rel=&quot;noopener noreferrer sponsored&quot;</code>.
            </div>
          </div>

          {/* Save Button */}
          <div className="flex items-center justify-end gap-3 pt-2">
            <button
              type="submit"
              disabled={savingProviders}
              className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-emerald-500 text-slate-950 font-bold text-xs hover:bg-emerald-400 transition-colors shadow-lg shadow-emerald-500/10 disabled:opacity-50"
            >
              <Save className="w-4 h-4" />
              {savingProviders ? 'Saving Providers...' : 'Save Provider Settings'}
            </button>
          </div>
        </form>
      )}

      {/* EDIT SLOT MODAL */}
      {editingSlot && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
          <div className="bg-[#111724] border border-slate-800 rounded-2xl w-full max-w-xl max-h-[90vh] overflow-y-auto shadow-2xl p-6 space-y-5">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div>
                <h3 className="text-base font-bold text-white flex items-center gap-2">
                  <Edit3 className="w-4 h-4 text-emerald-400" />
                  Configure Ad Placement: {editingSlot.name}
                </h3>
                <span className="text-[11px] text-slate-400 font-mono">ID: {editingSlot.id}</span>
              </div>
              <button
                type="button"
                onClick={closeEditSlot}
                className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {slotModalError && (
              <div className="p-3 rounded-lg bg-rose-950/50 border border-rose-800 text-rose-300 text-xs">
                {slotModalError}
              </div>
            )}

            <form onSubmit={handleSaveSlot} className="space-y-4">
              {/* Slot Name */}
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">
                  Placement Slot Name
                </label>
                <input
                  type="text"
                  value={slotForm.name}
                  onChange={(e) => setSlotForm({ ...slotForm, name: e.target.value })}
                  className="w-full px-3 py-2 rounded-lg bg-slate-900 border border-slate-700 text-xs text-white focus:outline-none focus:border-emerald-500"
                  required
                  maxLength={80}
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                {/* Location */}
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">
                    Location Target
                  </label>
                  <select
                    value={slotForm.location}
                    onChange={(e) =>
                      setSlotForm({ ...slotForm, location: e.target.value as AdPlacement['location'] })
                    }
                    className="w-full px-2.5 py-2 rounded-lg bg-slate-900 border border-slate-700 text-xs text-white focus:outline-none focus:border-emerald-500 capitalize"
                  >
                    <option value="header">Header</option>
                    <option value="homepage">Homepage</option>
                    <option value="content">Content</option>
                    <option value="blog">Blog</option>
                    <option value="tools">Tools</option>
                    <option value="sidebar">Sidebar</option>
                    <option value="footer">Footer</option>
                    <option value="mobile">Mobile</option>
                  </select>
                </div>

                {/* Provider */}
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">
                    Ad Provider
                  </label>
                  <select
                    value={slotForm.provider}
                    onChange={(e) =>
                      setSlotForm({ ...slotForm, provider: e.target.value as AdPlacement['provider'] })
                    }
                    className="w-full px-2.5 py-2 rounded-lg bg-slate-900 border border-slate-700 text-xs text-white focus:outline-none focus:border-emerald-500 uppercase"
                  >
                    <option value="adsense">Google AdSense</option>
                    <option value="adsterra">Adsterra</option>
                    <option value="custom">Custom Banner</option>
                  </select>
                </div>

                {/* Device Target */}
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">
                    Device Target
                  </label>
                  <select
                    value={slotForm.device}
                    onChange={(e) =>
                      setSlotForm({ ...slotForm, device: e.target.value as AdPlacement['device'] })
                    }
                    className="w-full px-2.5 py-2 rounded-lg bg-slate-900 border border-slate-700 text-xs text-white focus:outline-none focus:border-emerald-500 capitalize"
                  >
                    <option value="all">All Devices</option>
                    <option value="desktop">Desktop Only</option>
                    <option value="mobile">Mobile Only</option>
                  </select>
                </div>
              </div>

              {/* Status Toggle */}
              <div className="pt-1">
                <label className="flex items-center gap-2 cursor-pointer text-xs text-slate-200">
                  <input
                    type="checkbox"
                    checked={slotForm.enabled}
                    onChange={(e) => setSlotForm({ ...slotForm, enabled: e.target.checked })}
                    className="w-4 h-4 rounded border-slate-700 bg-slate-900 text-emerald-500 focus:ring-emerald-500"
                  />
                  <span className="font-semibold">Enable this slot for public injection</span>
                </label>
              </div>

              {/* Provider Specific Fields */}
              {slotForm.provider === 'adsense' && (
                <div className="p-3.5 rounded-xl bg-slate-900/80 border border-slate-800 space-y-3">
                  <div className="text-xs font-semibold text-blue-300 flex items-center gap-1.5">
                    <Sliders className="w-3.5 h-3.5" />
                    Google AdSense Slot Specifics
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label className="block text-[11px] font-medium text-slate-300 mb-1">
                        Ad Unit Slot ID (data-ad-slot)
                      </label>
                      <input
                        type="text"
                        placeholder="e.g. 1234567890"
                        value={slotForm.adUnitId}
                        onChange={(e) => setSlotForm({ ...slotForm, adUnitId: e.target.value })}
                        className="w-full px-2.5 py-1.5 rounded bg-[#111724] border border-slate-700 text-xs text-white font-mono"
                      />
                    </div>
                    <div>
                      <label className="block text-[11px] font-medium text-slate-300 mb-1">
                        Format
                      </label>
                      <select
                        value={slotForm.format}
                        onChange={(e) =>
                          setSlotForm({
                            ...slotForm,
                            format: e.target.value as 'auto' | 'horizontal' | 'rectangle' | 'banner',
                          })
                        }
                        className="w-full px-2.5 py-1.5 rounded bg-[#111724] border border-slate-700 text-xs text-white capitalize"
                      >
                        <option value="auto">Auto (Responsive)</option>
                        <option value="horizontal">Horizontal (Leaderboard)</option>
                        <option value="rectangle">Rectangle (300x250)</option>
                        <option value="banner">Banner</option>
                      </select>
                    </div>
                  </div>
                </div>
              )}

              {slotForm.provider === 'adsterra' && (
                <div className="p-3.5 rounded-xl bg-slate-900/80 border border-slate-800 space-y-2">
                  <div className="text-xs font-semibold text-orange-300 flex items-center gap-1.5">
                    <Sliders className="w-3.5 h-3.5" />
                    Adsterra Slot Key
                  </div>
                  <div>
                    <label className="block text-[11px] font-medium text-slate-300 mb-1">
                      Adsterra Specific Unit Key (optional override)
                    </label>
                    <input
                      type="text"
                      placeholder="Leave blank to use default network key"
                      value={slotForm.adUnitId}
                      onChange={(e) => setSlotForm({ ...slotForm, adUnitId: e.target.value })}
                      className="w-full px-2.5 py-1.5 rounded bg-[#111724] border border-slate-700 text-xs text-white font-mono"
                    />
                  </div>
                </div>
              )}

              {slotForm.provider === 'custom' && (
                <div className="p-3.5 rounded-xl bg-slate-900/80 border border-slate-800 space-y-3">
                  <div className="text-xs font-semibold text-emerald-300 flex items-center gap-1.5">
                    <Shield className="w-3.5 h-3.5" />
                    Custom Sponsor Banner Details
                  </div>
                  <div className="space-y-2.5">
                    <div>
                      <label className="block text-[11px] font-medium text-slate-300 mb-1">
                        Banner Image URL (HTTPS or /uploads/) *
                      </label>
                      <input
                        type="text"
                        placeholder="https://example.com/banner.png or /uploads/..."
                        value={slotForm.customBanner.imageUrl}
                        onChange={(e) =>
                          setSlotForm({
                            ...slotForm,
                            customBanner: { ...slotForm.customBanner, imageUrl: e.target.value },
                          })
                        }
                        className="w-full px-2.5 py-1.5 rounded bg-[#111724] border border-slate-700 text-xs text-white font-mono"
                      />
                    </div>

                    <div>
                      <label className="block text-[11px] font-medium text-slate-300 mb-1">
                        Target Destination URL (HTTPS) *
                      </label>
                      <input
                        type="text"
                        placeholder="https://sponsor.com/landing"
                        value={slotForm.customBanner.destinationUrl}
                        onChange={(e) =>
                          setSlotForm({
                            ...slotForm,
                            customBanner: { ...slotForm.customBanner, destinationUrl: e.target.value },
                          })
                        }
                        className="w-full px-2.5 py-1.5 rounded bg-[#111724] border border-slate-700 text-xs text-white font-mono"
                      />
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                      <div>
                        <label className="block text-[11px] font-medium text-slate-300 mb-1">
                          Alt Text
                        </label>
                        <input
                          type="text"
                          placeholder="e.g. Learn UI Design Fast"
                          value={slotForm.customBanner.altText}
                          onChange={(e) =>
                            setSlotForm({
                              ...slotForm,
                              customBanner: { ...slotForm.customBanner, altText: e.target.value },
                            })
                          }
                          className="w-full px-2.5 py-1.5 rounded bg-[#111724] border border-slate-700 text-xs text-white"
                        />
                      </div>
                      <div>
                        <label className="block text-[11px] font-medium text-slate-300 mb-1">
                          Title Attribute (Hover tooltip)
                        </label>
                        <input
                          type="text"
                          placeholder="Optional"
                          value={slotForm.customBanner.title || ''}
                          onChange={(e) =>
                            setSlotForm({
                              ...slotForm,
                              customBanner: { ...slotForm.customBanner, title: e.target.value },
                            })
                          }
                          className="w-full px-2.5 py-1.5 rounded bg-[#111724] border border-slate-700 text-xs text-white"
                        />
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* Internal Notes */}
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">
                  Administrative Notes (Private)
                </label>
                <input
                  type="text"
                  placeholder="e.g. Header placement reserved for non-obtrusive responsive leaderboard"
                  value={slotForm.notes}
                  onChange={(e) => setSlotForm({ ...slotForm, notes: e.target.value })}
                  className="w-full px-3 py-2 rounded-lg bg-slate-900 border border-slate-700 text-xs text-white focus:outline-none focus:border-emerald-500"
                  maxLength={300}
                />
              </div>

              {/* Action Buttons */}
              <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-800">
                <button
                  type="button"
                  onClick={closeEditSlot}
                  className="px-4 py-2 rounded-xl text-xs font-medium text-slate-400 hover:text-white transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={savingSlot}
                  className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-emerald-500 text-slate-950 font-bold text-xs hover:bg-emerald-400 transition-colors disabled:opacity-50"
                >
                  <Save className="w-3.5 h-3.5" />
                  {savingSlot ? 'Saving...' : 'Save Slot Changes'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
