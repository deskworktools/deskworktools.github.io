/**
 * IMediaStorageDriver: Abstraction for physical media/asset persistence.
 *
 * ARCHITECTURAL BOUNDARY (Phase 5A):
 * Currently backed by LocalFilesystemMediaDriver (storing to public/uploads/blog).
 * Prepares the codebase for a future Google Cloud Storage (GCS) driver
 * without requiring changes to MediaRepository business logic, in-use post
 * tracking, or route handlers.
 */

export interface StoredMediaFile {
  id: string;
  filename: string;
  url: string;
  mimeType: string;
  sizeBytes: number;
  uploadedAt: string;
}

export interface IMediaStorageDriver {
  /** Save an uploaded media buffer */
  save(filename: string, buffer: Buffer, mimeType: string): Promise<StoredMediaFile>;

  /** Delete a media file by filename */
  delete(filename: string): Promise<boolean>;

  /** Check if a media file exists */
  exists(filename: string): Promise<boolean>;

  /** List stored user-uploaded media files */
  list(): Promise<StoredMediaFile[]>;

  /** List bundled read-only system assets (e.g. /images/) */
  listSystemAssets(): Promise<StoredMediaFile[]>;

  /** Informational identifier of current media storage engine */
  getDriverName(): string;
}
