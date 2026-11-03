import { describe, it } from 'node:test';
import assert from 'node:assert';
import { createServer } from 'node:http';
import { fromBase64Url, sendNotification, toBase64Url } from './web-push.ts';

const encoder = new TextEncoder();
const ecdh = { name: 'ECDH', namedCurve: 'P-256' };

const hkdf = async (salt: Uint8Array, ikm: Uint8Array, info: string, bytes: number) => {
  const key = await crypto.subtle.importKey('raw', ikm, 'HKDF', false, ['deriveBits']);
  const bits = await crypto.subtle.deriveBits(
    { name: 'HKDF', hash: 'SHA-256', salt, info: encoder.encode(info) },
    key,
    bytes * 8,
  );
  return new Uint8Array(bits);
};

const decrypt = async (
  body: Uint8Array,
  userAgentKeys: { publicKey: CryptoKey; privateKey: CryptoKey },
  authSecret: Uint8Array,
) => {
  const salt = body.subarray(0, 16);
  const serverPublicKey = body.subarray(21, 21 + body[20]);
  const userAgentPublicKey = new Uint8Array(
    await crypto.subtle.exportKey('raw', userAgentKeys.publicKey),
  );
  const serverKey = await crypto.subtle.importKey('raw', serverPublicKey, ecdh, false, []);
  const sharedSecret = new Uint8Array(
    await crypto.subtle.deriveBits({ name: 'ECDH', public: serverKey }, userAgentKeys.privateKey, 256),
  );
  const keyInfo = new Uint8Array([
    ...encoder.encode('WebPush: info\0'),
    ...userAgentPublicKey,
    ...serverPublicKey,
  ]);
  const ikmKey = await crypto.subtle.importKey('raw', sharedSecret, 'HKDF', false, ['deriveBits']);
  const ikm = new Uint8Array(
    await crypto.subtle.deriveBits(
      { name: 'HKDF', hash: 'SHA-256', salt: authSecret, info: keyInfo },
      ikmKey,
      256,
    ),
  );
  const key = await crypto.subtle.importKey(
    'raw',
    await hkdf(salt, ikm, 'Content-Encoding: aes128gcm\0', 16),
    'AES-GCM',
    false,
    ['decrypt'],
  );
  const plaintext = new Uint8Array(
    await crypto.subtle.decrypt(
      { name: 'AES-GCM', iv: await hkdf(salt, ikm, 'Content-Encoding: nonce\0', 12) },
      key,
      body.subarray(21 + body[20]),
    ),
  );
  assert.strictEqual(plaintext.at(-1), 2);
  return new TextDecoder().decode(plaintext.subarray(0, -1));
};

const generateVapidKeys = async () => {
  const keys = await crypto.subtle.generateKey({ name: 'ECDSA', namedCurve: 'P-256' }, true, [
    'sign',
    'verify',
  ]);
  const { d } = await crypto.subtle.exportKey('jwk', keys.privateKey);
  const publicKey = new Uint8Array(await crypto.subtle.exportKey('raw', keys.publicKey));
  return { publicKey: toBase64Url(publicKey), privateKey: d!, verifyKey: keys.publicKey };
};

const receive = async (status: number) => {
  const requests: { url: string; headers: Record<string, any>; body: Uint8Array }[] = [];
  const server = createServer((req, res) => {
    const chunks: Buffer[] = [];
    req.on('data', (chunk) => chunks.push(chunk));
    req.on('end', () => {
      requests.push({
        url: req.url!,
        headers: req.headers,
        body: new Uint8Array(Buffer.concat(chunks)),
      });
      res.writeHead(status).end(status === 201 ? '' : 'gone');
    });
  });
  await new Promise<void>((resolve) => server.listen(0, resolve));
  const { port } = server.address() as { port: number };
  return { endpoint: `http://127.0.0.1:${port}/push/1`, requests, close: () => server.close() };
};

describe('web push', () => {
  it('sends a payload only the subscriber can decrypt, signed with the VAPID key', async (t) => {
    const push = await receive(201);
    t.after(push.close);
    const userAgentKeys = await crypto.subtle.generateKey(ecdh, true, ['deriveBits']);
    const authSecret = crypto.getRandomValues(new Uint8Array(16));
    const vapid = await generateVapidKeys();
    const payload = JSON.stringify({ title: 'Grüezi ✓', body: 'x'.repeat(3000) });

    await sendNotification(
      {
        endpoint: push.endpoint,
        keys: {
          p256dh: toBase64Url(
            new Uint8Array(await crypto.subtle.exportKey('raw', userAgentKeys.publicKey)),
          ),
          auth: toBase64Url(authSecret),
        },
      },
      payload,
      {
        vapidDetails: { subject: 'mailto:shop@example.com', ...vapid },
        TTL: 60,
        urgency: 'high',
        topic: 'orders',
      },
    );

    const [{ headers, body }] = push.requests;
    assert.strictEqual(await decrypt(body, userAgentKeys, authSecret), payload);
    assert.deepStrictEqual(
      [headers.ttl, headers.urgency, headers.topic, headers['content-encoding']],
      ['60', 'high', 'orders', 'aes128gcm'],
    );
    const [, token, publicKey] = headers.authorization.match(/^vapid t=([^,]+), k=(.+)$/);
    assert.strictEqual(publicKey, vapid.publicKey);
    const [header, claims, signature] = token.split('.');
    assert.ok(
      await crypto.subtle.verify(
        { name: 'ECDSA', hash: 'SHA-256' },
        vapid.verifyKey,
        fromBase64Url(signature),
        encoder.encode(`${header}.${claims}`),
      ),
    );
    const { aud, sub } = JSON.parse(new TextDecoder().decode(fromBase64Url(claims)));
    assert.deepStrictEqual([aud, sub], [new URL(push.endpoint).origin, 'mailto:shop@example.com']);
  });

  it('rejects when the push service refuses the message', async (t) => {
    const push = await receive(410);
    t.after(push.close);
    const vapid = await generateVapidKeys();
    const userAgentKeys = await crypto.subtle.generateKey(ecdh, true, ['deriveBits']);
    await assert.rejects(
      sendNotification(
        {
          endpoint: push.endpoint,
          keys: {
            p256dh: toBase64Url(
              new Uint8Array(await crypto.subtle.exportKey('raw', userAgentKeys.publicKey)),
            ),
            auth: toBase64Url(new Uint8Array(16)),
          },
        },
        'hi',
        { vapidDetails: { subject: 'mailto:shop@example.com', ...vapid }, TTL: 60 },
      ),
      /410: gone/,
    );
  });
});
