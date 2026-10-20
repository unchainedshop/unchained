import assert from 'node:assert';
import { generateKeyPairSync, sign } from 'node:crypto';
import { after, before, describe, it } from 'node:test';
import { contentDigest, signingKey, signRequest, verifyRequest } from './signature.ts';

describe('UCP message signatures', () => {
  const environment = {
    UCP_SIGNING_KEY: process.env.UCP_SIGNING_KEY,
    UCP_SIGNING_KEY_ID: process.env.UCP_SIGNING_KEY_ID,
  };
  const { privateKey } = generateKeyPairSync('ec', { namedCurve: 'P-256' });
  const url = 'https://platform.example/webhooks/orders?tenant=ch';
  const body = '{"id":"order-1"}';
  const headers = {
    'content-type': 'application/json',
    'ucp-agent': 'profile="https://shop.example/.well-known/ucp"',
    'webhook-id': '0b8c7a52-7fd4-8e5c-a3f1-4c1e1c0f6a11',
    'webhook-timestamp': '1760000000',
  };
  const message = (signed: Record<string, string>, payload = body) => ({
    method: 'POST',
    url: new URL(url),
    headers: new Headers(signed),
    body: Buffer.from(payload),
  });

  before(() => {
    process.env.UCP_SIGNING_KEY = privateKey.export({ format: 'pem', type: 'pkcs8' }).toString();
    delete process.env.UCP_SIGNING_KEY_ID;
  });
  after(() => {
    for (const [key, value] of Object.entries(environment)) {
      if (value === undefined) delete process.env[key];
      else process.env[key] = value;
    }
  });

  it('computes the RFC 9530 Content-Digest of the raw body', () => {
    assert.equal(
      contentDigest('{"hello": "world"}'),
      'sha-256=:X48E9qOokqqrvdts8nOJRJN3OWDUoyWxBf7kbu9DBPE=:',
    );
  });

  it('publishes the key as an ES256 JWK named by its RFC 7638 thumbprint', () => {
    const { jwk } = signingKey()!;
    assert.deepEqual(Object.keys(jwk), ['kid', 'kty', 'crv', 'x', 'y', 'use', 'alg']);
    assert.match(jwk.kid!, /^[\w-]{43}$/);
    process.env.UCP_SIGNING_KEY_ID = 'business-2026';
    assert.equal(signingKey()!.jwk.kid, 'business-2026');
    delete process.env.UCP_SIGNING_KEY_ID;
  });

  it('signs with raw r||s ES256 that a verifier accepts', () => {
    const signed = signRequest({ method: 'POST', url, headers, body });
    assert.match(
      signed['signature-input'],
      /^sig1=\("@method" "@authority" "@path" "@query" "ucp-agent" "content-digest" "content-type" "webhook-id" "webhook-timestamp"\);created=\d+;keyid="[\w-]+"$/,
    );
    assert.equal(Buffer.from(signed.signature.slice(6, -1), 'base64').length, 64);
    assert.equal(verifyRequest(message(signed), [signingKey()!.jwk]), true);
  });

  it('refuses DER signatures, tampered bodies, uncovered headers and unknown keys', () => {
    const key = signingKey()!;
    const signed = signRequest({ method: 'POST', url, headers, body });
    const der = sign('sha256', Buffer.from('anything'), { key: key.privateKey, dsaEncoding: 'der' });
    assert.equal(
      verifyRequest(message({ ...signed, signature: `sig1=:${der.toString('base64')}:` }), [key.jwk]),
      'signature_invalid',
    );
    assert.equal(verifyRequest(message(signed, '{"id":"order-2"}'), [key.jwk]), 'digest_mismatch');
    assert.equal(
      verifyRequest(message({ ...signed, 'idempotency-key': 'not-covered' }), [key.jwk]),
      'signature_invalid',
    );
    assert.equal(verifyRequest(message(signed), [{ ...key.jwk, kid: 'other' }]), 'key_not_found');
    assert.equal(
      verifyRequest(message(signed), [{ ...key.jwk, kty: 'OKP', crv: 'Ed25519' }]),
      'algorithm_unsupported',
    );
  });
});
