import crypto from 'node:crypto';

const SIGNATURE_SECRET =
  process.env.UNCHAINED_TOKEN_SECRET || process.env.SIGNATURE_SECRET || 'unchained';

export default async function sign(
  directoryName: string,
  fileName: string,
  expiryTimestamp: number,
): Promise<string> {
  const hmac = crypto.createHmac('sha256', SIGNATURE_SECRET);
  hmac.update(`${directoryName}:${fileName}:${expiryTimestamp}`);
  return hmac.digest('hex');
}

export async function verify(
  directoryName: string,
  fileName: string,
  expiryTimestamp: number,
  signature: string,
): Promise<boolean> {
  const expectedSignature = await sign(directoryName, fileName, expiryTimestamp);
  return signature === expectedSignature && Date.now() < expiryTimestamp;
}
