import fs from 'fs';
import path from 'path';
import { IStorageDriver } from './storage.interface.js';

/**
 * JsonStorageDriver
 *
 * NOTE: Initial / development storage driver.
 * Uses local filesystem JSON documents with atomic write patterns.
 * Explicitly designated as non-durable across Cloud Run instance replacements.
 */
export class JsonStorageDriver implements IStorageDriver {
  private baseDir: string;

  constructor(baseDir?: string) {
    this.baseDir = baseDir || path.resolve(process.cwd(), 'data');
    if (!fs.existsSync(this.baseDir)) {
      try {
        fs.mkdirSync(this.baseDir, { recursive: true });
      } catch (err) {
        console.error(`[JsonStorageDriver] Failed to create baseDir ${this.baseDir}:`, err);
      }
    }
  }

  private resolvePath(key: string): string {
    // Special case: sync directly with existing blog/posts.json
    if (key === 'posts') {
      return path.resolve(process.cwd(), 'blog', 'posts.json');
    }
    return path.resolve(this.baseDir, `${key}.json`);
  }

  async read<T>(key: string, defaultValue: T): Promise<T> {
    const filePath = this.resolvePath(key);
    try {
      if (!fs.existsSync(filePath)) {
        // Initialize default if file does not exist
        await this.write(key, defaultValue);
        return defaultValue;
      }
      const raw = await fs.promises.readFile(filePath, 'utf-8');
      if (!raw || raw.trim() === '') {
        return defaultValue;
      }
      return JSON.parse(raw) as T;
    } catch (err) {
      console.warn(`[JsonStorageDriver] Warning reading ${key}, falling back to default:`, err);
      return defaultValue;
    }
  }

  async write<T>(key: string, data: T): Promise<void> {
    const targetPath = this.resolvePath(key);
    const parentDir = path.dirname(targetPath);
    if (!fs.existsSync(parentDir)) {
      await fs.promises.mkdir(parentDir, { recursive: true });
    }

    const tempPath = `${targetPath}.${Date.now()}.${Math.random().toString(36).substring(2, 8)}.tmp`;
    const serialized = JSON.stringify(data, null, 2);

    // Atomic write: write to temp file then rename
    await fs.promises.writeFile(tempPath, serialized, 'utf-8');
    await fs.promises.rename(tempPath, targetPath);
  }

  async exists(key: string): Promise<boolean> {
    const filePath = this.resolvePath(key);
    return fs.existsSync(filePath);
  }

  async delete(key: string): Promise<boolean> {
    const filePath = this.resolvePath(key);
    try {
      if (fs.existsSync(filePath)) {
        await fs.promises.unlink(filePath);
        return true;
      }
      return false;
    } catch (err) {
      console.warn(`[JsonStorageDriver] Warning deleting ${key}:`, err);
      return false;
    }
  }

  async update<T>(key: string, updater: (current: T) => T | Promise<T>, defaultValue: T): Promise<T> {
    const current = await this.read<T>(key, defaultValue);
    const updated = await updater(current);
    await this.write<T>(key, updated);
    return updated;
  }

  /**
   * runTransaction:
   * NOTE ON TRANSACTION SEMANTICS:
   * In JsonStorageDriver, this executes sequentially within this single Node process.
   * It does NOT provide cross-process or multi-instance ACID distributed locking across
   * Cloud Run instances. This satisfies local single-instance development and tests
   * while fulfilling the transaction contract required by future durable drivers (Firestore / PostgreSQL).
   */
  async runTransaction<R>(operation: (tx: import('./storage.interface.js').StorageTransaction) => Promise<R>): Promise<R> {
    return await operation(this);
  }

  getDriverName(): string {
    return 'JSON Filesystem Driver (Development / Single-Instance Mode)';
  }
}
