import { describe, it, before } from 'node:test';
import assert from 'node:assert';
import * as jose from 'jose';

// Secure test secret (must be at least 32 characters)
const TEST_SECRET = 'test-secret-that-is-at-least-32-characters-long-for-security';

// Store auth module functions for use in tests
let signAccessToken: typeof import('./auth.ts').signAccessToken;
let verifyLocalToken: typeof import('./auth.ts').verifyLocalToken;
let generateFingerprint: typeof import('./auth.ts').generateFingerprint;
let verifyFingerprint: typeof import('./auth.ts').verifyFingerprint;
let createAuthHandler: typeof import('./auth.ts').createAuthHandler;

// Set environment variables and load module before all tests
before(async () => {
  // Set environment variables BEFORE importing the auth module
  process.env.UNCHAINED_TOKEN_SECRET = TEST_SECRET;
  process.env.UNCHAINED_TOKEN_EXPIRY_SECONDS = '3600';
  process.env.UNCHAINED_TOKEN_ISSUER = 'unchained-engine';

  // Dynamic import to ensure env vars are set first
  const auth = await import('./auth.ts');
  signAccessToken = auth.signAccessToken;
  verifyLocalToken = auth.verifyLocalToken;
  generateFingerprint = auth.generateFingerprint;
  verifyFingerprint = auth.verifyFingerprint;
  createAuthHandler = auth.createAuthHandler;
});

describe('generateFingerprint', () => {
  it('returns raw and hash values', () => {
    const { raw, hash } = generateFingerprint();

    assert.ok(raw, 'raw should be defined');
    assert.ok(hash, 'hash should be defined');
    assert.ok(raw.length >= 70, 'raw should be at least 70 characters');
    assert.strictEqual(hash.length, 64, 'hash should be 64 characters (SHA256 hex)');
  });

  it('generates unique values each call', () => {
    const fp1 = generateFingerprint();
    const fp2 = generateFingerprint();

    assert.notStrictEqual(fp1.raw, fp2.raw, 'raw values should be unique');
    assert.notStrictEqual(fp1.hash, fp2.hash, 'hash values should be unique');
  });
});

describe('verifyFingerprint', () => {
  it('validates matching fingerprints', () => {
    const { raw, hash } = generateFingerprint();
    const result = verifyFingerprint(raw, hash);
    assert.strictEqual(result, true);
  });

  it('rejects non-matching fingerprints', () => {
    const { raw } = generateFingerprint();
    const { hash } = generateFingerprint(); // Different hash
    const result = verifyFingerprint(raw, hash);
    assert.strictEqual(result, false);
  });

  it('rejects modified raw value', () => {
    const { raw, hash } = generateFingerprint();
    const modifiedRaw = 'x' + raw.slice(1);
    const result = verifyFingerprint(modifiedRaw, hash);
    assert.strictEqual(result, false);
  });
});

describe('signAccessToken', () => {
  it('generates valid JWT with correct claims', async () => {
    const userId = 'user-123';
    const tokenVersion = 1;

    const { token, expires } = await signAccessToken(userId, tokenVersion);

    assert.ok(token, 'token should be defined');
    assert.ok(expires instanceof Date, 'expires should be a Date');
    assert.ok(expires > new Date(), 'expires should be in the future');

    // Decode and verify claims
    const parts = token.split('.');
    assert.strictEqual(parts.length, 3, 'JWT should have 3 parts');

    const payload = JSON.parse(Buffer.from(parts[1], 'base64url').toString());
    assert.strictEqual(payload.sub, userId, 'sub claim should match userId');
    assert.strictEqual(payload.ver, tokenVersion, 'ver claim should match tokenVersion');
    assert.strictEqual(payload.iss, 'unchained-engine', 'iss claim should be unchained-engine');
    assert.ok(payload.iat, 'iat claim should be present');
    assert.ok(payload.exp, 'exp claim should be present');
    assert.ok(payload.jti, 'jti claim should be present');
  });

  it('includes fingerprint hash when provided', async () => {
    const { hash } = generateFingerprint();
    const { token } = await signAccessToken('user-123', 1, { fingerprintHash: hash });

    const parts = token.split('.');
    const payload = JSON.parse(Buffer.from(parts[1], 'base64url').toString());
    assert.strictEqual(payload.fgp, hash, 'fgp claim should match fingerprint hash');
  });

  it('includes impersonator ID when provided', async () => {
    const impersonatorId = 'admin-456';
    const { token } = await signAccessToken('user-123', 1, { impersonatorId });

    const parts = token.split('.');
    const payload = JSON.parse(Buffer.from(parts[1], 'base64url').toString());
    assert.strictEqual(payload.imp, impersonatorId, 'imp claim should match impersonator ID');
  });
});

