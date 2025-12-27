/**
 * Helper utilities for @unchainedshop/store.
 */

/**
 * Generate a unique ID similar to MongoDB ObjectId.
 * Uses timestamp (8 hex chars) + random (16 hex chars) = 24 chars total.
 */
export function generateId(): string {
  const timestamp = Math.floor(Date.now() / 1000).toString(16);
  const randomPart = Array.from({ length: 16 }, () => Math.floor(Math.random() * 16).toString(16)).join(
    '',
  );
  return timestamp + randomPart;
}
