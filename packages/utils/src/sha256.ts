export default async function sha256(message) {
  const bytes = new TextEncoder().encode(message);
  const hashBuffer = await crypto.subtle.digest('SHA-256', bytes);
  return Buffer.from(hashBuffer).toString('hex');
}
