/**
 * Timing-Safe String Comparison using Web Crypto API
 *
 * Standard string comparison (===) is vulnerable to timing attacks because:
 * - It returns early on first character mismatch
 * - Attackers can measure response times to guess secrets character by character
 *
 * This implementation uses HMAC with a random key to ensure constant-time comparison:
 * - HMAC(key, a) vs verify(key, HMAC(key, a), b) always takes the same time
 * - The random key prevents precomputation attacks
 * - Works in all JavaScript runtimes (Node.js, browsers, Deno, Cloudflare Workers)
 *
 * @see https://www.arun.blog/timing-safe-auth-web-crypto/
 * @see https://codahale.com/a-lesson-in-timing-attacks/
 */

/**
 * Compare two ArrayBuffers in constant time using HMAC verification.
 *
 * @param bufferA - First buffer to compare
 * @param bufferB - Second buffer to compare
 * @returns true if buffers are equal, false otherwise
 */
export async function timingSafeEqual(bufferA: ArrayBuffer, bufferB: ArrayBuffer): Promise<boolean> {
  // Length check is safe - the length is public information
  // and doesn't reveal anything about the content
  if (bufferA.byteLength !== bufferB.byteLength) {
    return false;
  }

  // Generate a random key for this comparison
  // This prevents precomputation attacks
  const algorithm = { name: 'HMAC', hash: 'SHA-256' };

  // @ts-expect-error - generateKey with HMAC returns CryptoKey, not CryptoKeyPair
  const key: CryptoKey = await crypto.subtle.generateKey(algorithm, false, ['sign', 'verify']);

  // Sign the first buffer
  const signature = await crypto.subtle.sign(algorithm, key, bufferA);

  // Verify the signature against the second buffer
  // This comparison is constant-time in all Web Crypto implementations
  return crypto.subtle.verify(algorithm, key, signature, bufferB);
}

/**
 * Compare two strings in constant time.
 *
 * Use this for comparing:
 * - API tokens
 * - Webhook signatures
 * - Password hashes
 * - Session tokens
 * - Any secret that could be guessed via timing attacks
 *
 * @param a - First string to compare
 * @param b - Second string to compare
 * @returns true if strings are equal, false otherwise
 *
 * @example
 * ```typescript
 * // Comparing API tokens
 * if (await timingSafeStringEqual(providedToken, expectedToken)) {
 *   // Token is valid
 * }
 *
 * // Comparing password hashes
 * const computedHash = await hashPassword(password);
 * if (await timingSafeStringEqual(computedHash, storedHash)) {
 *   // Password is correct
 * }
 * ```
 */
export async function timingSafeStringEqual(a: string, b: string): Promise<boolean> {
  // Handle null/undefined inputs safely
  if (a === null || a === undefined || b === null || b === undefined) {
    return false;
  }

  const encoder = new TextEncoder();
  const bufferA = encoder.encode(a);
  const bufferB = encoder.encode(b);

  return timingSafeEqual(bufferA.buffer, bufferB.buffer);
}
