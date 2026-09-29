// Pure helpers without imports: the admin plugin bundles this file for its scanner.

export interface TicketScanPayload {
  tokenId: string;
  accessKey?: string;
}

const TOKEN_ID = /^[\w-]+$/;
const URL_WITH_AUTHORITY = /^[a-z][a-z\d+.-]*:\/\//i;

/**
 * The canonical content of a ticket QR code: `${baseUrl}/${tokenId}?hash=${accessKey}`, with the
 * access key from `modules.warehousing.buildAccessKeyFromToken(token)`. Use it in every renderer
 * (PDF, Apple Wallet, Google Wallet) so one scanner reads them all.
 */
export function buildTicketScanPayload(
  { tokenId, accessKey }: { tokenId: string; accessKey: string },
  { baseUrl }: { baseUrl: string },
): string {
  return `${baseUrl.replace(/\/+$/, '')}/${encodeURIComponent(tokenId)}?hash=${encodeURIComponent(accessKey)}`;
}

const decode = (value: string) => {
  try {
    return decodeURIComponent(value);
  } catch {
    return value;
  }
};

/**
 * Reads the ticket id and the access key from a scanned or typed code. Understands the canonical
 * payload (`https://…/<tokenId>[.pkpass]?hash=…`), the legacy wallet payloads
 * `unchained-scanner://<tokenId>?hash=…` and `unchained://ticket/<tokenId>?hash=…`, and bare ids.
 * Returns null for anything else.
 */
export function parseTicketScanPayload(text: string): TicketScanPayload | null {
  const trimmed = text?.trim();
  if (!trimmed) return null;
  if (TOKEN_ID.test(trimmed)) return { tokenId: trimmed };
  if (!URL_WITH_AUTHORITY.test(trimmed)) return null;

  let url: URL;
  try {
    url = new URL(trimmed);
  } catch {
    return null;
  }

  const segments = url.pathname.split('/').filter(Boolean);
  const isWebUrl = url.protocol === 'http:' || url.protocol === 'https:';
  // unchained-scanner://<tokenId> carries the id as host; a web host is never a ticket id.
  const candidate = segments.length ? segments[segments.length - 1] : !isWebUrl ? url.host : '';
  const tokenId = decode(candidate).replace(/\.pkpass$/i, '');
  if (!TOKEN_ID.test(tokenId)) return null;

  const accessKey = url.searchParams.get('hash');
  return accessKey ? { tokenId, accessKey } : { tokenId };
}
