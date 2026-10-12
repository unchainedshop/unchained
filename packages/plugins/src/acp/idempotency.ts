import { createHash } from 'node:crypto';
import { ACPError } from './error.ts';

export interface ACPRouteResult {
  status: number;
  body: unknown;
  contentType?: string;
  headers?: Record<string, string>;
}

interface StoredResponse extends ACPRouteResult {
  requestHash: string;
  expiresAt: number;
  storedAt: number;
}

interface PendingResponse {
  requestHash: string;
  promise: Promise<StoredResponse>;
}

const entries = new Map<string, StoredResponse | PendingResponse>();
const TTL = 24 * 60 * 60 * 1000;
const MAX_ENTRIES = 10_000;

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

const hash = (value: unknown) =>
  createHash('sha256')
    .update(JSON.stringify(canonicalize(value)))
    .digest('hex');

const prune = (now: number) => {
  for (const [key, entry] of entries) {
    if ('expiresAt' in entry && entry.expiresAt <= now) entries.delete(key);
  }
  if (entries.size < MAX_ENTRIES) return;

  const completed = [...entries.entries()]
    .filter((entry): entry is [string, StoredResponse] => 'storedAt' in entry[1])
    .sort((left, right) => left[1].storedAt - right[1].storedAt);
  for (const [key] of completed) {
    entries.delete(key);
    if (entries.size < MAX_ENTRIES) return;
  }
};

export const createIdempotencyScope = ({
  authorization,
  operation,
  resourceId,
}: {
  authorization?: string | null;
  operation: string;
  resourceId?: string;
}) => hash({ authorization: authorization || '', operation, resourceId: resourceId || '' });

export const withIdempotency = async (
  scope: string,
  key: string,
  body: unknown,
  execute: () => Promise<ACPRouteResult>,
) => {
  const now = Date.now();
  prune(now);
  const cacheKey = hash({ scope, key });
  const requestHash = hash(body);
  const existing = entries.get(cacheKey);

  if (existing) {
    if (existing.requestHash !== requestHash) {
      throw new ACPError(
        422,
        'invalid_request',
        'idempotency_conflict',
        'The Idempotency-Key was already used with a different request body',
      );
    }
    if ('promise' in existing) {
      throw new ACPError(
        409,
        'invalid_request',
        'idempotency_in_flight',
        'A request with this Idempotency-Key is still processing',
        { headers: { 'Retry-After': '1' } },
      );
    }
    return { ...existing, replayed: true };
  }

  if (entries.size >= MAX_ENTRIES) {
    throw new ACPError(
      503,
      'service_unavailable',
      'idempotency_store_capacity',
      'The idempotency store is temporarily at capacity',
      { headers: { 'Retry-After': '1' } },
    );
  }

  const pending = execute().then((response) => ({
    ...response,
    requestHash,
    expiresAt: Date.now() + TTL,
    storedAt: Date.now(),
  }));
  entries.set(cacheKey, { requestHash, promise: pending });

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
