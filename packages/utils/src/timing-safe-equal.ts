/**
 * Timing-Safe String Comparison using Web Crypto API
 *
 * Ordinary string equality provides no constant-time guarantee. For equal-length
 * inputs, this helper delegates HMAC verification to the runtime's Web Crypto
 * implementation. It rejects unequal lengths before doing cryptographic work.
 */

/**
 * Compare two ArrayBuffers using Web Crypto HMAC verification.
 *
 * @param bufferA - First buffer to compare
 * @param bufferB - Second buffer to compare
 * @returns true if buffers are equal, false otherwise
 */
export async function timingSafeEqual(bufferA: ArrayBuffer, bufferB: ArrayBuffer): Promise<boolean> {
  // Unequal lengths return immediately; this helper does not hide input length.
  if (bufferA.byteLength !== bufferB.byteLength) {
    return false;
  }

  // Generate a random key for this comparison
  const algorithm = { name: 'HMAC', hash: 'SHA-256' };

  // @ts-expect-error - generateKey with HMAC returns CryptoKey, not CryptoKeyPair
  const key: CryptoKey = await crypto.subtle.generateKey(algorithm, false, ['sign', 'verify']);

  // Sign the first buffer
  const signature = await crypto.subtle.sign(algorithm, key, bufferA);

  // Verify the signature against the second buffer
  // Delegate signature comparison to the runtime's cryptographic implementation.
  return crypto.subtle.verify(algorithm, key, signature, bufferB);
}

/**
 * Compare UTF-8 encoded strings using HMAC verification; unequal byte lengths return early.
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
