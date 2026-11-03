export interface PushSubscription {
  endpoint: string;
  keys: { p256dh: string; auth: string };
}

export interface VapidDetails {
  subject: string;
  publicKey: string;
  privateKey: string;
}

export interface WebPushOptions {
  vapidDetails: VapidDetails;
  TTL: number;
  urgency?: 'very-low' | 'low' | 'normal' | 'high';
  topic?: string;
}

const RECORD_SIZE = 4096;
const encoder = new TextEncoder();

export const toBase64Url = (bytes: Uint8Array) =>
  btoa(String.fromCharCode(...bytes))
    .replaceAll('+', '-')
    .replaceAll('/', '_')
    .replace(/=+$/, '');

export const fromBase64Url = (value: string) =>
  Uint8Array.from(atob(value.replaceAll('-', '+').replaceAll('_', '/')), (c) => c.charCodeAt(0));

const concat = (...parts: Uint8Array[]) => {
  const result = new Uint8Array(parts.reduce((length, part) => length + part.length, 0));
  let offset = 0;
  for (const part of parts) {
    result.set(part, offset);
    offset += part.length;
  }
  return result;
};

const hkdf = async (
  salt: Uint8Array<ArrayBuffer>,
  ikm: Uint8Array<ArrayBuffer>,
  info: Uint8Array<ArrayBuffer>,
  bytes: number,
) => {
  const key = await crypto.subtle.importKey('raw', ikm, 'HKDF', false, ['deriveBits']);
  const bits = await crypto.subtle.deriveBits(
    { name: 'HKDF', hash: 'SHA-256', salt, info },
    key,
    bytes * 8,
  );
  return new Uint8Array(bits);
};

const vapidAuthorization = async (
  endpoint: string,
  { subject, publicKey, privateKey }: VapidDetails,
) => {
  const publicKeyBytes = fromBase64Url(publicKey);
  const signingKey = await crypto.subtle.importKey(
    'jwk',
    {
      kty: 'EC',
      crv: 'P-256',
      d: privateKey,
      x: toBase64Url(publicKeyBytes.subarray(1, 33)),
      y: toBase64Url(publicKeyBytes.subarray(33, 65)),
    },
    { name: 'ECDSA', namedCurve: 'P-256' },
    false,
    ['sign'],
  );
  const encodeJson = (value: object) => toBase64Url(encoder.encode(JSON.stringify(value)));
  const unsignedToken = `${encodeJson({ typ: 'JWT', alg: 'ES256' })}.${encodeJson({
    aud: new URL(endpoint).origin,
    exp: Math.floor(Date.now() / 1000) + 12 * 60 * 60,
    sub: subject,
  })}`;
  const signature = await crypto.subtle.sign(
    { name: 'ECDSA', hash: 'SHA-256' },
    signingKey,
    encoder.encode(unsignedToken),
  );
  return `vapid t=${unsignedToken}.${toBase64Url(new Uint8Array(signature))}, k=${publicKey}`;
};

export const encryptPayload = async ({ keys }: PushSubscription, payload: string) => {
  const userAgentPublicKey = fromBase64Url(keys.p256dh);
  const authSecret = fromBase64Url(keys.auth);
  const ecdh = { name: 'ECDH', namedCurve: 'P-256' };
  const serverKeys = await crypto.subtle.generateKey(ecdh, true, ['deriveBits']);
  const serverPublicKey = new Uint8Array(await crypto.subtle.exportKey('raw', serverKeys.publicKey));
  const userAgentKey = await crypto.subtle.importKey('raw', userAgentPublicKey, ecdh, false, []);
  const sharedSecret = new Uint8Array(
    await crypto.subtle.deriveBits({ name: 'ECDH', public: userAgentKey }, serverKeys.privateKey, 256),
  );

  const keyInfo = concat(encoder.encode('WebPush: info\0'), userAgentPublicKey, serverPublicKey);
  const ikm = await hkdf(authSecret, sharedSecret, keyInfo, 32);
  const salt = crypto.getRandomValues(new Uint8Array(16));
  const contentEncryptionKey = await hkdf(
    salt,
    ikm,
    encoder.encode('Content-Encoding: aes128gcm\0'),
    16,
  );
  const nonce = await hkdf(salt, ikm, encoder.encode('Content-Encoding: nonce\0'), 12);

  const plaintext = concat(encoder.encode(payload), Uint8Array.of(2));
  if (plaintext.length + 16 > RECORD_SIZE) throw new Error('Push payload too large');
  const aesKey = await crypto.subtle.importKey('raw', contentEncryptionKey, 'AES-GCM', false, [
    'encrypt',
  ]);
  const ciphertext = new Uint8Array(
    await crypto.subtle.encrypt({ name: 'AES-GCM', iv: nonce }, aesKey, plaintext),
  );

  const header = new Uint8Array(21);
  header.set(salt);
  new DataView(header.buffer).setUint32(16, RECORD_SIZE);
  header[20] = serverPublicKey.length;
  return concat(header, serverPublicKey, ciphertext);
};

export const sendNotification = async (
  subscription: PushSubscription,
  payload: string,
  { vapidDetails, TTL, urgency, topic }: WebPushOptions,
) => {
  const response = await fetch(subscription.endpoint, {
    method: 'POST',
    headers: {
      TTL: String(TTL),
      'Content-Encoding': 'aes128gcm',
      'Content-Type': 'application/octet-stream',
      Authorization: await vapidAuthorization(subscription.endpoint, vapidDetails),
      ...(urgency && { Urgency: urgency }),
      ...(topic && { Topic: topic }),
    },
    body: await encryptPayload(subscription, payload),
  });
  if (!response.ok) {
    throw new Error(`Push service answered ${response.status}: ${await response.text()}`);
  }
  return response;
};
