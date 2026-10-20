import { createHash, createPublicKey, generateKeyPairSync, sign, verify } from 'node:crypto';

export const digestOf = (body) => `sha-256=:${createHash('sha256').update(body).digest('base64')}:`;

export function createSigner(kid = 'platform-test-key') {
  const { privateKey, publicKey } = generateKeyPairSync('ec', { namedCurve: 'P-256' });
  return { privateKey, jwk: { ...publicKey.export({ format: 'jwk' }), kid, use: 'sig', alg: 'ES256' } };
}

function signatureBase(components, { method, url, headers }, signatureParams) {
  const target = new URL(url);
  const derived = {
    '@method': method,
    '@authority': target.host,
    '@path': target.pathname,
    '@query': target.search || '?',
  };
  return [
    ...components.map((component) => `"${component}": ${derived[component] ?? headers[component]}`),
    `"@signature-params": ${signatureParams}`,
  ].join('\n');
}

export function signRequest(
  signer,
  { method, url, headers = {}, body },
  { components, kid = signer.jwk.kid, dsaEncoding = 'ieee-p1363', digest } = {},
) {
  const signed = Object.fromEntries(
    Object.entries(headers).map(([name, value]) => [name.toLowerCase(), value]),
  );
  if (body !== undefined) signed['content-digest'] = digest ?? digestOf(body);
  const covered = components ?? [
    '@method',
    '@authority',
    '@path',
    ...['ucp-agent', 'idempotency-key', 'content-digest', 'content-type'].filter(
      (name) => name in signed,
    ),
  ];
  const signatureParams = `(${covered.map((component) => `"${component}"`).join(' ')});created=${Math.floor(
    Date.now() / 1000,
  )};keyid="${kid}"`;
  const signature = sign(
    'sha256',
    Buffer.from(signatureBase(covered, { method, url, headers: signed }, signatureParams)),
    { key: signer.privateKey, dsaEncoding },
  );
  return {
    ...signed,
    'signature-input': `sig1=${signatureParams}`,
    signature: `sig1=:${signature.toString('base64')}:`,
  };
}

export function verifyWebhook({ method, url, headers, body }, keys) {
  const [, list, params] = /^sig1=\(([^)]*)\)(.*)$/.exec(headers['signature-input']) ?? [];
  const [, kid] = /;keyid="([^"]+)"/.exec(params ?? '') ?? [];
  const key = keys.find((candidate) => candidate.kid === kid);
  if (!key || headers['content-digest'] !== digestOf(body)) return null;
  const components = list.split(' ').map((component) => component.slice(1, -1));
  const [, signature] = /^sig1=:([^:]+):$/.exec(headers.signature) ?? [];
  const valid = verify(
    'sha256',
    Buffer.from(signatureBase(components, { method, url, headers }, `(${list})${params}`)),
    { key: createPublicKey({ key, format: 'jwk' }), dsaEncoding: 'ieee-p1363' },
    Buffer.from(signature, 'base64'),
  );
  return valid ? components : null;
}
