export default async function sha1(message) {
  const bytes = new TextEncoder().encode(message);
  const hashBuffer = await crypto.subtle.digest('SHA-1', bytes);
  // Return Uint8Array instead of Buffer
  return new Uint8Array(hashBuffer);
}
