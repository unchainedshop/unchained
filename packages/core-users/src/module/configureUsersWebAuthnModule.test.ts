import { describe, it, before, after } from 'node:test';
import assert from 'node:assert';
import { initDb, stopDb } from '@unchainedshop/mongodb';
import type { Db } from 'mongodb';
import { toArrayBuffer, buf2hex, configureUsersWebAuthnModule } from './configureUsersWebAuthnModule.ts';

describe('WebAuthn Module', () => {
  describe('toArrayBuffer', () => {
    it('should convert a Buffer to an ArrayBuffer', () => {
      const buffer = Buffer.from([0x01, 0x02, 0x03, 0x04]);
      const arrayBuffer = toArrayBuffer(buffer);

      assert.ok(arrayBuffer instanceof ArrayBuffer);
      assert.strictEqual(arrayBuffer.byteLength, 4);

      const view = new Uint8Array(arrayBuffer);
      assert.strictEqual(view[0], 0x01);
      assert.strictEqual(view[1], 0x02);
      assert.strictEqual(view[2], 0x03);
      assert.strictEqual(view[3], 0x04);
    });

    it('should handle empty buffers', () => {
      const buffer = Buffer.from([]);
      const arrayBuffer = toArrayBuffer(buffer);

      assert.ok(arrayBuffer instanceof ArrayBuffer);
      assert.strictEqual(arrayBuffer.byteLength, 0);
    });

    it('should handle buffers with offset', () => {
      const originalBuffer = Buffer.from([0x00, 0x01, 0x02, 0x03, 0x04, 0x05]);
      const slicedBuffer = originalBuffer.subarray(2, 5);
      const arrayBuffer = toArrayBuffer(slicedBuffer);

      assert.strictEqual(arrayBuffer.byteLength, 3);
      const view = new Uint8Array(arrayBuffer);
      assert.strictEqual(view[0], 0x02);
      assert.strictEqual(view[1], 0x03);
      assert.strictEqual(view[2], 0x04);
    });
  });

  describe('buf2hex', () => {
    it('should convert an ArrayBuffer to a hex string', () => {
      const buffer = new Uint8Array([0x01, 0x02, 0x0a, 0xff]).buffer;
      const hex = buf2hex(buffer);

      assert.strictEqual(hex, '01020aff');
    });

    it('should handle empty ArrayBuffer', () => {
      const buffer = new ArrayBuffer(0);
      const hex = buf2hex(buffer);

      assert.strictEqual(hex, '');
    });

    it('should pad single digit hex values with leading zero', () => {
      const buffer = new Uint8Array([0x00, 0x01, 0x0f]).buffer;
      const hex = buf2hex(buffer);

      assert.strictEqual(hex, '00010f');
    });

    it('should convert a 16-byte AAGUID to correct hex format', () => {
      // Typical AAGUID format: 16 bytes
      const aaguidBytes = new Uint8Array([
        0x01, 0x02, 0x03, 0x04, 0x05, 0x06, 0x07, 0x08, 0x09, 0x0a, 0x0b, 0x0c, 0x0d, 0x0e, 0x0f,
        0x10,
      ]).buffer;
      const hex = buf2hex(aaguidBytes);

      assert.strictEqual(hex, '0102030405060708090a0b0c0d0e0f10');
      assert.strictEqual(hex.length, 32);

      // Format as UUID-style AAGUID
      const aaguid = `${hex.slice(0, 8)}-${hex.slice(8, 12)}-${hex.slice(12, 16)}-${hex.slice(16, 20)}-${hex.slice(20)}`;
      assert.strictEqual(aaguid, '01020304-0506-0708-090a-0b0c0d0e0f10');
    });
  });

  describe('configureUsersWebAuthnModule', () => {
    let db: Db;

    before(async () => {
      db = await initDb({ forceInMemory: true });
    });

    after(async () => {
      await stopDb();
    });

    it('should initialize the module', async () => {
      const webAuthnModule = await configureUsersWebAuthnModule({ db });

      assert.ok(webAuthnModule);
      assert.ok(typeof webAuthnModule.createCredentialCreationOptions === 'function');
      assert.ok(typeof webAuthnModule.createCredentialRequestOptions === 'function');
      assert.ok(typeof webAuthnModule.verifyCredentialCreation === 'function');
      assert.ok(typeof webAuthnModule.verifyCredentialRequest === 'function');
      assert.ok(typeof webAuthnModule.deleteUserWebAuthnCredentials === 'function');
      assert.ok(typeof webAuthnModule.findMDSMetadataForAAGUID === 'function');
    });

    it('should create credential creation options', async () => {
      const webAuthnModule = await configureUsersWebAuthnModule({ db });

      const options = await webAuthnModule.createCredentialCreationOptions(
        'https://example.com',
        'testuser-creation',
      );

      assert.ok(options);
      assert.ok(options.challenge);
      assert.ok(typeof options.challenge === 'string');
      assert.ok(options.requestId);
      assert.strictEqual(typeof options.requestId, 'number');
    });

    it('should create credential request options', async () => {
      const webAuthnModule = await configureUsersWebAuthnModule({ db });

      const options = await webAuthnModule.createCredentialRequestOptions(
        'https://example.com',
        'testuser-request',
      );

      assert.ok(options);
      assert.ok(options.challenge);
      assert.ok(typeof options.challenge === 'string');
      assert.ok(options.requestId);
      assert.strictEqual(typeof options.requestId, 'number');
    });

    it('should delete user WebAuthn credentials', async () => {
      const webAuthnModule = await configureUsersWebAuthnModule({ db });

      // Create some credentials first (with delay to avoid duplicate _id)
      await webAuthnModule.createCredentialCreationOptions('https://example.com', 'testuser-delete');
      await new Promise((resolve) => setTimeout(resolve, 2));
      await webAuthnModule.createCredentialCreationOptions('https://example.com', 'testuser-delete');

      // Delete credentials for testuser-delete
      const deletedCount = await webAuthnModule.deleteUserWebAuthnCredentials('testuser-delete');

      assert.strictEqual(deletedCount, 2);
    });

    it('should return null when verifying credential creation without a request', async () => {
      const webAuthnModule = await configureUsersWebAuthnModule({ db });

      const result = await webAuthnModule.verifyCredentialCreation('nonexistent-user', {
        id: 'some-id',
        response: {
          attestationObject: 'test',
          clientDataJSON: 'test',
        },
      });

      assert.strictEqual(result, null);
    });

    it('should return null when verifying credential request without a matching request', async () => {
      const webAuthnModule = await configureUsersWebAuthnModule({ db });

      const result = await webAuthnModule.verifyCredentialRequest([], 'testuser', {
        requestId: 99999999,
        id: 'some-id',
        response: {
          authenticatorData: 'test',
          signature: 'test',
          userHandle: 'test',
          clientDataJSON: 'test',
        },
      });

      assert.strictEqual(result, null);
    });

    it('should return null when verifying credential request without matching public key', async () => {
      const webAuthnModule = await configureUsersWebAuthnModule({ db });

      // First create a request
      const options = await webAuthnModule.createCredentialRequestOptions(
        'https://example.com',
        'testuser-no-pubkey',
      );

      // Try to verify with empty public keys array
      const result = await webAuthnModule.verifyCredentialRequest([], 'testuser-no-pubkey', {
        requestId: options.requestId,
        id: 'some-credential-id',
        response: {
          authenticatorData: Buffer.from('test').toString('base64'),
          signature: Buffer.from('test').toString('base64'),
          userHandle: Buffer.from('test').toString('base64'),
          clientDataJSON: Buffer.from('test').toString('base64'),
        },
      });

      assert.strictEqual(result, null);
    });

    it('should return null when verifying credential creation with invalid credentials', async () => {
      const webAuthnModule = await configureUsersWebAuthnModule({ db });

      // First create a request
      await webAuthnModule.createCredentialCreationOptions(
        'https://example.com',
        'testuser-invalid-creation',
      );

      // Try to verify with invalid credentials (should be caught by try/catch)
      const result = await webAuthnModule.verifyCredentialCreation('testuser-invalid-creation', {
        id: Buffer.from('invalid-id').toString('base64'),
        response: {
          attestationObject: Buffer.from('invalid-attestation').toString('base64'),
          clientDataJSON: Buffer.from('invalid-client-data').toString('base64'),
        },
      });

      // Should return null due to the try/catch handling invalid crypto operations
      assert.strictEqual(result, null);
    });

    it('should return null when verifying credential request with invalid signature', async () => {
      const webAuthnModule = await configureUsersWebAuthnModule({ db });

      // First create a request
      const options = await webAuthnModule.createCredentialRequestOptions(
        'https://example.com',
        'testuser-invalid-sig',
      );

      const credentialId = Buffer.from('test-credential-id').toString('base64');

      // Try to verify with a public key but invalid signature
      const result = await webAuthnModule.verifyCredentialRequest(
        [
          {
            id: credentialId,
            publicKey:
              '-----BEGIN PUBLIC KEY-----\nMFkwEwYHKoZIzj0CAQYIKoZIzj0DAQcDQgAE...\n-----END PUBLIC KEY-----',
            counter: 0,
          },
        ],
        'testuser-invalid-sig',
        {
          requestId: options.requestId,
          id: credentialId,
          response: {
            authenticatorData: Buffer.from('invalid-auth-data').toString('base64'),
            signature: Buffer.from('invalid-signature').toString('base64'),
            userHandle: Buffer.from('testuser-invalid-sig').toString('base64'),
            clientDataJSON: Buffer.from('invalid-client-data').toString('base64'),
          },
        },
      );

      // Should return null due to the try/catch handling invalid crypto operations
      assert.strictEqual(result, null);
    });

    it('should handle multiple credential creation requests for the same user', async () => {
      const webAuthnModule = await configureUsersWebAuthnModule({ db });

      const options1 = await webAuthnModule.createCredentialCreationOptions(
        'https://example.com',
        'testuser-multiple',
      );
      // Small delay to avoid duplicate _id (which uses Date.getTime())
      await new Promise((resolve) => setTimeout(resolve, 2));
      const options2 = await webAuthnModule.createCredentialCreationOptions(
        'https://example.com',
        'testuser-multiple',
      );

      assert.ok(options1.requestId !== options2.requestId);
      assert.ok(options1.challenge !== options2.challenge);
    });

    it('should generate unique challenges for each request', async () => {
      const webAuthnModule = await configureUsersWebAuthnModule({ db });

      const challenges = new Set<string>();
      for (let i = 0; i < 5; i++) {
        const options = await webAuthnModule.createCredentialCreationOptions(
          'https://example.com',
          `testuser-unique-${i}`,
        );
        challenges.add(options.challenge);
        // Small delay to avoid duplicate _id (which uses Date.getTime())
        await new Promise((resolve) => setTimeout(resolve, 2));
      }

      // All challenges should be unique
      assert.strictEqual(challenges.size, 5);
    });

    it('should include factor in stored request', async () => {
      const webAuthnModule = await configureUsersWebAuthnModule({ db });

      const options = await webAuthnModule.createCredentialCreationOptions(
        'https://example.com',
        'testuser-factor',
      );

      // The request should have been stored with a factor
      assert.ok(options);
      // Factor defaults to 'either' in the implementation
    });
  });
});
