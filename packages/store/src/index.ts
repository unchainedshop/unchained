/**
 * @unchainedshop/store
 *
 * Storage abstraction layer for Unchained Engine.
 * Supports multiple backends:
 * - Memory (for testing)
 * - Turso/libSQL (for server)
 * - TinyBase + CR-SQLite (for browser)
 */

export * from './types.js';
export * from './adapters/index.js';
