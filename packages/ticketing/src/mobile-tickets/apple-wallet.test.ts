import { after, before, test } from 'node:test';
import assert from 'node:assert/strict';
import { execFileSync } from 'node:child_process';
import { mkdtemp, readFile, rm, writeFile } from 'node:fs/promises';
import { createSecureServer, type Http2SecureServer } from 'node:http2';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { text } from 'node:stream/consumers';
import type { TLSSocket } from 'node:tls';
import { pushToApplePushNotificationService } from './apple-wallet.ts';

const PASS_TYPE = 'pass.shop.unchained.ticket';

const answers: Record<string, [number, string?]> = {
  delivered: [200],
  unregistered: [410, 'Unregistered'],
  malformed: [400, 'BadDeviceToken'],
  throttled: [429, 'TooManyRequests'],
};

const previousEnv = {
  PASS_CERTIFICATE_PATH: process.env.PASS_CERTIFICATE_PATH,
  PASS_CERTIFICATE_SECRET: process.env.PASS_CERTIFICATE_SECRET,
  NODE_TLS_REJECT_UNAUTHORIZED: process.env.NODE_TLS_REJECT_UNAUTHORIZED,
};
const requests: { headers: Record<string, unknown>; body: string; clientName?: string }[] = [];
let dir: string;
let server: Http2SecureServer;
let origin: string;

const selfSigned = (name: string, ...keyOptions: string[]) => {
  execFileSync(
    'openssl',
    ['req', '-x509', '-newkey', 'rsa:2048', '-days', '1', '-subj', `/CN=${name}`].concat(
      ['-keyout', `${name}.key`, '-out', `${name}.crt`],
      keyOptions,
    ),
    { cwd: dir, stdio: 'ignore' },
  );
  return Promise.all([readFile(join(dir, `${name}.crt`)), readFile(join(dir, `${name}.key`))]);
};

before(async () => {
  dir = await mkdtemp(join(tmpdir(), 'apns-'));
  const [serverCert, serverKey] = await selfSigned('localhost', '-noenc');
  const [passCert, passKey] = await selfSigned(PASS_TYPE, '-passout', 'pass:secret');
  process.env.PASS_CERTIFICATE_PATH = join(dir, 'pass.pem');
  process.env.PASS_CERTIFICATE_SECRET = 'secret';
  await writeFile(process.env.PASS_CERTIFICATE_PATH, Buffer.concat([passCert, passKey]));

  server = createSecureServer({
    cert: serverCert,
    key: serverKey,
    requestCert: true,
    rejectUnauthorized: false,
  });
  server.on('stream', async (stream, headers) => {
    const socket = stream.session!.socket as TLSSocket;
    requests.push({
      headers,
      body: await text(stream),
      clientName: socket.getPeerCertificate().subject?.CN,
    });
    const [status, reason] = answers[String(headers[':path']).split('/').at(-1)!];
    stream.respond({ ':status': status });
    stream.end(reason ? JSON.stringify({ reason }) : undefined);
  });
  server.listen(0);
  await new Promise((resolve) => server.once('listening', resolve));
  origin = `https://localhost:${(server.address() as { port: number }).port}`;
  process.env.NODE_TLS_REJECT_UNAUTHORIZED = '0';
});

after(async () => {
  server?.close();
  for (const [key, value] of Object.entries(previousEnv)) {
    if (value === undefined) delete process.env[key];
    else process.env[key] = value;
  }
  await rm(dir, { recursive: true, force: true });
});

test('pushes an empty update per device with the pass certificate and returns the inactive push tokens', async () => {
  const inactive = await pushToApplePushNotificationService(Object.keys(answers), PASS_TYPE, origin);

  assert.deepEqual(inactive, ['unregistered', 'malformed']);
  assert.deepEqual(
    requests
      .map(({ headers, body, clientName }) => ({
        method: headers[':method'],
        path: headers[':path'],
        topic: headers['apns-topic'],
        body,
        clientName,
      }))
      .sort((a, b) => a.path!.toString().localeCompare(b.path!.toString())),
    ['delivered', 'malformed', 'throttled', 'unregistered'].map((pushToken) => ({
      method: 'POST',
      path: `/3/device/${pushToken}`,
      topic: PASS_TYPE,
      body: '{}',
      clientName: PASS_TYPE,
    })),
  );
});

test('skips pushing without a pass certificate', async () => {
  const certificatePath = process.env.PASS_CERTIFICATE_PATH;
  delete process.env.PASS_CERTIFICATE_PATH;
  try {
    assert.deepEqual(await pushToApplePushNotificationService(['delivered'], PASS_TYPE, origin), []);
  } finally {
    process.env.PASS_CERTIFICATE_PATH = certificatePath;
  }
});
