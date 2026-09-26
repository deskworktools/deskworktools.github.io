import fs from 'fs';
import path from 'path';
import crypto from 'crypto';
import { IStorageDriver } from './storage.interface.js';
import { JsonStorageDriver } from './json.driver.js';
import { IMediaStorageDriver } from './media-storage.interface.js';
import { LocalFilesystemMediaDriver } from './local-media.driver.js';
import {
  BlogPostMeta,
  MediaItem,
  AdPlacement,
  AdProvidersConfig,
  AdGlobalSettings,
  AdminAdsConfigResponse,
  PublicActiveAdsResponse,
  SiteConfig,
  ActivityLogEntry,
  DashboardOverview,
  AnalyticsEventType,
  AnalyticsIngestPayload,
  DailyAnalyticsBucket,
  RecentAnalyticsEvent,
  AnalyticsStorageDocument,
  AnalyticsReport,
} from './types.js';

export const defaultStorageDriver: IStorageDriver = new JsonStorageDriver();
export const defaultMediaDriver: IMediaStorageDriver = new LocalFilesystemMediaDriver();

function escapeHtml(str: string): string {
  if (!str) return '';
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

function formatDateLong(dateStr: string): string {
  try {
    const d = new Date(dateStr);
    if (isNaN(d.getTime())) return dateStr;
    return d.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  } catch {
    return dateStr;
  }
}

function extractContentFromHtml(htmlContent: string): string {
  const match =
    htmlContent.match(/<div class="bap-content">([\s\S]*?)<\/div>\s*<div class="ad-slot">/i) ||
    htmlContent.match(/<div class="bap-content">([\s\S]*?)<\/div>/i);
  return match ? match[1].trim() : '';
}

export function generateStaticArticleHtml(post: BlogPostMeta): string {
  const pageTitle = post.seoTitle ? post.seoTitle : `${post.title} | Deskwork`;
  const metaDesc = post.seoDescription || post.excerpt;
  const canonicalHref =
    post.canonicalUrl || `https://deskworktools.github.io/blog/${post.slug}`;
  const formattedDate = formatDateLong(post.date);
  const readTimeStr = post.readTime || '5 min read';
  const authorStr = post.author || 'Deskwork';
  const categoryStr = post.category || 'Guides';

  const featuredImgMarkup = post.image
    ? `<div style="margin:20px 0;text-align:center;"><img src="${escapeHtml(post.image)}" alt="${escapeHtml(post.title)}" style="max-width:100%;height:auto;border-radius:8px;box-shadow:0 2px 8px rgba(0,0,0,0.08);" loading="lazy"></div>`
    : '';

  return `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>${escapeHtml(pageTitle)}</title>
<meta name="description" content="${escapeHtml(metaDesc)}">
<link rel="canonical" href="${escapeHtml(canonicalHref)}">
<meta property="og:title" content="${escapeHtml(post.title)}">
<meta property="og:description" content="${escapeHtml(metaDesc)}">
<meta property="og:type" content="article">
<meta property="og:url" content="${escapeHtml(canonicalHref)}">
${post.image ? `<meta property="og:image" content="${escapeHtml(post.image)}">` : ''}
<link rel="icon" type="image/svg+xml" href="../favicon.svg">
<link href="https://fonts.googleapis.com/css2?family=Fraunces:opsz,wght@9..144,400;9..144,600;9..144,700&family=IBM+Plex+Sans:wght@400;500;600&display=swap" rel="stylesheet">
<style>
:root{--paper:#EDF1F5;--paper-raised:#FFFFFF;--ink:#1B2430;--ink-soft:#4B5563;--stamp:#C1443C;--stamp-dark:#9E362F;--line:#D9E1E8;--radius:10px}
html{box-sizing:border-box;overflow-x:hidden;width:100%;max-width:100%;-webkit-text-size-adjust:100%}*,*::before,*::after{box-sizing:inherit}body{margin:0;background:var(--paper);color:var(--ink);font-family:'IBM Plex Sans',sans-serif;line-height:1.65;overflow-x:hidden;width:100%;max-width:100%}h1,h2,h3,p,.bap-excerpt,.bap-byline,.bap-content{overflow-wrap:break-word;word-break:break-word;}img{max-width:100%;height:auto;}.wrap{max-width:760px;margin:0 auto;padding:0 20px;width:100%;box-sizing:border-box;}
header{padding:32px 0 0}.brand{display:inline-flex;align-items:center;text-decoration:none;color:inherit;margin-bottom:6px}.site-logo{height:34px;width:auto;max-width:100%;display:block;object-fit:contain}.brand h1{font-family:'Fraunces',serif;font-size:1.4rem;font-weight:600;margin:0}.mark{width:14px;height:14px;background:var(--stamp);transform:rotate(45deg);flex-shrink:0}a.back-link{color:var(--ink-soft);font-size:.85rem;text-decoration:none;border-bottom:1px solid var(--line)}
main{padding:26px 0 60px}article{background:var(--paper-raised);border:1px solid var(--line);border-radius:var(--radius);overflow:hidden;box-shadow:0 6px 20px rgba(27,36,48,.08);width:100%;max-width:100%;min-width:0;box-sizing:border-box;}.bap-body{padding:32px}.bap-category{display:inline-block;background:var(--paper);color:var(--stamp-dark);font-size:.72rem;font-weight:600;letter-spacing:.04em;text-transform:uppercase;padding:4px 10px;border-radius:3px;margin-bottom:12px}
h1{font-family:'Fraunces',serif;font-size:2.25rem;margin:0 0 12px;line-height:1.18}.bap-excerpt{color:var(--ink-soft);font-size:1.08rem;margin-bottom:14px}.bap-byline{font-size:.82rem;color:var(--ink-soft);margin-bottom:26px;padding-bottom:18px;border-bottom:1px solid var(--line)}
.bap-content{font-size:1.02rem;line-height:1.8}.bap-content h2{font-family:'Fraunces',serif;font-size:1.55rem;margin:34px 0 10px}.bap-content h3{font-family:'Fraunces',serif;font-size:1.18rem;margin:24px 0 8px}.bap-content p{margin:0 0 17px}.bap-content ul,.bap-content ol{margin:0 0 18px;padding-left:24px}.bap-content li{margin-bottom:7px}.bap-content a{color:var(--stamp-dark);font-weight:500}.bap-content blockquote{border-left:3px solid var(--stamp);padding-left:16px;color:var(--ink-soft);margin:20px 0;font-style:italic}
.tip{background:#F5F7F9;border-left:4px solid var(--stamp);padding:15px 17px;margin:22px 0;border-radius:5px;max-width:100%;box-sizing:border-box;}.tip strong{display:block;margin-bottom:3px}.cta{background:var(--ink);color:#fff;border-radius:9px;padding:24px;margin:28px 0;max-width:100%;box-sizing:border-box;}.cta h2{color:#fff;margin-top:0}.cta p{color:#E6E9ED}.cta a{display:inline-block;background:#fff;color:var(--ink);padding:9px 15px;border-radius:5px;text-decoration:none;font-weight:600;max-width:100%;white-space:normal;}.faq{border-top:1px solid var(--line);padding-top:4px}.faq h3{margin-top:22px}.ad-slot{display:none;background:#E4E9EE;border:1px dashed var(--line);text-align:center;color:var(--ink-soft);font-size:.78rem;padding:16px;border-radius:6px;margin:24px 0}footer{border-top:1.5px solid var(--line);padding:24px 0 40px;color:var(--ink-soft);font-size:.82rem;margin-top:20px;width:100%;max-width:100%;box-sizing:border-box;}footer a{color:var(--ink-soft);margin-right:16px}@media(max-width:600px){.wrap{padding:0 14px}.bap-body{padding:18px 14px}h1{font-size:1.75rem}.bap-content{font-size:.98rem}}
</style>
</head>
<body>
<header><div class="wrap"><a class="brand" href="../index.html" aria-label="Deskwork Tools"><img src="/images/deskwork-tools-brand-logo.png?v=20260918" alt="Deskwork Tools" class="site-logo" width="138" height="44"></a><a class="back-link" href="index.html">&larr; All posts</a></div></header>
<main><div class="wrap"><article><div class="bap-body">
<span class="bap-category">${escapeHtml(categoryStr)}</span>
<h1>${escapeHtml(post.title)}</h1>
<div class="bap-excerpt">${escapeHtml(post.excerpt)}</div>
<div class="bap-byline">By ${escapeHtml(authorStr)} &bull; ${formattedDate} &bull; ${escapeHtml(readTimeStr)}</div>
${featuredImgMarkup}
<div class="bap-content">
${post.content || '<p>' + escapeHtml(post.excerpt) + '</p>'}
</div>
</div></article></div></main>
<footer>
  <div class="wrap" style="display:flex;flex-wrap:wrap;gap:12px;justify-content:center;">
    <a href="../index.html">All Tools</a>
    <a href="index.html">Blog</a>
    <a href="../about.html">About</a>
    <a href="../privacy.html">Privacy Policy</a>
    <a href="../terms.html">Terms of Use</a>
    <a href="../contact.html">Contact Us</a>
  </div>
</footer>
<script src="/src/telemetry.js" defer></script>
</body>
</html>`;
}

export class PostRepository {
  constructor(private driver: IStorageDriver = defaultStorageDriver) {}

  /**
   * Loads all posts from the master CMS store.
   * If master store is empty, seeds from existing public blog/posts.json
   * and populates content from blog/<slug> if present.
   */
  async getAll(): Promise<BlogPostMeta[]> {
    let posts = await this.driver.read<BlogPostMeta[]>('cms-posts', []);

    if (posts.length === 0) {
      // Seed from existing blog/posts.json
      const publicPosts = await this.driver.read<any[]>('posts', []);
      posts = publicPosts.map((p) => {
        let content = '';
        try {
          const htmlFile = path.resolve(process.cwd(), 'blog', p.slug);
          if (fs.existsSync(htmlFile)) {
            const raw = fs.readFileSync(htmlFile, 'utf-8');
            content = extractContentFromHtml(raw);
          }
        } catch (e) {
          console.warn(`[PostRepository] Could not read content for ${p.slug}:`, e);
        }

        return {
          slug: p.slug,
          title: p.title,
          excerpt: p.excerpt || '',
          category: p.category || 'Resume & Career',
          date: p.date || new Date().toISOString().split('T')[0],
          author: p.author || 'Deskwork',
          image: p.image || '',
          readTime: p.readTime || '5 min read',
          status: 'published' as const,
          content: content || `<p>${escapeHtml(p.excerpt || '')}</p>`,
          createdAt: p.date ? `${p.date}T00:00:00.000Z` : new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        };
      });

      if (posts.length > 0) {
        await this.driver.write('cms-posts', posts);
      }
    }

    // Check for any scheduled posts that have reached their publish date/time
    let modified = false;
    const nowIso = new Date().toISOString();
    for (const p of posts) {
      if (p.status === 'scheduled') {
        const schedTime = p.publishAt || `${p.date}T00:00:00.000Z`;
        if (schedTime <= nowIso) {
          p.status = 'published';
          p.updatedAt = nowIso;
          modified = true;
          // Generate static file
          await this.syncPublicArticle(p);
        }
      }
    }

    if (modified) {
      await this.driver.write('cms-posts', posts);
      await this.syncPublicPostsJson(posts);
    }

    return posts.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
  }

  async getPublished(): Promise<BlogPostMeta[]> {
    const all = await this.getAll();
    return all.filter((p) => p.status === 'published');
  }

  async getDrafts(): Promise<BlogPostMeta[]> {
    const all = await this.getAll();
    return all.filter((p) => p.status === 'draft');
  }

  async getScheduled(): Promise<BlogPostMeta[]> {
    const all = await this.getAll();
    return all.filter((p) => p.status === 'scheduled');
  }

  async getBySlug(slug: string): Promise<BlogPostMeta | null> {
    const all = await this.getAll();
    const normalized = slug.endsWith('.html') ? slug : `${slug}.html`;
    return all.find((p) => p.slug === normalized || p.slug === slug) || null;
  }

  /**
   * Saves or updates a post in the CMS.
   * If status is 'published', updates blog/posts.json and blog/<slug>.html.
   * If status is 'draft' or 'scheduled', removes from blog/posts.json.
   */
  async savePost(postData: Partial<BlogPostMeta>): Promise<BlogPostMeta> {
    const all = await this.getAll();
    const now = new Date().toISOString();

    let rawSlug = (postData.slug || postData.title || 'untitled-post').toLowerCase().trim();
    if (rawSlug.endsWith('.html')) {
      rawSlug = rawSlug.slice(0, -5);
    }
    let cleanSlug = rawSlug
      .replace(/[^a-z0-9-_]/g, '-')
      .replace(/-+/g, '-')
      .replace(/^-|-$/g, '');

    cleanSlug = `${cleanSlug || 'post'}.html`;

    // Calculate reading time
    let readTime = postData.readTime;
    if (!readTime && postData.content) {
      const words = postData.content.replace(/<[^>]*>/g, ' ').trim().split(/\s+/).length;
      const minutes = Math.max(1, Math.ceil(words / 200));
      readTime = `${minutes} min read`;
    }

    const existingIdx = all.findIndex((p) => p.slug === cleanSlug || (postData.slug && p.slug === postData.slug));

    // Optimistic concurrency check: if postData includes revision, it must match current post revision
    if (existingIdx >= 0) {
      const currentPost = all[existingIdx];
      const currentRev = typeof currentPost.revision === 'number' ? currentPost.revision : 1;
      if (typeof postData.revision === 'number' && postData.revision !== currentRev) {
        const conflictErr: any = new Error(
          `Conflict: Post "${currentPost.title}" was modified by another administrator (current revision: ${currentRev}, your revision: ${postData.revision}). Please refresh the editor and reapply your changes.`,
        );
        conflictErr.statusCode = 409;
        conflictErr.code = 'REVISION_CONFLICT';
        throw conflictErr;
      }
    }

    const nextRevision = existingIdx >= 0 ? (typeof all[existingIdx].revision === 'number' ? all[existingIdx].revision! + 1 : 2) : 1;

    const post: BlogPostMeta = {
      slug: cleanSlug,
      revision: nextRevision,
      title: postData.title?.trim() || 'Untitled Post',
      excerpt: postData.excerpt?.trim() || '',
      category: postData.category?.trim() || 'General',
      date: postData.date || now.split('T')[0],
      author: postData.author?.trim() || 'Deskwork',
      image: postData.image || '',
      readTime: readTime || '5 min read',
      status: postData.status || 'draft',
      publishAt: postData.publishAt,
      tags: postData.tags || [],
      seoTitle: postData.seoTitle?.trim(),
      seoDescription: postData.seoDescription?.trim(),
      canonicalUrl: postData.canonicalUrl?.trim(),
      content: postData.content || '',
      createdAt: existingIdx >= 0 ? all[existingIdx].createdAt : now,
      updatedAt: now,
    };

    if (existingIdx >= 0) {
      all[existingIdx] = post;
    } else {
      all.unshift(post);
    }

    // Persist to CMS master store
    await this.driver.write('cms-posts', all);

    // Sync public static assets
    if (post.status === 'published') {
      await this.syncPublicArticle(post);
    } else {
      // If was previously published, remove static file or keep as unlisted
      const targetHtml = path.resolve(process.cwd(), 'blog', post.slug);
      if (fs.existsSync(targetHtml)) {
        try {
          // Remove static file when explicitly unpublished
          await fs.promises.unlink(targetHtml);
        } catch (e) {
          console.warn(`[PostRepository] Could not remove unpublished file ${post.slug}:`, e);
        }
      }
    }

    // Always update blog/posts.json with published items
    await this.syncPublicPostsJson(all);

    return post;
  }

  async deletePost(slug: string): Promise<boolean> {
    const all = await this.getAll();
    const normalized = slug.endsWith('.html') ? slug : `${slug}.html`;
    const filtered = all.filter((p) => p.slug !== normalized && p.slug !== slug);

    if (filtered.length === all.length) {
      return false;
    }

    await this.driver.write('cms-posts', filtered);
    await this.syncPublicPostsJson(filtered);

    // Remove static HTML file if it exists
    const targetHtml = path.resolve(process.cwd(), 'blog', normalized);
    if (fs.existsSync(targetHtml)) {
      try {
        await fs.promises.unlink(targetHtml);
      } catch (e) {
        console.warn(`[PostRepository] Could not unlink ${targetHtml}:`, e);
      }
    }

    return true;
  }

  /**
   * DERIVED STATIC OUTPUT SYNC (Phase 5A Transition Boundary):
   * Writes static blog/<slug>.html on local disk for direct web serving.
   * In Phase 5D, this will be transitioned to an Express dynamic route
   * with in-memory caching, eliminating container filesystem writes.
   */
  private async syncPublicArticle(post: BlogPostMeta): Promise<void> {
    const targetHtml = path.resolve(process.cwd(), 'blog', post.slug);
    const htmlContent = generateStaticArticleHtml(post);
    const tempHtml = `${targetHtml}.${Date.now()}.tmp`;
    await fs.promises.writeFile(tempHtml, htmlContent, 'utf-8');
    await fs.promises.rename(tempHtml, targetHtml);
  }

  /**
   * DERIVED STATIC OUTPUT SYNC (Phase 5A Transition Boundary):
   * Synchronizes blog/posts.json with the published subset of authoritative cms-posts.
   */
  private async syncPublicPostsJson(allPosts: BlogPostMeta[]): Promise<void> {
    const published = allPosts
      .filter((p) => p.status === 'published')
      .map((p) => ({
        title: p.title,
        excerpt: p.excerpt,
        slug: p.slug,
        image: p.image,
        date: p.date,
        category: p.category,
        author: p.author,
        readTime: p.readTime,
      }));

    await this.driver.write('posts', published);
  }
}

export class MediaRepository {
  private mediaDriver: IMediaStorageDriver;

  constructor(mediaDriver?: IMediaStorageDriver) {
    this.mediaDriver = mediaDriver || defaultMediaDriver;
  }

  async getAll(postRepo?: PostRepository): Promise<MediaItem[]> {
    const items: MediaItem[] = [];
    const posts = postRepo ? await postRepo.getAll() : [];

    // 1. User uploaded media from media storage driver
    const uploads = await this.mediaDriver.list();
    for (const file of uploads) {
      const usedInPosts: string[] = [];
      for (const p of posts) {
        if (
          p.image?.includes(file.filename) ||
          p.content?.includes(file.filename) ||
          p.image?.includes(file.url) ||
          p.content?.includes(file.url)
        ) {
          usedInPosts.push(p.title);
        }
      }

      items.push({
        id: file.id,
        filename: file.filename,
        url: file.url,
        mimeType: file.mimeType,
        sizeBytes: file.sizeBytes,
        uploadedAt: file.uploadedAt,
        inUse: usedInPosts.length > 0,
        usedInPosts,
      });
    }

    // 2. Also list system images for convenience (read-only system assets)
    const sysFiles = await this.mediaDriver.listSystemAssets();
    for (const file of sysFiles) {
      const usedInPosts: string[] = [];
      for (const p of posts) {
        if (p.image?.includes(file.filename) || p.content?.includes(file.filename)) {
          usedInPosts.push(p.title);
        }
      }

      items.push({
        id: file.id,
        filename: file.filename,
        url: file.url,
        mimeType: file.mimeType,
        sizeBytes: file.sizeBytes,
        uploadedAt: file.uploadedAt,
        inUse: usedInPosts.length > 0,
        usedInPosts,
      });
    }

    return items.sort((a, b) => new Date(b.uploadedAt).getTime() - new Date(a.uploadedAt).getTime());
  }

  async saveFile(originalName: string, buffer: Buffer, mimeType: string): Promise<MediaItem> {
    // Validate MIME - strictly disallow SVG (Option A: raster only)
    const allowed = ['image/jpeg', 'image/png', 'image/webp', 'image/gif'];
    if (!allowed.includes(mimeType.toLowerCase())) {
      throw new Error(`Unsupported image format (${mimeType}). Allowed: JPG, PNG, WebP, GIF.`);
    }

    // Size limit: 5MB
    if (buffer.length > 5 * 1024 * 1024) {
      const sizeErr: any = new Error('File size exceeds the 5MB limit. Please upload an image under 5MB.');
      sizeErr.statusCode = 413;
      throw sizeErr;
    }

    // Sanitize filename & prevent path traversal
    const ext = path.extname(originalName).toLowerCase();
    const baseName = path
      .basename(originalName, ext)
      .toLowerCase()
      .replace(/[^a-z0-9-_]/g, '-')
      .replace(/-+/g, '-')
      .substring(0, 40);

    const randomSuffix = crypto.randomBytes(6).toString('hex');
    const safeFilename = `${Date.now()}-${randomSuffix}-${baseName || 'upload'}${ext}`;

    const stored = await this.mediaDriver.save(safeFilename, buffer, mimeType);

    return {
      id: stored.id,
      filename: stored.filename,
      url: stored.url,
      mimeType: stored.mimeType,
      sizeBytes: stored.sizeBytes,
      uploadedAt: stored.uploadedAt,
      inUse: false,
      usedInPosts: [],
    };
  }

  async deleteFile(filename: string, postRepo?: PostRepository): Promise<{ success: boolean; error?: string }> {
    const safeName = path.basename(filename);

    const exists = await this.mediaDriver.exists(safeName);
    if (!exists) {
      return { success: false, error: 'File does not exist or was already deleted.' };
    }

    // Check if in use
    if (postRepo) {
      const posts = await postRepo.getAll();
      const inUsePosts = posts
        .filter((p) => p.image?.includes(safeName) || p.content?.includes(safeName))
        .map((p) => p.title);
      if (inUsePosts.length > 0) {
        return {
          success: false,
          error: `Cannot delete: Image is currently referenced in "${inUsePosts.join(', ')}". Remove the image from the post first.`,
        };
      }
    }

    const deleted = await this.mediaDriver.delete(safeName);
    if (!deleted) {
      return { success: false, error: 'Failed to delete file from media storage.' };
    }

    return { success: true };
  }
}

export class AdConfigRepository {
  constructor(private driver: IStorageDriver = defaultStorageDriver) {}

  private getDefaults(): AdPlacement[] {
    return [
      { id: 'ad-hdr', name: 'Global Header Leaderboard', location: 'header', provider: 'adsense', enabled: false, device: 'all' },
      { id: 'ad-home', name: 'Homepage In-Feed Banner', location: 'homepage', provider: 'adsense', enabled: false, device: 'desktop' },
      { id: 'ad-blog-top', name: 'Blog Top Leaderboard (728x90)', location: 'blog', provider: 'adsense', enabled: false, device: 'desktop' },
      { id: 'ad-blog-mid', name: 'Blog Mid-Content Rectangle (300x250)', location: 'content', provider: 'adsense', enabled: false, device: 'all' },
      { id: 'ad-tools', name: 'Tool Workspace Sidebar / Footer', location: 'tools', provider: 'adsterra', enabled: false, device: 'all' },
      { id: 'ad-mobile', name: 'Mobile Sticky Anchor Banner', location: 'mobile', provider: 'custom', enabled: false, device: 'mobile' },
    ];
  }

  getDefaultProviders(): AdProvidersConfig {
    return {
      adsense: {
        enabled: false,
        publisherId: '',
        autoAdsEnabled: false,
        notes: '',
      },
      adsterra: {
        enabled: false,
        placementKey: '',
        notes: '',
      },
      custom: {
        enabled: false,
        notes: '',
      },
    };
  }

  getDefaultGlobal(): AdGlobalSettings {
    return {
      globalEnabled: false,
      updatedAt: new Date().toISOString(),
    };
  }

  async getAll(): Promise<AdPlacement[]> {
    return this.driver.read<AdPlacement[]>('ads-config', this.getDefaults());
  }

  async getActive(): Promise<AdPlacement[]> {
    const all = await this.getAll();
    return all.filter((a) => a.enabled);
  }

  async getProvidersConfig(): Promise<AdProvidersConfig> {
    return this.driver.read<AdProvidersConfig>('ads-providers', this.getDefaultProviders());
  }

  async updateProvidersConfig(updates: Partial<AdProvidersConfig>): Promise<AdProvidersConfig> {
    const current = await this.getProvidersConfig();
    const merged: AdProvidersConfig = {
      adsense: { ...current.adsense, ...(updates.adsense || {}) },
      adsterra: { ...current.adsterra, ...(updates.adsterra || {}) },
      custom: { ...current.custom, ...(updates.custom || {}) },
    };
    await this.driver.write('ads-providers', merged);
    return merged;
  }

  async getGlobalSettings(): Promise<AdGlobalSettings> {
    return this.driver.read<AdGlobalSettings>('ads-global', this.getDefaultGlobal());
  }

  async updateGlobalSettings(globalEnabled: boolean): Promise<AdGlobalSettings> {
    const next: AdGlobalSettings = {
      globalEnabled,
      updatedAt: new Date().toISOString(),
    };
    await this.driver.write('ads-global', next);
    return next;
  }

  async saveAllSlots(slots: AdPlacement[]): Promise<void> {
    await this.driver.write('ads-config', slots);
  }

  async updateSlot(id: string, updates: Partial<AdPlacement>): Promise<AdPlacement | null> {
    const slots = await this.getAll();
    const idx = slots.findIndex((s) => s.id === id);
    if (idx === -1) return null;

    slots[idx] = {
      ...slots[idx],
      ...updates,
      id: slots[idx].id, // Prevent altering primary id
      updatedAt: new Date().toISOString(),
    };

    await this.saveAllSlots(slots);
    return slots[idx];
  }

  async getAdminConfig(): Promise<AdminAdsConfigResponse> {
    const [global, providers, slots] = await Promise.all([
      this.getGlobalSettings(),
      this.getProvidersConfig(),
      this.getAll(),
    ]);

    return {
      global,
      providers,
      slots,
      storageNotice:
        'Storage Notice: Current storage: local JSON / development storage. Ephemeral on Cloud Run container replacement. Ads configuration resets when new instances deploy until migration to durable cloud storage.',
    };
  }

  async getPublicActive(): Promise<PublicActiveAdsResponse> {
    const [global, providers, slots] = await Promise.all([
      this.getGlobalSettings(),
      this.getProvidersConfig(),
      this.getAll(),
    ]);

    if (!global.globalEnabled) {
      return {
        globalEnabled: false,
        providers: {},
        placements: [],
      };
    }

    // Filter slots where slot is enabled AND its corresponding provider is enabled
    const activeSlots = slots.filter((slot) => {
      if (!slot.enabled) return false;
      if (slot.provider === 'adsense') {
        return providers.adsense.enabled && Boolean(providers.adsense.publisherId.trim());
      }
      if (slot.provider === 'adsterra') {
        return providers.adsterra.enabled && Boolean(providers.adsterra.placementKey.trim());
      }
      if (slot.provider === 'custom') {
        return providers.custom.enabled && Boolean(slot.customBanner?.imageUrl && slot.customBanner?.destinationUrl);
      }
      return false;
    });

    const sanitizedPlacements = activeSlots.map((slot) => ({
      id: slot.id,
      location: slot.location,
      provider: slot.provider,
      device: slot.device,
      adUnitId: slot.adUnitId || undefined,
      format: slot.format || undefined,
      customBanner: slot.customBanner
        ? {
            imageUrl: slot.customBanner.imageUrl,
            destinationUrl: slot.customBanner.destinationUrl,
            altText: slot.customBanner.altText,
            title: slot.customBanner.title || undefined,
            width: slot.customBanner.width,
            height: slot.customBanner.height,
          }
        : undefined,
    }));

    return {
      globalEnabled: true,
      providers: {
        adsense:
          providers.adsense.enabled && providers.adsense.publisherId.trim()
            ? {
                publisherId: providers.adsense.publisherId.trim(),
                autoAdsEnabled: providers.adsense.autoAdsEnabled,
              }
            : undefined,
        adsterra:
          providers.adsterra.enabled && providers.adsterra.placementKey.trim()
            ? {
                placementKey: providers.adsterra.placementKey.trim(),
              }
            : undefined,
      },
      placements: sanitizedPlacements,
    };
  }
}

export class SiteConfigRepository {
  constructor(private driver: IStorageDriver = defaultStorageDriver) {}

  private getDefaults(): SiteConfig {
    return {
      siteName: 'Deskwork Tools',
      siteUrl: 'https://deskworktools.github.io',
      defaultTitle: 'Free Online Career & Productivity Tools | Deskwork Tools',
      defaultDescription: 'Fast, secure, browser-based career utilities: 10 resume templates, Japanese JIS rirekisho, image conversion, PDF merge, and document tools.',
      robotsEnabled: true,
      sitemapEnabled: true,
      updatedAt: new Date().toISOString(),
    };
  }

  async get(): Promise<SiteConfig> {
    return this.driver.read<SiteConfig>('site-config', this.getDefaults());
  }
}

export class ActivityLogRepository {
  constructor(private driver: IStorageDriver = defaultStorageDriver) {}

  async getAll(): Promise<ActivityLogEntry[]> {
    return this.driver.read<ActivityLogEntry[]>('activity-log', []);
  }

  async log(action: string, details: string, ipHash?: string): Promise<void> {
    const entries = await this.getAll();
    const entry: ActivityLogEntry = {
      id: `act_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
      action,
      details,
      timestamp: new Date().toISOString(),
      ipHash,
    };
    // Keep latest 100 entries
    const updated = [entry, ...entries].slice(0, 100);
    await this.driver.write('activity-log', updated);
  }
}

export class AnalyticsRepository {
  private dailySaltDate: string = '';
  private dailySaltSecret: string = '';

  constructor(private driver: IStorageDriver = defaultStorageDriver) {}

  /**
   * Generates or retrieves an ephemeral in-memory salt for the current UTC day.
   * If ANALYTICS_SECRET is configured, derives deterministic daily salt:
   * DailySalt = HMAC-SHA256(ANALYTICS_SECRET, "deskwork-visitor-salt:" || YYYY-MM-DD)
   * This guarantees cross-instance parity and automatic midnight rollover without network calls.
   * Discards raw IP address immediately.
   */
  private getPrivacySalt(dateStr: string): string {
    const analyticsSecret = process.env.ANALYTICS_SECRET?.trim();
    if (analyticsSecret) {
      return crypto
        .createHmac('sha256', analyticsSecret)
        .update(`deskwork-visitor-salt:${dateStr}`)
        .digest('hex');
    }

    if (this.dailySaltDate !== dateStr || !this.dailySaltSecret) {
      this.dailySaltDate = dateStr;
      this.dailySaltSecret = crypto.randomBytes(32).toString('hex');
    }
    return this.dailySaltSecret;
  }

  /**
   * Computes a privacy-preserving non-reversible one-way visitor hash.
   * - Uses HMAC-SHA256 with the daily rotating salt.
   * - Truncated to 16 hex characters.
   * - Discards the raw IP address immediately.
   * - Cannot be inverted to discover the visitor's IP address.
   * - Cannot be correlated across calendar days.
   */
  private computeVisitorHash(ip: string, dateStr: string): string {
    const salt = this.getPrivacySalt(dateStr);
    return crypto
      .createHmac('sha256', salt)
      .update(ip || '127.0.0.1')
      .digest('hex')
      .substring(0, 16);
  }

  private getDefaultDoc(): AnalyticsStorageDocument {
    return {
      dailyStats: {},
      recentEvents: [],
      totals: {
        pageViews: 0,
        uniqueVisitors: 0,
        toolOpens: 0,
        toolUses: 0,
        blogViews: 0,
        exports: 0,
      },
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
  }

  async getDocument(): Promise<AnalyticsStorageDocument> {
    return this.driver.read<AnalyticsStorageDocument>(
      'analytics-data',
      this.getDefaultDoc(),
    );
  }

  /**
   * Ingests and normalizes an anonymous analytics event.
   * Enforces strict privacy: no raw IP, no user profile, bounded storage.
   */
  async recordEvent(
    payload: AnalyticsIngestPayload,
    clientIp: string,
  ): Promise<void> {
    const doc = await this.getDocument();
    const todayStr = new Date().toISOString().substring(0, 10);

    // Initialize daily bucket if not present
    if (!doc.dailyStats[todayStr]) {
      doc.dailyStats[todayStr] = {
        date: todayStr,
        pageViews: 0,
        uniqueVisitors: 0,
        uniqueHashes: [],
        toolOpens: {},
        toolUses: {},
        blogViews: {},
        exports: {},
      };
    }

    const bucket = doc.dailyStats[todayStr];
    if (!Array.isArray(bucket.uniqueHashes)) {
      bucket.uniqueHashes = [];
    }

    // Daily unique visitor deduplication with rotating HMAC
    const visitorHash = this.computeVisitorHash(clientIp, todayStr);
    if (!bucket.uniqueHashes.includes(visitorHash)) {
      if (bucket.uniqueHashes.length < 10000) {
        bucket.uniqueHashes.push(visitorHash);
      }
      bucket.uniqueVisitors += 1;
      doc.totals.uniqueVisitors += 1;
    }

    let targetLabel = '/';

    switch (payload.type) {
      case 'page_view': {
        bucket.pageViews += 1;
        doc.totals.pageViews += 1;
        targetLabel = payload.path || '/';
        break;
      }
      case 'tool_opened': {
        const tool = payload.tool || 'unknown-tool';
        bucket.toolOpens[tool] = (bucket.toolOpens[tool] || 0) + 1;
        doc.totals.toolOpens += 1;
        targetLabel = tool;
        break;
      }
      case 'tool_used': {
        const tool = payload.tool || 'unknown-tool';
        bucket.toolUses[tool] = (bucket.toolUses[tool] || 0) + 1;
        doc.totals.toolUses += 1;
        targetLabel = tool;
        break;
      }
      case 'blog_view': {
        const slug = payload.slug || 'unknown-article';
        bucket.blogViews[slug] = (bucket.blogViews[slug] || 0) + 1;
        doc.totals.blogViews += 1;
        targetLabel = slug;
        break;
      }
      case 'export_completed': {
        const template = payload.template || 'classic';
        bucket.exports[template] = (bucket.exports[template] || 0) + 1;
        doc.totals.exports += 1;
        targetLabel = template;
        break;
      }
    }

    // Prepend to recent anonymous events (capped at 100)
    const recentEntry: RecentAnalyticsEvent = {
      id: `ev_${Date.now()}_${crypto.randomBytes(3).toString('hex')}`,
      eventType: payload.type,
      target: targetLabel,
      timestamp: new Date().toISOString(),
    };
    doc.recentEvents = [recentEntry, ...doc.recentEvents].slice(0, 100);

    // Retention policy:
    // 1. Keep max 90 days of daily statistics
    // 2. Clear ephemeral daily hash arrays for previous days to conserve storage
    const allDates = Object.keys(doc.dailyStats).sort();
    if (allDates.length > 90) {
      const datesToRemove = allDates.slice(0, allDates.length - 90);
      for (const d of datesToRemove) {
        delete doc.dailyStats[d];
      }
    }

    for (const dateKey of Object.keys(doc.dailyStats)) {
      if (dateKey < todayStr && doc.dailyStats[dateKey].uniqueHashes.length > 0) {
        doc.dailyStats[dateKey].uniqueHashes = []; // purge hashes, keep integer uniqueVisitors
      }
    }

    doc.updatedAt = new Date().toISOString();
    await this.driver.write('analytics-data', doc);
  }

  /**
   * Aggregates real telemetry data for the admin reporting dashboard.
   */
  async getReport(rangeDays: number = 7): Promise<AnalyticsReport> {
    const doc = await this.getDocument();
    const today = new Date();
    const startDate = new Date();
    startDate.setDate(today.getDate() - (rangeDays - 1));

    const startStr = startDate.toISOString().substring(0, 10);
    const endStr = today.toISOString().substring(0, 10);

    // Filter buckets within range
    const filteredBuckets: DailyAnalyticsBucket[] = [];
    const dateCursor = new Date(startDate);
    while (dateCursor <= today) {
      const curStr = dateCursor.toISOString().substring(0, 10);
      const existing = doc.dailyStats[curStr];
      if (existing) {
        filteredBuckets.push(existing);
      } else {
        filteredBuckets.push({
          date: curStr,
          pageViews: 0,
          uniqueVisitors: 0,
          uniqueHashes: [],
          toolOpens: {},
          toolUses: {},
          blogViews: {},
          exports: {},
        });
      }
      dateCursor.setDate(dateCursor.getDate() + 1);
    }

    // Aggregate totals for the requested window
    let windowPageViews = 0;
    let windowUniqueVisitors = 0;
    let windowToolOpens = 0;
    let windowToolUses = 0;
    let windowBlogViews = 0;
    let windowExports = 0;

    const toolUsageMap: Record<string, { opens: number; uses: number }> = {};
    const templateMap: Record<string, number> = {};
    const articleMap: Record<string, number> = {};

    for (const b of filteredBuckets) {
      windowPageViews += b.pageViews;
      windowUniqueVisitors += b.uniqueVisitors;

      for (const [tool, count] of Object.entries(b.toolOpens || {})) {
        windowToolOpens += count;
        if (!toolUsageMap[tool]) toolUsageMap[tool] = { opens: 0, uses: 0 };
        toolUsageMap[tool].opens += count;
      }

      for (const [tool, count] of Object.entries(b.toolUses || {})) {
        windowToolUses += count;
        if (!toolUsageMap[tool]) toolUsageMap[tool] = { opens: 0, uses: 0 };
        toolUsageMap[tool].uses += count;
      }

      for (const [slug, count] of Object.entries(b.blogViews || {})) {
        windowBlogViews += count;
        articleMap[slug] = (articleMap[slug] || 0) + count;
      }

      for (const [tmpl, count] of Object.entries(b.exports || {})) {
        windowExports += count;
        templateMap[tmpl] = (templateMap[tmpl] || 0) + count;
      }
    }

    // Top tools
    const topTools = Object.entries(toolUsageMap)
      .map(([name, stats]) => ({
        name,
        opens: stats.opens,
        uses: stats.uses,
        total: stats.opens + stats.uses,
      }))
      .sort((a, b) => b.total - a.total);

    // Top templates
    const topTemplates = Object.entries(templateMap)
      .map(([name, exports]) => ({ name, exports }))
      .sort((a, b) => b.exports - a.exports);

    // Top articles
    const topArticles = Object.entries(articleMap)
      .map(([slug, views]) => ({ slug, views }))
      .sort((a, b) => b.views - a.views);

    // Top pages derived from page_view recentEvents + common routes
    const pageCounts: Record<string, number> = {};
    for (const ev of doc.recentEvents) {
      if (ev.eventType === 'page_view') {
        pageCounts[ev.target] = (pageCounts[ev.target] || 0) + 1;
      }
    }
    const topPages = Object.entries(pageCounts)
      .map(([path, views]) => ({ path, views }))
      .sort((a, b) => b.views - a.views);

    // Daily trend points
    const dailyTrends = filteredBuckets.map((b) => {
      const toolUseCount = Object.values(b.toolUses || {}).reduce((sum, n) => sum + n, 0);
      const exportCount = Object.values(b.exports || {}).reduce((sum, n) => sum + n, 0);
      const blogViewCount = Object.values(b.blogViews || {}).reduce((sum, n) => sum + n, 0);

      return {
        date: b.date,
        pageViews: b.pageViews,
        uniqueVisitors: b.uniqueVisitors,
        toolUses: toolUseCount,
        exports: exportCount,
        blogViews: blogViewCount,
      };
    });

    return {
      storageType: this.driver.getDriverName(),
      isDurable: false,
      storageNotice: 'Current storage: local filesystem JSON storage (for local development and content authoring).',
      rangeDays,
      dateRange: {
        start: startStr,
        end: endStr,
      },
      totals: {
        pageViews: rangeDays >= 90 ? doc.totals.pageViews : windowPageViews,
        uniqueVisitors: rangeDays >= 90 ? doc.totals.uniqueVisitors : windowUniqueVisitors,
        toolOpens: rangeDays >= 90 ? doc.totals.toolOpens : windowToolOpens,
        toolUses: rangeDays >= 90 ? doc.totals.toolUses : windowToolUses,
        blogViews: rangeDays >= 90 ? doc.totals.blogViews : windowBlogViews,
        exports: rangeDays >= 90 ? doc.totals.exports : windowExports,
      },
      topTools,
      topPages,
      topTemplates,
      topArticles,
      dailyTrends,
      recentEvents: doc.recentEvents,
    };
  }

  async getTodaySummary(): Promise<{
    todayPageViews: number;
    todayVisitors: number;
    todayToolUses: number;
    todayExports: number;
  }> {
    const doc = await this.getDocument();
    const todayStr = new Date().toISOString().substring(0, 10);
    const bucket = doc.dailyStats[todayStr];

    if (!bucket) {
      return {
        todayPageViews: 0,
        todayVisitors: 0,
        todayToolUses: 0,
        todayExports: 0,
      };
    }

    const toolUses = Object.values(bucket.toolUses || {}).reduce((sum, n) => sum + n, 0);
    const exports = Object.values(bucket.exports || {}).reduce((sum, n) => sum + n, 0);

    return {
      todayPageViews: bucket.pageViews,
      todayVisitors: bucket.uniqueVisitors,
      todayToolUses: toolUses,
      todayExports: exports,
    };
  }

  async reset(): Promise<void> {
    await this.driver.write('analytics-data', this.getDefaultDoc());
  }
}

export class OverviewRepository {
  constructor(
    private postRepo: PostRepository = new PostRepository(),
    private adRepo: AdConfigRepository = new AdConfigRepository(),
    private siteRepo: SiteConfigRepository = new SiteConfigRepository(),
    private analyticsRepo: AnalyticsRepository = new AnalyticsRepository(),
    private driver: IStorageDriver = defaultStorageDriver,
  ) {}

  async getOverview(): Promise<DashboardOverview> {
    const posts = await this.postRepo.getAll();
    const published = posts.filter((p) => p.status === 'published');
    const drafts = posts.filter((p) => p.status === 'draft');
    const ads = await this.adRepo.getAll();
    const activeAds = ads.filter((a) => a.enabled);
    const site = await this.siteRepo.get();
    const analytics = await this.analyticsRepo.getTodaySummary();

    return {
      siteName: site.siteName,
      environment: process.env.NODE_ENV === 'production' ? 'Production' : 'Development',
      serverTime: new Date().toISOString(),
      storageDriver: this.driver.getDriverName(),
      publishedPostsCount: published.length,
      draftPostsCount: drafts.length,
      adPlacementsCount: ads.length,
      activeAdPlacementsCount: activeAds.length,
      analyticsStatus: 'collecting',
      analyticsSummary: analytics,
      message: 'Phase 3 Anonymous Privacy-Safe Analytics Active.',
    };
  }
}

