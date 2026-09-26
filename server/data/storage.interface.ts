/**
 * IStorageDriver: Abstraction for physical persistence.
 *
 * CRITICAL ARCHITECTURE RULE:
 * Cloud Run local storage is ephemeral across container replacement.
 * This interface isolates the storage engine so a future transition to
 * PostgreSQL, Cloud SQL, SQLite, or Firestore can be made by swapping
 * the driver implementation, with zero changes to Admin UI or API endpoints.
 */

export interface StorageTransaction {
  read<T>(key: string, defaultValue: T): Promise<T>;
  write<T>(key: string, data: T): Promise<void>;
  delete(key: string): Promise<boolean>;
}

export interface IStorageDriver {
  /** Read a structured document by collection/domain key */
  read<T>(key: string, defaultValue: T): Promise<T>;

  /** Write a structured document atomically */
  write<T>(key: string, data: T): Promise<void>;

  /** Delete a structured document by collection/domain key */
  delete(key: string): Promise<boolean>;

  /**
   * Atomic read-modify-write helper.
   * Reads current document, applies updater function, and writes back atomically.
   */
  update<T>(key: string, updater: (current: T) => T | Promise<T>, defaultValue: T): Promise<T>;

  /** Check if a resource exists */
  exists(key: string): Promise<boolean>;

  /**
   * Transaction execution contract for durable drivers.
   * In local single-instance drivers, executes sequentially.
   */
  runTransaction?<R>(operation: (tx: StorageTransaction) => Promise<R>): Promise<R>;

  /** Informational identifier of current storage engine */
  getDriverName(): string;
}
