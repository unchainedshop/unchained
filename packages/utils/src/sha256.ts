export default async function sha256(message) {
  const bytes = new TextEncoder().encode(message);
  const hashBuffer = await crypto.subtle.digest('SHA-256', bytes);
  // Convert ArrayBuffer to hex string without using Buffer
  return Array.from(new Uint8Array(hashBuffer))
    .map((b) => b.toString(16).padStart(2, '0'))
    .join('');
}
