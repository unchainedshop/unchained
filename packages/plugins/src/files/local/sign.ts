import crypto from 'node:crypto';
import { timingSafeStringEqual } from '@unchainedshop/utils';

// Require explicit configuration - no weak defaults
const rawSecret = process.env.SIGNATURE_SECRET || process.env.UNCHAINED_TOKEN_SECRET;

// Validate secret at module load time
if (!rawSecret || rawSecret.length < 32) {
  throw new Error(
    'SIGNATURE_SECRET or UNCHAINED_TOKEN_SECRET must be set with at least 32 characters for file signing',
  );
}

// After validation, we know the secret is defined and valid
const SIGNATURE_SECRET: string = rawSecret;

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
  // Use timing-safe comparison to prevent timing attacks
  const isValid = await timingSafeStringEqual(signature, expectedSignature);
  return isValid && Date.now() < expiryTimestamp;
}
