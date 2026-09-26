import React, { useState, useEffect } from 'react';
import {
  BookOpen,
  Plus,
  Search,
  RefreshCw,
  Edit,
  Trash2,
  ExternalLink,
  CheckCircle,
  Clock,
  FileEdit,
  AlertCircle,
  Eye,
  Code,
  Image as ImageIcon,
  Save,
  Globe,
  HelpCircle,
  X,
  Sparkles,
  ArrowRight,
} from 'lucide-react';
import { BlogPostMeta } from '../../../server/data/types';
import { MediaVaultView } from './MediaVaultView';

export const BlogCmsView: React.FC = () => {
  const [posts, setPosts] = useState<BlogPostMeta[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'published' | 'draft' | 'scheduled'>('all');

  // Editor modal state
  const [isEditing, setIsEditing] = useState(false);
  const [editingPost, setEditingPost] = useState<Partial<BlogPostMeta>>({});
  const [saving, setSaving] = useState(false);
  const [editorTab, setEditorTab] = useState<'write' | 'preview'>('write');

  // Media picker modal state
  const [showMediaPicker, setShowMediaPicker] = useState(false);

  // Delete confirmation modal
  const [deleteTarget, setDeleteTarget] = useState<BlogPostMeta | null>(null);
  const [deleting, setDeleting] = useState(false);

  const fetchPosts = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch('/api/admin/blog/posts');
      if (res.ok) {
        const data = await res.json();
        setPosts(data);
      } else {
        setError('Failed to fetch blog posts from server.');
      }
    } catch {
      setError('Network communication failure.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPosts();
  }, []);

  const openNewPost = () => {
    setEditingPost({
      title: '',
      slug: '',
      excerpt: '',
      category: 'Resume & Career',
      author: 'Deskwork',
      date: new Date().toISOString().split('T')[0],
      readTime: '5 min read',
      status: 'draft',
      image: '',
      seoTitle: '',
      seoDescription: '',
      canonicalUrl: '',
      content: '<h2>Introduction</h2>\n<p>Start writing your guide here...</p>\n\n<h2>Key Practical Steps</h2>\n<p>Detail your insights and advice.</p>\n\n<div class="tip"><strong>Quick tip</strong>Add a memorable rule of thumb or tip here.</div>\n\n<div class="cta">\n<h2>Create Your Professional Resume Online</h2>\n<p>Explore free, ATS-friendly templates designed for job seekers.</p>\n<a href="../index.html">Build Your Resume Free &rarr;</a>\n</div>',
    });
    setEditorTab('write');
    setIsEditing(true);
  };

  const openEditPost = async (post: BlogPostMeta) => {
    try {
      // Fetch full post to ensure content is loaded
      const res = await fetch(`/api/admin/blog/posts/${encodeURIComponent(post.slug)}`);
      if (res.ok) {
        const fullPost = await res.json();
        setEditingPost(fullPost);
      } else {
        setEditingPost({ ...post });
      }
    } catch {
      setEditingPost({ ...post });
    }
    setEditorTab('write');
    setIsEditing(true);
  };

  const handleSave = async (targetStatus?: 'draft' | 'published' | 'scheduled') => {
    if (!editingPost.title?.trim()) {
      setError('Article title is required.');
      return;
    }

    setSaving(true);
    setError(null);
    setSuccessMsg(null);

    const postPayload = {
      ...editingPost,
      status: targetStatus || editingPost.status || 'draft',
    };

    try {
      const res = await fetch('/api/admin/blog/posts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(postPayload),
      });

      const data = await res.json();
      if (res.ok && data.success) {
        setSuccessMsg(`Article "${data.post.title}" saved successfully (${data.post.status}).`);
        setIsEditing(false);
        await fetchPosts();
      } else {
        setError(data.error || 'Failed to save post.');
      }
    } catch {
      setError('Network communication failure while saving.');
    } finally {
      setSaving(false);
    }
  };

  const handleTogglePublish = async (post: BlogPostMeta) => {
    setError(null);
    setSuccessMsg(null);
    const action = post.status === 'published' ? 'unpublish' : 'publish';

    try {
      const res = await fetch(`/api/admin/blog/posts/${encodeURIComponent(post.slug)}/${action}`, {
        method: 'POST',
      });

      const data = await res.json();
      if (res.ok && data.success) {
        setSuccessMsg(data.message);
        await fetchPosts();
      } else {
        setError(data.error || `Failed to ${action} post.`);
      }
    } catch {
      setError(`Network error attempting to ${action} post.`);
    }
  };

  const confirmDelete = async () => {
    if (!deleteTarget || deleting) return;
    setDeleting(true);
    setError(null);

    try {
      const res = await fetch(`/api/admin/blog/posts/${encodeURIComponent(deleteTarget.slug)}`, {
        method: 'DELETE',
      });

      const data = await res.json();
      if (res.ok && data.success) {
        setSuccessMsg(data.message);
        setDeleteTarget(null);
        await fetchPosts();
      } else {
        setError(data.error || 'Failed to delete post.');
      }
    } catch {
      setError('Network error attempting to delete post.');
    } finally {
      setDeleting(false);
    }
  };

  // Helper to insert snippets into content
  const insertSnippet = (snippet: string) => {
    setEditingPost((prev) => ({
      ...prev,
      content: (prev.content || '') + '\n' + snippet,
    }));
  };

  const filteredPosts = posts.filter((p) => {
    const matchesStatus = statusFilter === 'all' || p.status === statusFilter;
    const matchesSearch =
      !search ||
      p.title.toLowerCase().includes(search.toLowerCase()) ||
      p.slug.toLowerCase().includes(search.toLowerCase()) ||
      p.category.toLowerCase().includes(search.toLowerCase()) ||
      p.excerpt.toLowerCase().includes(search.toLowerCase());
    return matchesStatus && matchesSearch;
  });

  return (
    <div className="p-4 md:p-8 max-w-6xl mx-auto space-y-6">
      {/* Top Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-[#111724] border border-slate-800 rounded-2xl p-6">
        <div>
          <div className="flex items-center gap-2 text-xs font-semibold text-emerald-400 uppercase tracking-wider mb-1">
            <BookOpen className="w-4 h-4 text-emerald-400" />
            Blog Content Management
          </div>
          <h1 className="text-xl md:text-2xl font-bold text-white tracking-tight">
            Article Publishing Suite
          </h1>
          <p className="text-xs text-slate-400 mt-1">
            Draft, schedule, and publish static HTML articles synchronized directly with{' '}
            <code className="text-slate-300 font-mono">blog/posts.json</code> and{' '}
            <code className="text-slate-300 font-mono">blog/&lt;slug&gt;.html</code>.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={fetchPosts}
            disabled={loading}
            className="flex items-center gap-2 px-3 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 border border-slate-700/80 text-xs font-medium text-slate-200 transition-colors cursor-pointer disabled:opacity-50"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin text-emerald-400' : 'text-slate-400'}`} />
            <span>Refresh</span>
          </button>

          <button
            onClick={openNewPost}
            className="flex items-center gap-2 px-4 py-2 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 text-xs font-bold transition-all shadow-lg shadow-emerald-500/10 cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span>Compose Article</span>
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
          <button onClick={() => setError(null)} className="text-rose-400 hover:text-rose-200 text-xs cursor-pointer">
            Dismiss
          </button>
        </div>
      )}

      {successMsg && (
        <div className="p-4 bg-emerald-950/40 border border-emerald-800/80 rounded-xl text-xs text-emerald-200 flex items-start gap-2.5">
          <CheckCircle className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
          <div className="flex-1">
            <p className="font-semibold">Success</p>
            <p className="mt-0.5">{successMsg}</p>
          </div>
          <button onClick={() => setSuccessMsg(null)} className="text-emerald-400 hover:text-emerald-200 text-xs cursor-pointer">
            Dismiss
          </button>
        </div>
      )}

      {/* Filters and Search */}
      <div className="flex flex-col md:flex-row items-center justify-between gap-4 bg-[#111724] border border-slate-800 rounded-2xl p-4">
        {/* Status Filter Tabs */}
        <div className="flex items-center gap-1 bg-slate-900 border border-slate-800 rounded-xl p-1 w-full md:w-auto">
          {(['all', 'published', 'draft', 'scheduled'] as const).map((tab) => (
            <button
              key={tab}
              onClick={() => setStatusFilter(tab)}
              className={`flex-1 md:flex-initial px-3 py-1.5 rounded-lg text-xs font-medium capitalize transition-colors cursor-pointer ${
                statusFilter === tab
                  ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              {tab}
            </button>
          ))}
        </div>

        {/* Search */}
        <div className="relative w-full md:w-72">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search articles by title, slug, category..."
            className="w-full bg-slate-900 border border-slate-700/80 rounded-xl pl-9 pr-3 py-1.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:ring-1 focus:ring-emerald-500"
          />
        </div>
      </div>

      {/* Articles Table */}
      <div className="bg-[#111724] border border-slate-800 rounded-2xl overflow-hidden">
        {loading ? (
          <div className="p-12 text-center text-xs text-slate-400">Loading articles from repository...</div>
        ) : filteredPosts.length === 0 ? (
          <div className="p-12 text-center space-y-2">
            <BookOpen className="w-8 h-8 text-slate-600 mx-auto" />
            <p className="text-xs text-slate-400">No articles found matching filters.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="border-b border-slate-800 bg-slate-900/60 text-slate-400 uppercase font-semibold text-[10px] tracking-wider">
                  <th className="py-3.5 px-4">Title & Details</th>
                  <th className="py-3.5 px-4">Category</th>
                  <th className="py-3.5 px-4">Status</th>
                  <th className="py-3.5 px-4">Date</th>
                  <th className="py-3.5 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60 text-slate-300">
                {filteredPosts.map((post) => {
                  const isPublished = post.status === 'published';
                  const isScheduled = post.status === 'scheduled';
                  return (
                    <tr key={post.slug} className="hover:bg-slate-850/40 transition-colors group">
                      <td className="py-3.5 px-4 max-w-md">
                        <div className="font-semibold text-white group-hover:text-emerald-400 transition-colors text-sm">
                          {post.title}
                        </div>
                        <div className="text-[11px] text-slate-400 font-mono mt-0.5 truncate">
                          /{post.slug} &bull; {post.readTime || '5 min read'}
                        </div>
                      </td>

                      <td className="py-3.5 px-4 whitespace-nowrap">
                        <span className="inline-block px-2 py-0.5 rounded bg-slate-800 text-slate-300 text-[10px] font-medium border border-slate-700">
                          {post.category}
                        </span>
                      </td>

                      <td className="py-3.5 px-4 whitespace-nowrap">
                        {isPublished ? (
                          <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded text-[10px] font-mono font-semibold bg-emerald-950/70 text-emerald-400 border border-emerald-800/60">
                            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
                            Published
                          </span>
                        ) : isScheduled ? (
                          <div className="space-y-1">
                            <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded text-[10px] font-mono font-semibold bg-sky-950/70 text-sky-400 border border-sky-800/60">
                              <Clock className="w-3 h-3 text-sky-400" />
                              Scheduled
                            </span>
                            <div className="text-[10px] text-amber-400/80 max-w-[200px] leading-tight">
                              Scheduled status is saved, but automatic publication requires a future scheduler integration.
                            </div>
                          </div>
                        ) : (
                          <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded text-[10px] font-mono font-semibold bg-amber-950/70 text-amber-400 border border-amber-800/60">
                            <FileEdit className="w-3 h-3 text-amber-400" />
                            Draft
                          </span>
                        )}
                      </td>

                      <td className="py-3.5 px-4 whitespace-nowrap text-[11px] text-slate-400">
                        {post.date}
                      </td>

                      <td className="py-3.5 px-4 whitespace-nowrap text-right space-x-1">
                        <button
                          onClick={() => openEditPost(post)}
                          className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 transition-colors cursor-pointer"
                          title="Edit article"
                        >
                          <Edit className="w-3.5 h-3.5" />
                        </button>

                        {isPublished && (
                          <a
                            href={`/blog/${post.slug}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="p-1.5 inline-block rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 transition-colors"
                            title="View public live article"
                          >
                            <ExternalLink className="w-3.5 h-3.5" />
                          </a>
                        )}

                        <button
                          onClick={() => handleTogglePublish(post)}
                          className={`p-1.5 rounded-lg transition-colors cursor-pointer ${
                            isPublished
                              ? 'bg-amber-950/50 hover:bg-amber-900/60 text-amber-300 border border-amber-800/50'
                              : 'bg-emerald-950/50 hover:bg-emerald-900/60 text-emerald-300 border border-emerald-800/50'
                          }`}
                          title={isPublished ? 'Unpublish to draft' : 'Publish to website'}
                        >
                          {isPublished ? 'Unpublish' : 'Publish'}
                        </button>

                        <button
                          onClick={() => setDeleteTarget(post)}
                          className="p-1.5 rounded-lg bg-slate-800 hover:bg-rose-950/50 text-slate-400 hover:text-rose-300 transition-colors cursor-pointer"
                          title="Delete article"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Comprehensive Post Editor Modal */}
      {isEditing && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4 bg-slate-950/85 backdrop-blur-xs overflow-y-auto">
          <div className="bg-[#111724] border border-slate-800 rounded-2xl w-full max-w-5xl my-auto p-5 md:p-8 space-y-6 shadow-2xl max-h-[92vh] flex flex-col">
            {/* Modal Header */}
            <div className="flex items-center justify-between pb-4 border-b border-slate-800">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-lg bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400">
                  <FileEdit className="w-4 h-4" />
                </div>
                <div>
                  <h2 className="text-base md:text-lg font-bold text-white">
                    {editingPost.slug ? 'Edit Article' : 'Compose New Article'}
                  </h2>
                  <p className="text-xs text-slate-400">
                    {editingPost.slug ? `Modifying: ${editingPost.slug}` : 'Creates a static article and metadata record'}
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <button
                  onClick={() => setIsEditing(false)}
                  className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors cursor-pointer"
                  aria-label="Close editor"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>

            {/* Scrollable Form Body */}
            <div className="flex-1 overflow-y-auto pr-1 space-y-6">
              {/* Row 1: Title & Slug */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                    Article Title <span className="text-rose-400">*</span>
                  </label>
                  <input
                    type="text"
                    value={editingPost.title || ''}
                    onChange={(e) => {
                      const newTitle = e.target.value;
                      setEditingPost((prev) => {
                        const autoSlug = prev.slug
                          ? prev.slug
                          : newTitle
                              .toLowerCase()
                              .replace(/[^a-z0-9-_]/g, '-')
                              .replace(/-+/g, '-')
                              .replace(/^-|-$/g, '') + '.html';
                        return { ...prev, title: newTitle, slug: autoSlug };
                      });
                    }}
                    placeholder="e.g. How to Choose the Right Resume Format"
                    className="w-full bg-slate-900 border border-slate-700/80 rounded-xl px-3.5 py-2 text-sm text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/50"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                    URL Slug (<code className="text-emerald-400">blog/&lt;slug&gt;</code>)
                  </label>
                  <input
                    type="text"
                    value={editingPost.slug || ''}
                    onChange={(e) => setEditingPost({ ...editingPost, slug: e.target.value })}
                    placeholder="my-article-slug.html"
                    className="w-full bg-slate-900 border border-slate-700/80 rounded-xl px-3.5 py-2 text-sm text-white font-mono placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/50"
                  />
                </div>
              </div>

              {/* Row 2: Excerpt */}
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                  Excerpt / Summary
                </label>
                <textarea
                  rows={2}
                  value={editingPost.excerpt || ''}
                  onChange={(e) => setEditingPost({ ...editingPost, excerpt: e.target.value })}
                  placeholder="Short introductory summary for cards, RSS, and meta description..."
                  className="w-full bg-slate-900 border border-slate-700/80 rounded-xl px-3.5 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/50"
                />
              </div>

              {/* Row 3: Metadata: Category, Author, Date, ReadTime */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1.5">Category</label>
                  <input
                    type="text"
                    value={editingPost.category || ''}
                    onChange={(e) => setEditingPost({ ...editingPost, category: e.target.value })}
                    placeholder="e.g. Resume & Career"
                    className="w-full bg-slate-900 border border-slate-700/80 rounded-xl px-3 py-1.5 text-xs text-white"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1.5">Author</label>
                  <input
                    type="text"
                    value={editingPost.author || ''}
                    onChange={(e) => setEditingPost({ ...editingPost, author: e.target.value })}
                    placeholder="Deskwork"
                    className="w-full bg-slate-900 border border-slate-700/80 rounded-xl px-3 py-1.5 text-xs text-white"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1.5">Date</label>
                  <input
                    type="date"
                    value={editingPost.date || ''}
                    onChange={(e) => setEditingPost({ ...editingPost, date: e.target.value })}
                    className="w-full bg-slate-900 border border-slate-700/80 rounded-xl px-3 py-1.5 text-xs text-white"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1.5">Read Time</label>
                  <input
                    type="text"
                    value={editingPost.readTime || ''}
                    onChange={(e) => setEditingPost({ ...editingPost, readTime: e.target.value })}
                    placeholder="5 min read"
                    className="w-full bg-slate-900 border border-slate-700/80 rounded-xl px-3 py-1.5 text-xs text-white"
                  />
                </div>
              </div>

              {/* Row 4: Featured Image */}
              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label className="block text-xs font-semibold text-slate-300">
                    Featured Image URL
                  </label>
                  <button
                    type="button"
                    onClick={() => setShowMediaPicker(true)}
                    className="text-xs text-emerald-400 hover:text-emerald-300 font-medium flex items-center gap-1 cursor-pointer"
                  >
                    <ImageIcon className="w-3.5 h-3.5" />
                    <span>Choose from Media Vault</span>
                  </button>
                </div>
                <div className="flex items-center gap-3">
                  <input
                    type="text"
                    value={editingPost.image || ''}
                    onChange={(e) => setEditingPost({ ...editingPost, image: e.target.value })}
                    placeholder="/uploads/blog/image.png or ../images/resume-template.jpg"
                    className="flex-1 bg-slate-900 border border-slate-700/80 rounded-xl px-3.5 py-2 text-xs text-white font-mono placeholder-slate-500"
                  />
                  {editingPost.image && (
                    <div className="w-10 h-10 rounded-lg bg-slate-800 border border-slate-700 overflow-hidden shrink-0">
                      <img
                        src={editingPost.image}
                        alt="Preview"
                        className="w-full h-full object-cover"
                        onError={(e) => ((e.target as HTMLElement).style.display = 'none')}
                      />
                    </div>
                  )}
                </div>
              </div>

              {/* Row 5: Content Editor Toolbar & Textarea */}
              <div className="space-y-2">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <label className="block text-xs font-semibold text-slate-300">
                    Article HTML Content
                  </label>

                  {/* Editor Tab Toggle */}
                  <div className="flex items-center gap-1 bg-slate-900 border border-slate-800 rounded-lg p-0.5 text-xs">
                    <button
                      type="button"
                      onClick={() => setEditorTab('write')}
                      className={`flex items-center gap-1 px-2.5 py-1 rounded-md transition-colors cursor-pointer ${
                        editorTab === 'write' ? 'bg-slate-800 text-emerald-400 font-medium' : 'text-slate-400'
                      }`}
                    >
                      <Code className="w-3.5 h-3.5" />
                      <span>Editor</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => setEditorTab('preview')}
                      className={`flex items-center gap-1 px-2.5 py-1 rounded-md transition-colors cursor-pointer ${
                        editorTab === 'preview' ? 'bg-slate-800 text-emerald-400 font-medium' : 'text-slate-400'
                      }`}
                    >
                      <Eye className="w-3.5 h-3.5" />
                      <span>Live Preview</span>
                    </button>
                  </div>
                </div>

                {/* Snippet Toolbar */}
                {editorTab === 'write' && (
                  <div className="flex flex-wrap items-center gap-1.5 p-2 bg-slate-900/80 border border-slate-800 rounded-xl text-xs">
                    <span className="text-[10px] text-slate-400 font-semibold uppercase tracking-wider px-1">
                      Insert:
                    </span>
                    <button
                      type="button"
                      onClick={() => insertSnippet('<h2>Section Heading</h2>\n<p>Add narrative...</p>')}
                      className="px-2 py-1 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded text-[11px] font-mono cursor-pointer"
                    >
                      H2 Heading
                    </button>
                    <button
                      type="button"
                      onClick={() => insertSnippet('<h3>Sub-heading</h3>\n<p>Add text...</p>')}
                      className="px-2 py-1 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded text-[11px] font-mono cursor-pointer"
                    >
                      H3 Heading
                    </button>
                    <button
                      type="button"
                      onClick={() =>
                        insertSnippet(
                          '<div class="tip">\n<strong>Quick tip</strong>\nWrite your practical takeaway here.\n</div>',
                        )
                      }
                      className="px-2 py-1 bg-slate-800 hover:bg-slate-700 text-amber-300 rounded text-[11px] font-mono cursor-pointer"
                    >
                      Tip Box
                    </button>
                    <button
                      type="button"
                      onClick={() =>
                        insertSnippet(
                          '<div class="cta">\n<h2>Create Your Professional Resume Online</h2>\n<p>Explore free, ATS-friendly templates designed for job seekers.</p>\n<a href="../index.html">Explore Templates &rarr;</a>\n</div>',
                        )
                      }
                      className="px-2 py-1 bg-slate-800 hover:bg-slate-700 text-emerald-300 rounded text-[11px] font-mono cursor-pointer"
                    >
                      CTA Block
                    </button>
                    <button
                      type="button"
                      onClick={() =>
                        insertSnippet(
                          '<div class="faq">\n<h3>Question Title?</h3>\n<p>Comprehensive answer here.</p>\n</div>',
                        )
                      }
                      className="px-2 py-1 bg-slate-800 hover:bg-slate-700 text-sky-300 rounded text-[11px] font-mono cursor-pointer"
                    >
                      FAQ Block
                    </button>
                  </div>
                )}

                {editorTab === 'write' ? (
                  <textarea
                    rows={12}
                    value={editingPost.content || ''}
                    onChange={(e) => setEditingPost({ ...editingPost, content: e.target.value })}
                    className="w-full bg-slate-900 border border-slate-700/80 rounded-xl p-3.5 text-xs text-slate-200 font-mono leading-relaxed focus:outline-none focus:ring-2 focus:ring-emerald-500/50"
                  />
                ) : (
                  <div className="bg-[#EDF1F5] text-[#1B2430] p-6 rounded-xl border border-slate-700 max-h-96 overflow-y-auto">
                    <div className="bap-content" dangerouslySetInnerHTML={{ __html: editingPost.content || '' }} />
                  </div>
                )}
              </div>

              {/* Row 6: SEO Metadata Accordion */}
              <div className="bg-slate-900/60 border border-slate-800 rounded-xl p-4 space-y-4">
                <div className="flex items-center gap-2 text-xs font-bold text-white uppercase tracking-wider">
                  <Globe className="w-4 h-4 text-emerald-400" />
                  SEO & Social Share Metadata
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-medium text-slate-300 mb-1">
                      SEO Title (defaults to Title | Deskwork)
                    </label>
                    <input
                      type="text"
                      value={editingPost.seoTitle || ''}
                      onChange={(e) => setEditingPost({ ...editingPost, seoTitle: e.target.value })}
                      placeholder="Custom search result title..."
                      className="w-full bg-slate-900 border border-slate-700/80 rounded-lg px-3 py-1.5 text-xs text-white"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-medium text-slate-300 mb-1">
                      Canonical URL
                    </label>
                    <input
                      type="text"
                      value={editingPost.canonicalUrl || ''}
                      onChange={(e) => setEditingPost({ ...editingPost, canonicalUrl: e.target.value })}
                      placeholder={`https://deskwork.tools/blog/${editingPost.slug || ''}`}
                      className="w-full bg-slate-900 border border-slate-700/80 rounded-lg px-3 py-1.5 text-xs text-white font-mono"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-medium text-slate-300 mb-1">
                    Meta Description
                  </label>
                  <textarea
                    rows={2}
                    value={editingPost.seoDescription || ''}
                    onChange={(e) => setEditingPost({ ...editingPost, seoDescription: e.target.value })}
                    placeholder="Custom meta description for search snippets..."
                    className="w-full bg-slate-900 border border-slate-700/80 rounded-lg px-3 py-1.5 text-xs text-white"
                  />
                </div>

                {/* Google Snippet Simulation */}
                <div className="p-3 bg-white text-slate-900 rounded-lg border border-slate-300 text-xs">
                  <div className="text-[11px] text-[#202124]">deskwork.tools &rsaquo; blog &rsaquo; {editingPost.slug || 'article.html'}</div>
                  <div className="text-base text-[#1a0dab] font-medium hover:underline cursor-pointer truncate">
                    {editingPost.seoTitle || editingPost.title || 'Deskwork Article Title'}
                  </div>
                  <div className="text-xs text-[#4d5156] line-clamp-2 mt-0.5">
                    {editingPost.seoDescription || editingPost.excerpt || 'Article summary description displayed on search results pages.'}
                  </div>
                </div>
              </div>
            </div>

            {/* Modal Actions Footer */}
            <div className="flex flex-wrap items-center justify-between gap-3 pt-4 border-t border-slate-800">
              <div className="flex flex-col sm:flex-row sm:items-center gap-2">
                <div className="flex items-center gap-2">
                  <span className="text-xs text-slate-400">Save As:</span>
                  <select
                    value={editingPost.status || 'draft'}
                    onChange={(e) => setEditingPost({ ...editingPost, status: e.target.value as any })}
                    className="bg-slate-900 border border-slate-700 rounded-lg px-2.5 py-1 text-xs text-white cursor-pointer"
                  >
                    <option value="draft">Draft (Private)</option>
                    <option value="published">Published (Live Static)</option>
                    <option value="scheduled">Scheduled</option>
                  </select>

                  {editingPost.status === 'scheduled' && (
                    <input
                      type="datetime-local"
                      value={editingPost.publishAt || ''}
                      onChange={(e) => setEditingPost({ ...editingPost, publishAt: e.target.value })}
                      className="bg-slate-900 border border-slate-700 rounded-lg px-2 py-1 text-xs text-white"
                    />
                  )}
                </div>

                {editingPost.status === 'scheduled' && (
                  <p className="text-[11px] text-amber-400/90 italic">
                    Scheduled status is saved, but automatic publication requires a future scheduler integration.
                  </p>
                )}
              </div>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setIsEditing(false)}
                  disabled={saving}
                  className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-xs font-semibold text-slate-200 transition-colors cursor-pointer"
                >
                  Cancel
                </button>

                <button
                  type="button"
                  onClick={() => handleSave('draft')}
                  disabled={saving}
                  className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 border border-slate-700 text-xs font-semibold text-slate-200 transition-colors cursor-pointer"
                >
                  Save Draft
                </button>

                <button
                  type="button"
                  onClick={() => handleSave('published')}
                  disabled={saving}
                  className="px-4 py-2 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 text-xs font-bold transition-all shadow-lg shadow-emerald-500/10 cursor-pointer disabled:opacity-50"
                >
                  {saving ? 'Publishing...' : 'Publish Article Now'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Media Picker Modal (when selecting featured image) */}
      {showMediaPicker && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/85 backdrop-blur-xs">
          <div className="bg-[#111724] border border-slate-800 rounded-2xl max-w-4xl w-full p-6 space-y-4 shadow-2xl max-h-[90vh] flex flex-col">
            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <h3 className="text-base font-bold text-white flex items-center gap-2">
                <ImageIcon className="w-4 h-4 text-emerald-400" />
                Select Image from Media Vault
              </h3>
              <button
                onClick={() => setShowMediaPicker(false)}
                className="p-1 rounded text-slate-400 hover:text-white cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto">
              <MediaVaultView
                isModalPicker
                onSelectImage={(url) => {
                  setEditingPost((prev) => ({ ...prev, image: url }));
                  setShowMediaPicker(false);
                }}
                onCloseModal={() => setShowMediaPicker(false)}
              />
            </div>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {deleteTarget && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-xs">
          <div className="bg-[#111724] border border-slate-800 rounded-2xl max-w-md w-full p-6 space-y-4 shadow-2xl">
            <div className="flex items-center gap-3 text-rose-400">
              <div className="w-10 h-10 rounded-xl bg-rose-950/60 border border-rose-800/60 flex items-center justify-center">
                <Trash2 className="w-5 h-5 text-rose-400" />
              </div>
              <div>
                <h3 className="text-base font-bold text-white">Delete Article Confirmation</h3>
                <p className="text-xs text-slate-400">Permanent destruction of article and static file</p>
              </div>
            </div>

            <div className="p-3 bg-slate-900 border border-slate-800 rounded-xl text-xs space-y-1">
              <div className="text-white font-semibold">{deleteTarget.title}</div>
              <div className="text-slate-400 font-mono text-[11px]">/{deleteTarget.slug}</div>
            </div>

            <p className="text-xs text-slate-300 leading-relaxed">
              Are you sure you want to permanently delete this article? This will remove it from the CMS master store, delete the public static file (<code className="text-slate-300 font-mono">blog/{deleteTarget.slug}</code>), and update <code className="text-slate-300 font-mono">blog/posts.json</code>.
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
