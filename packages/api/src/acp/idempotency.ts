import { createHash } from 'node:crypto';
import { acpConfig } from './config.ts';
import { ACPError } from './error.ts';

interface StoredResponse {
  requestHash: string;
  status: number;
  body: unknown;
  contentType?: string;
  expiresAt: number;
}

const entries = new Map<string, StoredResponse | Promise<StoredResponse>>();
const TTL = 24 * 60 * 60 * 1000;

const canonicalize = (value: unknown): unknown => {
  if (Array.isArray(value)) return value.map(canonicalize);
  if (value && typeof value === 'object') {
    return Object.fromEntries(
      Object.entries(value as Record<string, unknown>)
        .sort(([left], [right]) => left.localeCompare(right))
        .map(([key, entry]) => [key, canonicalize(entry)]),
    );
  }
  return value;
};

const requestHash = (body: unknown) =>
  createHash('sha256')
    .update(JSON.stringify(canonicalize(body)))
    .digest('hex');

export const withIdempotency = async (
  scope: string,
  key: string,
  body: unknown,
  execute: () => Promise<{ status: number; body: unknown; contentType?: string }>,
) => {
  const cacheKey = `${scope}:${key}`;
  const hash = requestHash(body);
  const existing = entries.get(cacheKey);

  if (existing instanceof Promise) {
    throw new ACPError(
      409,
      'conflict_error',
      'idempotency_in_flight',
      'A request with this Idempotency-Key is still processing',
    );
  }

  if (existing && existing.expiresAt > Date.now()) {
    if (existing.requestHash !== hash) {
      throw new ACPError(
        acpConfig.idempotencyConflictStatus,
        'conflict_error',
        'idempotency_conflict',
        'The Idempotency-Key was already used with a different request body',
      );
    }
    return { ...existing, replayed: true };
  }

  const pending = execute().then((response) => ({
    ...response,
    requestHash: hash,
    expiresAt: Date.now() + TTL,
  }));
  entries.set(cacheKey, pending);

  try {
    const stored = await pending;
    if (stored.status < 500) entries.set(cacheKey, stored);
    else entries.delete(cacheKey);
    return { ...stored, replayed: false };
  } catch (error) {
    entries.delete(cacheKey);
    throw error;
  }
};
