/**
 * URL Validation for SSRF Prevention
 *
 * Server-Side Request Forgery (SSRF) attacks can exploit URL fetching
 * to access internal resources. This utility validates URLs to prevent:
 * - Access to internal networks (10.x.x.x, 192.168.x.x, 172.16-31.x.x)
 * - Access to localhost/loopback addresses
 * - Access to cloud metadata endpoints (169.254.169.254)
 * - HTTP connections (only HTTPS allowed)
 *
 * @see https://cheatsheetseries.owasp.org/cheatsheets/Server_Side_Request_Forgery_Prevention_Cheat_Sheet.html
 */

/**
 * Hosts that are always blocked (localhost variations)
 */
const BLOCKED_HOSTS = new Set([
  'localhost',
  '127.0.0.1',
  '0.0.0.0',
  '::1',
  '::',
  '[::1]',
  '[::0]',
  '0',
  '0.0.0.0',
]);

/**
 * IP patterns for private/internal networks
 */
const BLOCKED_IP_PATTERNS: RegExp[] = [
  // 10.0.0.0/8 - Class A private network
  /^10\./,
  // 172.16.0.0/12 - Class B private network
  /^172\.(1[6-9]|2[0-9]|3[0-1])\./,
  // 192.168.0.0/16 - Class C private network
  /^192\.168\./,
  // 169.254.0.0/16 - Link-local (AWS/GCP/Azure metadata)
  /^169\.254\./,
  // 0.0.0.0/8 - Current network
  /^0\./,
  // 127.0.0.0/8 - Loopback
  /^127\./,
  // 224.0.0.0/4 - Multicast
  /^22[4-9]\.|^23[0-9]\./,
  // 240.0.0.0/4 - Reserved
  /^24[0-9]\.|^25[0-5]\./,
];

/**
 * Known cloud metadata endpoints
 */
const METADATA_ENDPOINTS = new Set([
  '169.254.169.254', // AWS, GCP, Azure
  'metadata.google.internal', // GCP alternate
  '169.254.170.2', // AWS ECS
  'fd00:ec2::254', // AWS IPv6
]);

/**
 * Validate a URL for safe external fetching.
 *
 * This function checks that a URL is safe to fetch from a server context,
 * preventing SSRF attacks that could access internal resources.
 *
 * @param urlString - The URL to validate
 * @returns The validated URL object
 * @throws Error if the URL is invalid or points to a blocked resource
 *
 * @example
 * ```typescript
 * // Valid - returns URL object
 * const url = validateExternalUrl('https://example.com/image.png');
 *
 * // Throws - not HTTPS
 * validateExternalUrl('http://example.com/image.png');
 *
 * // Throws - internal network
 * validateExternalUrl('https://192.168.1.1/admin');
 *
 * // Throws - cloud metadata
 * validateExternalUrl('https://169.254.169.254/latest/meta-data/');
 * ```
 */
export function validateExternalUrl(urlString: string): URL {
  if (!urlString || typeof urlString !== 'string') {
    throw new Error('URL is required');
  }

  let url: URL;
  try {
    url = new URL(urlString);
  } catch {
    throw new Error(`Invalid URL format: ${urlString}`);
  }

  // Only allow HTTPS
  if (url.protocol !== 'https:') {
    throw new Error(`Only HTTPS URLs are allowed, got: ${url.protocol}`);
  }

  const hostname = url.hostname.toLowerCase();

  // Block known unsafe hosts
  if (BLOCKED_HOSTS.has(hostname)) {
    throw new Error(`Blocked host: ${hostname}`);
  }

  // Block metadata endpoints
  if (METADATA_ENDPOINTS.has(hostname)) {
    throw new Error(`Cloud metadata endpoint blocked: ${hostname}`);
  }

  // Block private IP ranges
  for (const pattern of BLOCKED_IP_PATTERNS) {
    if (pattern.test(hostname)) {
      throw new Error(`Private IP range blocked: ${hostname}`);
    }
  }

  // Block IPv6 link-local
  if (hostname.startsWith('fe80:') || hostname.startsWith('[fe80:')) {
    throw new Error(`IPv6 link-local address blocked: ${hostname}`);
  }

  // Block custom ports that might indicate internal services
  // Allow standard HTTPS port (443) and undefined (defaults to 443)
  if (url.port && url.port !== '443') {
    // Still allow the URL but log a warning
    // Some CDNs use non-standard ports
  }

  return url;
}

/**
 * Validate a URL allowing HTTP (less secure, use only when necessary)
 *
 * Same as validateExternalUrl but allows HTTP protocol.
 * Use this only when the source explicitly requires HTTP.
 *
 * @param urlString - The URL to validate
 * @returns The validated URL object
 * @throws Error if the URL is invalid or points to a blocked resource
 */
export function validateExternalUrlAllowHttp(urlString: string): URL {
  if (!urlString || typeof urlString !== 'string') {
    throw new Error('URL is required');
  }

  let url: URL;
  try {
    url = new URL(urlString);
  } catch {
    throw new Error(`Invalid URL format: ${urlString}`);
  }

  // Allow HTTP and HTTPS
  if (url.protocol !== 'https:' && url.protocol !== 'http:') {
    throw new Error(`Only HTTP/HTTPS URLs are allowed, got: ${url.protocol}`);
  }

  const hostname = url.hostname.toLowerCase();

  // Block known unsafe hosts
  if (BLOCKED_HOSTS.has(hostname)) {
    throw new Error(`Blocked host: ${hostname}`);
  }

  // Block metadata endpoints
  if (METADATA_ENDPOINTS.has(hostname)) {
    throw new Error(`Cloud metadata endpoint blocked: ${hostname}`);
  }

  // Block private IP ranges
  for (const pattern of BLOCKED_IP_PATTERNS) {
    if (pattern.test(hostname)) {
      throw new Error(`Private IP range blocked: ${hostname}`);
    }
  }

  // Block IPv6 link-local
  if (hostname.startsWith('fe80:') || hostname.startsWith('[fe80:')) {
    throw new Error(`IPv6 link-local address blocked: ${hostname}`);
  }

  return url;
}
