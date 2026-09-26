import fs from 'fs';
import path from 'path';
import { IMediaStorageDriver, StoredMediaFile } from './media-storage.interface.js';

/**
 * LocalFilesystemMediaDriver
 *
 * Current active implementation of IMediaStorageDriver for local filesystem storage.
 * Manages uploads in `public/uploads/blog/` and inspects static `public/images/`.
 * In Phase 5B, this will be complemented by a GcsMediaStorageDriver.
 */
export class LocalFilesystemMediaDriver implements IMediaStorageDriver {
  private uploadsDir: string;
  private systemImagesDir: string;

  constructor(uploadsDir?: string, systemImagesDir?: string) {
    this.uploadsDir = uploadsDir || path.resolve(process.cwd(), 'public', 'uploads', 'blog');
    this.systemImagesDir = systemImagesDir || path.resolve(process.cwd(), 'public', 'images');

    if (!fs.existsSync(this.uploadsDir)) {
      try {
        fs.mkdirSync(this.uploadsDir, { recursive: true });
      } catch (err) {
        console.error('[LocalFilesystemMediaDriver] Failed to create uploadsDir:', err);
      }
    }
  }

  private getMimeType(ext: string): string {
    switch (ext.toLowerCase()) {
      case '.jpg':
      case '.jpeg':
        return 'image/jpeg';
      case '.png':
        return 'image/png';
      case '.webp':
        return 'image/webp';
      case '.gif':
        return 'image/gif';
      default:
        return 'application/octet-stream';
    }
  }

  async save(filename: string, buffer: Buffer, mimeType: string): Promise<StoredMediaFile> {
    const safeName = path.basename(filename);
    const targetPath = path.join(this.uploadsDir, safeName);

    if (!targetPath.startsWith(this.uploadsDir)) {
      throw new Error('Invalid upload destination path: path traversal detected.');
    }

    await fs.promises.writeFile(targetPath, buffer);

    return {
      id: `media_${safeName}`,
      filename: safeName,
      url: `/uploads/blog/${safeName}`,
      mimeType,
      sizeBytes: buffer.length,
      uploadedAt: new Date().toISOString(),
    };
  }

  async delete(filename: string): Promise<boolean> {
    const safeName = path.basename(filename);
    const targetPath = path.join(this.uploadsDir, safeName);

    if (!targetPath.startsWith(this.uploadsDir)) {
      throw new Error('Invalid delete path: path traversal detected.');
    }

    if (!fs.existsSync(targetPath)) {
      return false;
    }

    await fs.promises.unlink(targetPath);
    return true;
  }

  async exists(filename: string): Promise<boolean> {
    const safeName = path.basename(filename);
    const targetPath = path.join(this.uploadsDir, safeName);

    if (!targetPath.startsWith(this.uploadsDir)) {
      return false;
    }

    return fs.existsSync(targetPath);
  }

  async list(): Promise<StoredMediaFile[]> {
    const items: StoredMediaFile[] = [];

    if (!fs.existsSync(this.uploadsDir)) {
      return items;
    }

    const files = await fs.promises.readdir(this.uploadsDir);
    for (const file of files) {
      const fullPath = path.join(this.uploadsDir, file);
      try {
        const stat = await fs.promises.stat(fullPath);
        if (!stat.isFile()) continue;

        const ext = path.extname(file);
        const mimeType = this.getMimeType(ext);

        items.push({
          id: `media_${file}`,
          filename: file,
          url: `/uploads/blog/${file}`,
          mimeType,
          sizeBytes: stat.size,
          uploadedAt: stat.mtime.toISOString(),
        });
      } catch (err) {
        console.warn(`[LocalFilesystemMediaDriver] Error reading ${file}:`, err);
      }
    }

    return items;
  }

  async listSystemAssets(): Promise<StoredMediaFile[]> {
    const items: StoredMediaFile[] = [];

    if (!fs.existsSync(this.systemImagesDir)) {
      return items;
    }

    const files = await fs.promises.readdir(this.systemImagesDir);
    for (const file of files) {
      const fullPath = path.join(this.systemImagesDir, file);
      try {
        const stat = await fs.promises.stat(fullPath);
        if (!stat.isFile()) continue;

        const ext = path.extname(file).toLowerCase();
        if (!['.jpg', '.jpeg', '.png', '.webp', '.gif'].includes(ext)) continue;

        items.push({
          id: `sys_${file}`,
          filename: file,
          url: `/images/${file}`,
          mimeType: this.getMimeType(ext),
          sizeBytes: stat.size,
          uploadedAt: stat.mtime.toISOString(),
        });
      } catch {
        // Ignore unreadable system image
      }
    }

    return items;
  }

  getDriverName(): string {
    return 'Local Filesystem Media Driver (public/uploads/blog)';
  }
}