describe('verifyLocalToken', () => {
  it('verifies valid tokens successfully', async () => {
    const userId = 'user-123';
    const tokenVersion = 5;
    const { token } = await signAccessToken(userId, tokenVersion);

    const result = await verifyLocalToken(token);

    assert.ok(result, 'result should not be null');
    assert.strictEqual(result.sub, userId);
    assert.strictEqual(result.ver, tokenVersion);
    assert.strictEqual(result.iss, 'unchained-engine');
  });

  it('returns null for expired tokens', async () => {
    // Create an already-expired token directly using jose
    const secret = new TextEncoder().encode(TEST_SECRET);
    const pastTime = Math.floor(Date.now() / 1000) - 3600; // 1 hour ago

    const token = await new jose.SignJWT({ sub: 'user-123', ver: 1 })
      .setProtectedHeader({ alg: 'HS256' })
      .setIssuedAt(pastTime)
      .setIssuer('unchained-engine')
      .setExpirationTime(pastTime + 1) // Expired 1 hour ago
      .sign(secret);

    const result = await verifyLocalToken(token);
    assert.strictEqual(result, null, 'expired token should return null');
  });

  it('returns null for invalid signature', async () => {
    const { token } = await signAccessToken('user-123', 1);

    // Tamper with the signature
    const parts = token.split('.');
    const tamperedToken = parts[0] + '.' + parts[1] + '.invalid-signature';

    const result = await verifyLocalToken(tamperedToken);
    assert.strictEqual(result, null, 'tampered token should return null');
  });

  it('returns null for malformed JWS (non-JWT token like API key)', async () => {
    // This is the key test case - simple strings like "admin-secret" should
    // return null without causing error logs (JWSInvalid exception)
    const result = await verifyLocalToken('admin-secret');
    assert.strictEqual(result, null, 'malformed JWS should return null');
  });

  it('returns null for wrong issuer', async () => {
    // Create a token with a different issuer
    const secret = new TextEncoder().encode(TEST_SECRET);
    const token = await new jose.SignJWT({ sub: 'user-123', ver: 1 })
      .setProtectedHeader({ alg: 'HS256' })
      .setIssuedAt()
      .setIssuer('wrong-issuer')
      .setExpirationTime('1h')
      .sign(secret);

    const result = await verifyLocalToken(token);
    assert.strictEqual(result, null, 'token with wrong issuer should return null');
  });

  it('preserves fingerprint and impersonator claims', async () => {
    const { hash } = generateFingerprint();
    const impersonatorId = 'admin-456';

    const { token } = await signAccessToken('user-123', 1, {
      fingerprintHash: hash,
      impersonatorId,
    });

    const result = await verifyLocalToken(token);

    assert.ok(result, 'result should not be null');
    assert.strictEqual(result.fgp, hash, 'fgp should be preserved');
    assert.strictEqual(result.imp, impersonatorId, 'imp should be preserved');
  });
});

describe('createAuthHandler', () => {
  it('returns empty object for empty token', async () => {
    const handler = createAuthHandler();
    const result = await handler('');

    assert.deepStrictEqual(result, {});
  });

  it('returns userId for valid JWT', async () => {
    const handler = createAuthHandler();
    const userId = 'user-123';
    const tokenVersion = 1;
    const { token } = await signAccessToken(userId, tokenVersion);

    const result = await handler(token);

    assert.strictEqual(result.userId, userId);
    assert.strictEqual(result.tokenVersion, tokenVersion);
    assert.strictEqual(result.isApiKey, undefined);
  });

  it('returns isApiKey:true for non-JWT tokens', async () => {
    const handler = createAuthHandler();
    const apiKey = 'admin-secret';

    const result = await handler(apiKey);

    assert.strictEqual(result.accessToken, apiKey);
    assert.strictEqual(result.isApiKey, true);
    assert.strictEqual(result.userId, undefined);
  });

  it('passes through fingerprint and impersonator', async () => {
    const handler = createAuthHandler();
    const { hash } = generateFingerprint();
    const impersonatorId = 'admin-456';

    const { token } = await signAccessToken('user-123', 1, {
      fingerprintHash: hash,
      impersonatorId,
    });

    const result = await handler(token);

    assert.strictEqual(result.fingerprintHash, hash);
    assert.strictEqual(result.impersonatorId, impersonatorId);
  });
});
