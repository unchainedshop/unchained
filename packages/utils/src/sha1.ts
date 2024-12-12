export default async function sha1(message) {
  const bytes = new TextEncoder().encode(message);
  const hashBuffer = await crypto.subtle.digest('SHA-1', bytes);
  return Buffer.from(hashBuffer);
}
