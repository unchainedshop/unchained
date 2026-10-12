import { createPrivateKey } from 'node:crypto';
import { once } from 'node:events';
import { readFile } from 'node:fs/promises';
import { connect } from 'node:http2';
import { Readable } from 'node:stream';
import { text } from 'node:stream/consumers';
import { createLogger } from '@unchainedshop/logger';

const logger = createLogger('unchained:apple-wallet-webservice');

// Pass updates are only delivered by the production APNs.
export const APPLE_PUSH_NOTIFICATION_SERVICE = 'https://api.push.apple.com';

const PRIVATE_KEY_BLOCK = /-----BEGIN ([A-Z ]*)PRIVATE KEY-----[\s\S]+?-----END \1PRIVATE KEY-----/;

interface ApnsClient {
  post: (path: string, headers: Record<string, string>) => Promise<{ status: number; body: string }>;
  close: () => void;
}

declare const Deno:
  { createHttpClient: (options: { cert: string; key: string }) => { close: () => void } } | undefined;

// Deno's node:http2 ignores client certificates, its fetch takes them through createHttpClient.
const connectWithFetch = (origin: string, cert: string, key: string): ApnsClient => {
  const client = Deno!.createHttpClient({ cert, key });
  return {
    post: async (path, headers) => {
      const response = await fetch(new URL(path, origin), {
        method: 'POST',
        headers,
        body: '{}',
        client,
      } as RequestInit);
      return { status: response.status, body: await response.text() };
    },
    close: () => client.close(),
  };
};

const connectWithHttp2 = async (origin: string, cert: string, key: string): Promise<ApnsClient> => {
  const session = connect(origin, { cert, key });
  await once(session, 'connect');
  session.on('error', (error) => logger.error(error));
  return {
    post: async (path, headers) => {
      const stream = session.request({ ':method': 'POST', ':path': path, ...headers });
      stream.end('{}');
      const [responseHeaders] = await once(stream, 'response');
      return { status: Number(responseHeaders[':status']), body: await text(stream) };
    },
    close: () => session.close(),
  };
};

const isPushTokenInactive = async (
  client: ApnsClient,
  pushToken: string,
  passTypeIdentifier?: string,
) => {
  const { status, body } = await client.post(`/3/device/${pushToken}`, {
    'content-type': 'application/json',
    ...(passTypeIdentifier && { 'apns-topic': passTypeIdentifier }),
  });
  if (status === 200) return false;
  const reason: string | undefined = body ? JSON.parse(body).reason : undefined;
  if (status === 410 || (status === 400 && reason === 'BadDeviceToken')) return true;
  logger.warn(`APNs rejected a pass update: ${status} ${reason ?? ''}`, { pushToken });
  return false;
};

/** Resolves to the push tokens that APNs reports as no longer valid. */
export const pushToApplePushNotificationService = async (
  pushTokens: string[],
  passTypeIdentifier: string | undefined,
  origin = APPLE_PUSH_NOTIFICATION_SERVICE,
) => {
  if (!process.env.PASS_CERTIFICATE_PATH) {
    logger.warn('PASS_CERTIFICATE_PATH is not set, pass updates are not pushed');
    return [];
  }
  const pem = await readFile(process.env.PASS_CERTIFICATE_PATH, 'utf8');
  const key = createPrivateKey({
    key: pem.match(PRIVATE_KEY_BLOCK)?.[0] ?? pem,
    passphrase: process.env.PASS_CERTIFICATE_SECRET,
  }).export({ type: 'pkcs8', format: 'pem' }) as string;
  const client =
    typeof Deno === 'undefined'
      ? await connectWithHttp2(origin, pem, key)
      : connectWithFetch(origin, pem, key);
  try {
    const inactive = await Promise.all(
      pushTokens.map((pushToken) =>
        isPushTokenInactive(client, pushToken, passTypeIdentifier).catch((error) => {
          logger.error(error);
          return false;
        }),
      ),
    );
    return pushTokens.filter((_, index) => inactive[index]);
  } finally {
    client.close();
  }
};

export const buildPassBinary = async (
  tokenSerialNumber: string,
  pass: {
    serialNumber: string;
    asBuffer: () => Promise<Buffer>;
  },
) => {
  const passBuffer = await pass.asBuffer();
  const rawFile = {
    _id: pass.serialNumber,
    filename: `${tokenSerialNumber}-${new Date().getTime()}.pkpass`,
    createReadStream: () => Readable.from(passBuffer),
    mimetype: 'application/vnd.apple.pkpass',
  };
  return rawFile;
};
