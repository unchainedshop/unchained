import {
  createHash,
  createPrivateKey,
  createPublicKey,
  sign,
  verify,
  type KeyObject,
} from 'node:crypto';
import { parseDictionary } from './protocol.ts';

export interface Jwk {
  kid?: string;
  kty?: string;
  crv?: string;
  x?: string;
  y?: string;
  use?: string;
  alg?: string;
}

export interface SignedMessage {
  method: string;
  url: URL;
  headers: Headers;
}

const COVERED_HEADERS = ['ucp-agent', 'idempotency-key', 'webhook-id', 'webhook-timestamp'];

export const contentDigest = (body: string | Uint8Array) =>
  `sha-256=:${createHash('sha256').update(body).digest('base64')}:`;

let currentKey: { source: string; privateKey: KeyObject; jwk: Jwk & { kid: string } } | undefined;

export function signingKey() {
  const pem = process.env.UCP_SIGNING_KEY?.replace(/\\n/g, '\n');
  if (!pem) return null;
  const source = `${pem}|${process.env.UCP_SIGNING_KEY_ID ?? ''}`;
  if (currentKey?.source !== source) {
    const privateKey = createPrivateKey(pem);
    const { kty, crv, x, y } = createPublicKey(privateKey).export({ format: 'jwk' });
    const kid =
      process.env.UCP_SIGNING_KEY_ID ||
      createHash('sha256').update(JSON.stringify({ crv, kty, x, y })).digest('base64url');
    currentKey = { source, privateKey, jwk: { kid, kty, crv, x, y, use: 'sig', alg: 'ES256' } };
  }
  return currentKey;
}

const componentValue = (component: string, { method, url, headers }: SignedMessage) => {
  if (component === '@method') return method.toUpperCase();
  if (component === '@authority') return url.host;
  if (component === '@path') return url.pathname;
  if (component === '@query') return url.search || '?';
  return headers.get(component)?.trim();
};

const serializeParams = (components: string[], params: [string, unknown][]) =>
  `(${components.map((component) => `"${component}"`).join(' ')})${params
    .map(([name, value]) => `;${name}=${typeof value === 'string' ? `"${value}"` : value}`)
    .join('')}`;

const signatureBase = (message: SignedMessage, components: string[], signatureParams: string) =>
  [
    ...components.map((component) => `"${component}": ${componentValue(component, message)}`),
    `"@signature-params": ${signatureParams}`,
  ].join('\n');

export function signRequest({
  method,
  url,
  headers,
  body,
}: {
  method: string;
  url: string;
  headers: Record<string, string>;
  body: string;
}) {
  const key = signingKey();
  if (!key) throw new Error('UCP_SIGNING_KEY is not set', { cause: 'UCP_SIGNING_KEY_MISSING' });
  const target = new URL(url);
  const signed = new Headers({ ...headers, 'content-digest': contentDigest(body) });
  const components = [
    '@method',
    '@authority',
    '@path',
    ...(target.search ? ['@query'] : []),
    ...['ucp-agent', 'content-digest', 'content-type', 'webhook-id', 'webhook-timestamp'].filter(
      (header) => signed.has(header),
    ),
  ];
  const params = serializeParams(components, [
    ['created', Math.floor(Date.now() / 1000)],
    ['keyid', key.jwk.kid],
  ]);
  const signature = sign(
    'sha256',
    Buffer.from(signatureBase({ method, url: target, headers: signed }, components, params)),
    { key: key.privateKey, dsaEncoding: 'ieee-p1363' },
  );
  return {
    ...Object.fromEntries(signed),
    'signature-input': `sig1=${params}`,
    signature: `sig1=:${signature.toString('base64')}:`,
  };
}

function verifyCandidate(
  message: SignedMessage & { body: Uint8Array },
  components: unknown,
  params: [string, unknown][],
  signature: unknown,
  keys: Jwk[],
) {
  const param = (name: string) => params.find(([key]) => key === name)?.[1];
  const key = keys.find(({ kid, use }) => kid === param('keyid') && use !== 'enc');
  if (!key) return 'key_not_found';
  if (key.kty !== 'EC' || key.crv !== 'P-256') return 'algorithm_unsupported';
  if (!Array.isArray(components) || !(signature instanceof Uint8Array)) return 'signature_invalid';

  const required = [
    '@method',
    '@authority',
    '@path',
    ...(message.url.search ? ['@query'] : []),
    ...(message.body.length ? ['content-digest', 'content-type'] : []),
    ...COVERED_HEADERS.filter((header) => message.headers.has(header)),
  ];
  const expires = param('expires');
  if (
    required.some((component) => !components.includes(component)) ||
    (typeof expires === 'number' && expires * 1000 < Date.now())
  ) {
    return 'signature_invalid';
  }
  if (components.includes('content-digest')) {
    const digest = parseDictionary(message.headers.get('content-digest') ?? '').get('sha-256')?.value;
    if (
      !(digest instanceof Uint8Array) ||
      !createHash('sha256').update(message.body).digest().equals(digest)
    ) {
      return 'digest_mismatch';
    }
  }
  const base = signatureBase(message, components, serializeParams(components, params));
  try {
    const publicKey = createPublicKey({ key, format: 'jwk' });
    return verify('sha256', Buffer.from(base), { key: publicKey, dsaEncoding: 'ieee-p1363' }, signature)
      ? null
      : 'signature_invalid';
  } catch {
    return 'signature_invalid';
  }
}

export function verifyRequest(
  message: SignedMessage & { body: Uint8Array },
  keys: Jwk[],
): true | string {
  const signatures = parseDictionary(message.headers.get('signature') ?? '');
  let failure = 'signature_invalid';
  for (const [label, { value, params }] of parseDictionary(
    message.headers.get('signature-input') ?? '',
  )) {
    const result = verifyCandidate(message, value, params, signatures.get(label)?.value, keys);
    if (!result) return true;
    failure = result;
  }
  return failure;
}
