/**
 * Deskwork Tools - Build-Time Static Site Packager
 *
 * Ensures the production dist/ folder is completely self-contained, 100% static,
 * and ready for GitHub Pages hosting with zero server dependency.
 *
 * Operations:
 * 1. Generates sanitized static ads manifest in data/ads-active.json.
 * 2. Copies root HTML files (faq.html, about.html, contact.html, privacy.html, terms.html, 404.html).
 * 3. Copies blog/ directory (blog/index.html, blog/posts.json, and all static blog HTML articles).
 * 4. Copies data/ads-active.json to dist/data/ads-active.json (and preserves zero secrets).
 * 5. Copies public favicon, manifest, robots.txt, sitemap.xml if present.
 * 6. Adds a .nojekyll file to dist/ to prevent GitHub Pages from ignoring folders starting with underscore.
 */

import fs from 'fs';
import path from 'path';

function copyFileSafe(src: string, dest: string) {
  if (fs.existsSync(src)) {
    const destDir = path.dirname(dest);
    if (!fs.existsSync(destDir)) {
      fs.mkdirSync(destDir, { recursive: true });
    }
    fs.copyFileSync(src, dest);
    console.log(`[Static Builder] Copied ${path.relative(process.cwd(), src)} -> ${path.relative(process.cwd(), dest)}`);
  } else {
    console.warn(`[Static Builder] Warning: Source file ${src} does not exist.`);
  }
}

function copyDirRecursive(srcDir: string, destDir: string) {
  if (!fs.existsSync(srcDir)) return;
  if (!fs.existsSync(destDir)) {
    fs.mkdirSync(destDir, { recursive: true });
  }

  const entries = fs.readdirSync(srcDir, { withFileTypes: true });
  for (const entry of entries) {
    const srcPath = path.join(srcDir, entry.name);
    const destPath = path.join(destDir, entry.name);

    if (entry.isDirectory()) {
      copyDirRecursive(srcPath, destPath);
    } else {
      fs.copyFileSync(srcPath, destPath);
    }
  }
  console.log(`[Static Builder] Copied directory ${path.relative(process.cwd(), srcDir)} -> ${path.relative(process.cwd(), destDir)}`);
}

async function buildStaticDistribution() {
  const root = process.cwd();
  const dist = path.join(root, 'dist');

  if (!fs.existsSync(dist)) {
    console.error('[Static Builder] dist/ directory not found. Please run vite build first.');
    process.exit(1);
  }

  console.log('[Static Builder] Packaging static pages and blog articles into dist/ for GitHub Pages...');

  // 1. Root static informational HTML files
  const rootPages = [
    'faq.html',
    'about.html',
    'contact.html',
    'privacy.html',
    'terms.html',
    '404.html',
    'robots.txt',
    'sitemap.xml',
    'favicon.svg',
  ];

  for (const page of rootPages) {
    const src = path.join(root, page);
    if (fs.existsSync(src)) {
      copyFileSafe(src, path.join(dist, page));
    }
  }

  // 2. Blog directory (index.html, posts.json, and all HTML articles)
  const blogSrc = path.join(root, 'blog');
  const blogDest = path.join(dist, 'blog');
  if (fs.existsSync(blogSrc)) {
    copyDirRecursive(blogSrc, blogDest);
  }

  // 3. Sanitized static ads configuration (data/ads-active.json ONLY - no private configs)
  const adsActiveSrc = path.join(root, 'data', 'ads-active.json');
  if (fs.existsSync(adsActiveSrc)) {
    copyFileSafe(adsActiveSrc, path.join(dist, 'data', 'ads-active.json'));
  }

  // 4. Ensure client-side engines (deskwork.js, telemetry.js, ads-loader.js) are available in dist/src/
  const staticScripts = ['deskwork.js', 'telemetry.js', 'ads-loader.js'];
  for (const script of staticScripts) {
    const srcScript = path.join(root, 'src', script);
    const distScript = path.join(dist, 'src', script);
    if (fs.existsSync(srcScript)) {
      copyFileSafe(srcScript, distScript);
    }
  }

  // 5. GitHub Pages .nojekyll flag
  const noJekyllPath = path.join(dist, '.nojekyll');
  fs.writeFileSync(noJekyllPath, '', 'utf-8');
  console.log('[Static Builder] Created .nojekyll in dist/ for GitHub Pages');

  // 6. Security Audit: Ensure no internal JSON or server secrets leaked into dist/
  const forbiddenFiles = [
    path.join(dist, 'data', 'ads-config.json'),
    path.join(dist, 'data', 'ads-providers.json'),
    path.join(dist, 'data', 'ads-global.json'),
    path.join(dist, 'data', 'cms-posts.json'),
    path.join(dist, 'data', 'analytics-data.json'),
    path.join(dist, '.env'),
  ];

  for (const f of forbiddenFiles) {
    if (fs.existsSync(f)) {
      console.error(`[Static Builder] SECURITY VIOLATION: Private file leaked to dist: ${f}`);
      fs.unlinkSync(f);
      console.log(`[Static Builder] Removed private file: ${f}`);
    }
  }

  // Remove stale root test artifacts copied over from public directory if present
  const staleArtifacts = [
    path.join(dist, 'deskwork-tools-update.zip'),
    path.join(dist, 'file_00000000f4c4821193c77c6c9e5d8755.png'),
  ];
  for (const f of staleArtifacts) {
    if (fs.existsSync(f)) {
      fs.unlinkSync(f);
    }
  }

  console.log('[Static Builder] Static distribution packaging completed successfully.');
}

buildStaticDistribution().catch((err) => {
  console.error('[Static Builder] Error building static distribution:', err);
  process.exit(1);
});
