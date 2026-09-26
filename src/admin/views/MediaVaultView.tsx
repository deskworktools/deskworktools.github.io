import React, { useState, useEffect, useRef } from 'react';
import {
  UploadCloud,
  Image as ImageIcon,
  Trash2,
  Copy,
  Check,
  AlertCircle,
  RefreshCw,
  Search,
  ExternalLink,
  ShieldAlert,
  FileText,
} from 'lucide-react';
import { MediaItem } from '../../../server/data/types';

interface MediaVaultViewProps {
  onSelectImage?: (url: string) => void;
  isModalPicker?: boolean;
  onCloseModal?: () => void;
}

export const MediaVaultView: React.FC<MediaVaultViewProps> = ({
  onSelectImage,
  isModalPicker = false,
  onCloseModal,
}) => {
  const [items, setItems] = useState<MediaItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);
  const [search, setSearch] = useState('');
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<MediaItem | null>(null);
  const [deleting, setDeleting] = useState(false);

  const fileInputRef = useRef<HTMLInputElement>(null);

  const fetchMedia = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch('/api/admin/media');
      if (res.ok) {
        const data = await res.json();
        setItems(data);
      } else {
        setError('Failed to load media vault assets.');
      }
    } catch {
      setError('Network communication failure.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchMedia();
  }, []);

  const handleFileUpload = async (file: File) => {
    const allowedTypes = ['image/jpeg', 'image/png', 'image/webp', 'image/gif'];
    if (!allowedTypes.includes(file.type.toLowerCase())) {
      setError(`Unsupported format (${file.type}). Allowed: JPG, PNG, WebP, GIF (raster images only).`);
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      setError('File exceeds 5MB size limit.');
      return;
    }

    setUploading(true);
    setError(null);
    setSuccessMsg(null);

    const formData = new FormData();
    formData.append('file', file);

    try {
      const res = await fetch('/api/admin/media/upload', {
        method: 'POST',
        body: formData,
      });

      const data = await res.json();
      if (res.ok && data.success) {
        setSuccessMsg(`Image "${data.media.filename}" uploaded successfully!`);
        await fetchMedia();
        if (onSelectImage && isModalPicker) {
          onSelectImage(data.media.url);
          if (onCloseModal) onCloseModal();
        }
      } else {
        setError(data.error || 'Upload failed');
      }
    } catch {
      setError('Network communication error during upload.');
    } finally {
      setUploading(false);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      handleFileUpload(e.dataTransfer.files[0]);
    }
  };

  const handleCopyUrl = (item: MediaItem) => {
    navigator.clipboard.writeText(item.url);
    setCopiedId(item.id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const confirmDelete = async () => {
    if (!deleteTarget || deleting) return;
    setDeleting(true);
    setError(null);

    try {
      const res = await fetch(`/api/admin/media/${encodeURIComponent(deleteTarget.filename)}`, {
        method: 'DELETE',
      });
      const data = await res.json();

      if (res.ok && data.success) {
        setSuccessMsg(`Asset "${deleteTarget.filename}" deleted.`);
        setDeleteTarget(null);
        await fetchMedia();
      } else {
        setError(data.error || 'Delete operation failed.');
      }
    } catch {
      setError('Network error attempting to delete asset.');
    } finally {
      setDeleting(false);
    }
  };

  const filteredItems = items.filter(
    (item) =>
      item.filename.toLowerCase().includes(search.toLowerCase()) ||
      item.mimeType.toLowerCase().includes(search.toLowerCase()),
  );

  return (
    <div className={`space-y-6 ${isModalPicker ? 'p-2' : 'p-4 md:p-8 max-w-6xl mx-auto'}`}>
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-[#111724] border border-slate-800 rounded-2xl p-6">
        <div>
          <div className="flex items-center gap-2 text-xs font-semibold text-emerald-400 uppercase tracking-wider mb-1">
            <ImageIcon className="w-4 h-4 text-emerald-400" />
            Media & Asset Vault
          </div>
          <h2 className="text-lg md:text-xl font-bold text-white tracking-tight">
            Digital Assets & Blog Imagery
          </h2>
          <p className="text-xs text-slate-400 mt-1">
            MIME-validated image storage with path traversal shielding and in-use post protection.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={fetchMedia}
            disabled={loading}
            className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-slate-900 hover:bg-slate-800 border border-slate-700/80 text-xs font-medium text-slate-200 transition-colors cursor-pointer disabled:opacity-50"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin text-emerald-400' : 'text-slate-400'}`} />
            <span>Refresh</span>
          </button>
        </div>
      </div>

      {/* Notifications */}
      {error && (
        <div className="p-4 bg-rose-950/40 border border-rose-800/80 rounded-xl text-xs text-rose-200 flex items-start gap-2.5">
          <AlertCircle className="w-4 h-4 text-rose-400 shrink-0 mt-0.5" />
          <div className="flex-1">
            <p className="font-semibold">Operation Error</p>
            <p className="mt-0.5">{error}</p>
          </div>
          <button onClick={() => setError(null)} className="text-rose-400 hover:text-rose-200 text-xs">
            Dismiss
          </button>
        </div>
      )}

      {successMsg && (
        <div className="p-4 bg-emerald-950/40 border border-emerald-800/80 rounded-xl text-xs text-emerald-200 flex items-start gap-2.5">
          <Check className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
          <div className="flex-1">
            <p className="font-semibold">Success</p>
            <p className="mt-0.5">{successMsg}</p>
          </div>
          <button onClick={() => setSuccessMsg(null)} className="text-emerald-400 hover:text-emerald-200 text-xs">
            Dismiss
          </button>
        </div>
      )}

      {/* Drag & Drop Upload Zone */}
      <div
        onDragOver={(e) => e.preventDefault()}
        onDrop={handleDrop}
        className="bg-[#111724] border-2 border-dashed border-slate-800 hover:border-emerald-500/50 rounded-2xl p-6 text-center transition-all cursor-pointer group"
        onClick={() => fileInputRef.current?.click()}
      >
        <input
          type="file"
          ref={fileInputRef}
          onChange={(e) => e.target.files?.[0] && handleFileUpload(e.target.files[0])}
          accept="image/jpeg,image/png,image/webp,image/gif"
          className="hidden"
        />
        <div className="max-w-md mx-auto space-y-3">
          <div className="w-12 h-12 rounded-xl bg-slate-900 border border-slate-700/80 flex items-center justify-center text-slate-400 group-hover:text-emerald-400 mx-auto transition-colors">
            {uploading ? (
              <span className="w-5 h-5 border-2 border-emerald-400 border-t-transparent rounded-full animate-spin" />
            ) : (
              <UploadCloud className="w-6 h-6" />
            )}
          </div>
          <div>
            <p className="text-sm font-semibold text-white">
              {uploading ? 'Validating and Uploading Asset...' : 'Click to Upload or Drag & Drop Image'}
            </p>
            <p className="text-xs text-slate-400 mt-1">
              Supported Formats: JPG, PNG, WebP, GIF (Max 5MB)
            </p>
          </div>
        </div>
      </div>

      {/* Search and Filters */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-3 bg-[#111724] border border-slate-800 rounded-xl p-3">
        <div className="relative w-full sm:w-72">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search assets by name..."
            className="w-full bg-slate-900 border border-slate-700/80 rounded-lg pl-9 pr-3 py-1.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:ring-1 focus:ring-emerald-500"
          />
        </div>
        <div className="text-xs text-slate-400 self-start sm:self-auto">
          Showing <strong className="text-slate-200">{filteredItems.length}</strong> asset
          {filteredItems.length === 1 ? '' : 's'}
        </div>
      </div>

      {/* Media Grid */}
      {loading ? (
        <div className="p-12 text-center text-xs text-slate-400">Loading asset vault...</div>
      ) : filteredItems.length === 0 ? (
        <div className="p-12 bg-[#111724] border border-slate-800 rounded-2xl text-center space-y-2">
          <ImageIcon className="w-8 h-8 text-slate-600 mx-auto" />
          <p className="text-xs text-slate-400">No media assets found matching query.</p>
        </div>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
          {filteredItems.map((item) => {
            const isSystemImage = item.id.startsWith('sys_');
            return (
              <div
                key={item.id}
                className="bg-[#111724] border border-slate-800 hover:border-slate-700 rounded-xl overflow-hidden flex flex-col group transition-all"
              >
                {/* Image Thumbnail Container */}
                <div className="h-32 bg-slate-950/80 relative flex items-center justify-center overflow-hidden p-2">
                  <img
                    src={item.url}
                    alt={item.filename}
                    loading="lazy"
                    className="max-h-full max-w-full object-contain transition-transform duration-200 group-hover:scale-105"
                  />
                  {item.inUse && (
                    <span
                      title={`Referenced in: ${item.usedInPosts.join(', ')}`}
                      className="absolute top-2 left-2 px-1.5 py-0.5 rounded bg-emerald-950/90 text-emerald-400 border border-emerald-800/80 text-[9px] font-mono font-semibold"
                    >
                      In Use
                    </span>
                  )}
                  {isSystemImage && (
                    <span className="absolute top-2 right-2 px-1.5 py-0.5 rounded bg-slate-800/90 text-slate-300 border border-slate-700 text-[9px] font-mono">
                      System
                    </span>
                  )}
                </div>

                {/* Details */}
                <div className="p-3 flex-1 flex flex-col justify-between space-y-2">
                  <div>
                    <div
                      className="text-xs font-semibold text-slate-200 truncate"
                      title={item.filename}
                    >
                      {item.filename}
                    </div>
                    <div className="text-[10px] text-slate-400 flex items-center justify-between mt-1">
                      <span>{Math.round(item.sizeBytes / 1024)} KB</span>
                      <span className="uppercase">{item.mimeType.split('/')[1]}</span>
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="pt-2 border-t border-slate-800/80 flex items-center justify-between gap-1">
                    {onSelectImage ? (
                      <button
                        onClick={() => onSelectImage(item.url)}
                        className="flex-1 py-1 px-2 rounded-lg bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-semibold text-[11px] transition-colors cursor-pointer"
                      >
                        Select Image
                      </button>
                    ) : (
                      <>
                        <button
                          onClick={() => handleCopyUrl(item)}
                          className="flex items-center gap-1 px-2 py-1 rounded bg-slate-800 hover:bg-slate-700 text-slate-300 text-[11px] transition-colors cursor-pointer"
                          title="Copy relative image URL"
                        >
                          {copiedId === item.id ? (
                            <>
                              <Check className="w-3 h-3 text-emerald-400" />
                              <span className="text-emerald-400">Copied</span>
                            </>
                          ) : (
                            <>
                              <Copy className="w-3 h-3 text-slate-400" />
                              <span>URL</span>
                            </>
                          )}
                        </button>

                        <a
                          href={item.url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="p-1 rounded text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
                          title="View Full Size"
                        >
                          <ExternalLink className="w-3.5 h-3.5" />
                        </a>

                        {!isSystemImage && (
                          <button
                            onClick={() => setDeleteTarget(item)}
                            className="p-1 rounded text-slate-400 hover:text-rose-400 hover:bg-rose-950/40 transition-colors cursor-pointer"
                            title="Delete Asset"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        )}
                      </>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Confirmation Modal for Delete */}
      {deleteTarget && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-xs">
          <div className="bg-[#111724] border border-slate-800 rounded-2xl max-w-md w-full p-6 space-y-4 shadow-2xl">
            <div className="flex items-center gap-3 text-rose-400">
              <div className="w-10 h-10 rounded-xl bg-rose-950/60 border border-rose-800/60 flex items-center justify-center">
                <ShieldAlert className="w-5 h-5 text-rose-400" />
              </div>
              <div>
                <h3 className="text-base font-bold text-white">Delete Asset Confirmation</h3>
                <p className="text-xs text-slate-400">Permanently remove this image from storage</p>
              </div>
            </div>

            <div className="p-3 bg-slate-900 border border-slate-800 rounded-xl text-xs space-y-1.5">
              <div className="text-slate-300 font-mono font-medium truncate">{deleteTarget.filename}</div>
              <div className="text-slate-400 text-[11px]">Size: {Math.round(deleteTarget.sizeBytes / 1024)} KB</div>
              {deleteTarget.inUse && (
                <div className="text-amber-400 font-medium text-[11px] pt-1">
                  Warning: Currently referenced in &ldquo;{deleteTarget.usedInPosts.join(', ')}&rdquo;. Deleting will cause broken images in these articles.
                </div>
              )}
            </div>

            <p className="text-xs text-slate-300">
              Are you sure you want to permanently delete this media asset? This action cannot be undone.
            </p>

            <div className="flex items-center justify-end gap-2 pt-2">
              <button
                onClick={() => setDeleteTarget(null)}
                disabled={deleting}
                className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-xs font-semibold text-slate-200 transition-colors cursor-pointer"
              >
                Cancel
              </button>
              <button
                onClick={confirmDelete}
                disabled={deleting}
                className="px-4 py-2 rounded-xl bg-rose-600 hover:bg-rose-500 text-xs font-semibold text-white transition-colors cursor-pointer disabled:opacity-50"
              >
                {deleting ? 'Deleting...' : 'Confirm Delete'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
