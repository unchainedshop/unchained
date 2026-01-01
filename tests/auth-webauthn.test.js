import { setupDatabase, disconnect } from './helpers.js';
import { ADMIN_TOKEN, USER_TOKEN } from './seeds/users.js';
import assert from 'node:assert';
import test from 'node:test';
import crypto from 'node:crypto';

/**
 * Virtual WebAuthn Authenticator for testing
 * Generates valid WebAuthn credentials using Node.js crypto
 */
class VirtualAuthenticator {
  constructor() {
    this.counter = 0;
    this.aaguid = '00000000-0000-0000-0000-000000000000'; // Test authenticator
  }

  /**
   * Generate a new ES256 key pair
   */
  generateKeyPair() {
    const { publicKey, privateKey } = crypto.generateKeyPairSync('ec', {
      namedCurve: 'P-256',
    });
    return { publicKey, privateKey };
  }

  /**
   * Export public key in SPKI format as base64url
   */
  exportPublicKey(publicKey) {
    const spkiBuffer = publicKey.export({ type: 'spki', format: 'der' });
    return this.toBase64url(spkiBuffer);
  }

  /**
   * Convert buffer to base64url string
   */
  toBase64url(buffer) {
    return Buffer.from(buffer)
      .toString('base64')
      .replace(/\+/g, '-')
      .replace(/\//g, '_')
      .replace(/=/g, '');
  }

  /**
   * Convert string to base64url
   */
  stringToBase64url(str) {
    return this.toBase64url(Buffer.from(str, 'utf-8'));
  }

  /**
   * Generate credential ID
   */
  generateCredentialId() {
    return this.toBase64url(crypto.randomBytes(32));
  }

  /**
   * Create clientDataJSON for registration
   */
  createClientDataJSON(type, challenge, origin) {
    const clientData = {
      type,
      challenge,
      origin,
      crossOrigin: false,
    };
    return this.stringToBase64url(JSON.stringify(clientData));
  }

  /**
   * Create authenticatorData buffer
   * @param rpId - Relying party ID (domain)
   * @param flags - Authenticator flags byte
   * @param credentialId - Credential ID (for registration)
   * @param publicKeyDer - Public key in DER format (for registration)
   */
  createAuthenticatorData(rpId, flags, credentialId = null, publicKeyDer = null) {
    // rpIdHash (32 bytes)
    const rpIdHash = crypto.createHash('sha256').update(rpId).digest();

    // flags (1 byte)
    const flagsByte = Buffer.from([flags]);

    // signCount (4 bytes, big-endian)
    this.counter++;
    const signCount = Buffer.alloc(4);
    signCount.writeUInt32BE(this.counter, 0);

    // Basic authenticator data (37 bytes minimum)
    let authData = Buffer.concat([rpIdHash, flagsByte, signCount]);

    // If attestedCredentialData is included (flag bit 6 set)
    if (flags & 0x40 && credentialId && publicKeyDer) {
      // AAGUID (16 bytes)
      const aaguidHex = this.aaguid.replace(/-/g, '');
      const aaguidBuffer = Buffer.from(aaguidHex, 'hex');

      // credentialIdLength (2 bytes, big-endian)
      const credIdBuffer = Buffer.from(credentialId, 'base64url');
      const credIdLength = Buffer.alloc(2);
      credIdLength.writeUInt16BE(credIdBuffer.length, 0);

      // credentialPublicKey in COSE format
      const coseKey = this.publicKeyToCOSE(publicKeyDer);

      authData = Buffer.concat([authData, aaguidBuffer, credIdLength, credIdBuffer, coseKey]);
    }

    return this.toBase64url(authData);
  }

  /**
   * Convert SPKI public key to COSE format for ES256
   */
  publicKeyToCOSE(publicKeyDer) {
    // For ES256, we need to extract the x and y coordinates from the SPKI public key
    // SPKI for P-256 is: SEQUENCE { SEQUENCE { OID, OID }, BIT STRING { 0x04 || x || y } }
    // The actual public key point starts at offset 26 for P-256 SPKI keys

    const spkiBuffer = Buffer.from(publicKeyDer, 'base64url');

    // Find the uncompressed point (0x04 prefix followed by 64 bytes of x||y)
    let offset = 0;
    for (let i = 0; i < spkiBuffer.length - 65; i++) {
      if (spkiBuffer[i] === 0x04) {
        offset = i;
        break;
      }
    }

    const x = spkiBuffer.slice(offset + 1, offset + 33);
    const y = spkiBuffer.slice(offset + 33, offset + 65);

    // COSE Key format for ES256:
    // {
    //   1: 2,      // kty: EC2
    //   3: -7,     // alg: ES256
    //   -1: 1,     // crv: P-256
    //   -2: x,     // x coordinate
    //   -3: y      // y coordinate
    // }
    // Encoded as CBOR

    // Simple CBOR encoding for this specific structure
    const cborMap = Buffer.from([
      0xa5, // map of 5 items
      0x01,
      0x02, // 1: 2 (kty: EC2)
      0x03,
      0x26, // 3: -7 (alg: ES256, -7 = 0x26 in CBOR negative int)
      0x20,
      0x01, // -1: 1 (crv: P-256)
      0x21,
      0x58,
      0x20, // -2: bytes(32)
      ...x,
      0x22,
      0x58,
      0x20, // -3: bytes(32)
      ...y,
    ]);

    return cborMap;
  }

  /**
   * Sign data with private key (ES256)
   */
  sign(privateKey, data) {
    const sign = crypto.createSign('SHA256');
    sign.update(data);
    const derSignature = sign.sign(privateKey);

    // Convert DER signature to raw r||s format for WebAuthn
    // Then convert back to ASN.1 as that's what the library expects
    return this.toBase64url(derSignature);
  }

  /**
   * Create a registration response (for addWebAuthnCredentials)
   */
  createRegistrationResponse(challenge, origin, rpId, username) {
    const { publicKey, privateKey } = this.generateKeyPair();
    const credentialId = this.generateCredentialId();
    const publicKeyBase64 = this.exportPublicKey(publicKey);

    // Flags: UP (0x01) + UV (0x04) + AT (0x40) = 0x45
    const flags = 0x45;

    const clientDataJSON = this.createClientDataJSON('webauthn.create', challenge, origin);
    const authenticatorData = this.createAuthenticatorData(rpId, flags, credentialId, publicKeyBase64);

    // Create attestation object (none attestation)
    const attestationObject = this.createAttestationObject(authenticatorData);

    return {
      registration: {
        id: credentialId,
        rawId: credentialId,
        response: {
          clientDataJSON,
          attestationObject,
          authenticatorData,
          publicKey: publicKeyBase64,
          publicKeyAlgorithm: -7, // ES256
          transports: ['internal'],
        },
        authenticatorAttachment: 'platform',
        clientExtensionResults: {},
        type: 'public-key',
        user: {
          id: username,
          name: username,
          displayName: username,
        },
      },
      credentialId,
      publicKey: publicKeyBase64,
      privateKey,
    };
  }

  /**
   * Create attestation object with "none" attestation
   */
  createAttestationObject(authenticatorData) {
    // Decode authenticator data from base64url
    const authDataBuffer = Buffer.from(authenticatorData, 'base64url');

    // CBOR encode: { "fmt": "none", "attStmt": {}, "authData": <bytes> }
    // fmt = "none" (text string)
    // attStmt = {} (empty map)
    // authData = authenticatorData bytes

    const fmtKey = Buffer.from([0x63, 0x66, 0x6d, 0x74]); // "fmt" as CBOR text
    const fmtValue = Buffer.from([0x64, 0x6e, 0x6f, 0x6e, 0x65]); // "none" as CBOR text

    const attStmtKey = Buffer.from([0x67, 0x61, 0x74, 0x74, 0x53, 0x74, 0x6d, 0x74]); // "attStmt"
    const attStmtValue = Buffer.from([0xa0]); // empty map

    const authDataKey = Buffer.from([0x68, 0x61, 0x75, 0x74, 0x68, 0x44, 0x61, 0x74, 0x61]); // "authData"

    // Create byte string header for authData
    let authDataHeader;
    if (authDataBuffer.length < 24) {
      authDataHeader = Buffer.from([0x40 + authDataBuffer.length]);
    } else if (authDataBuffer.length < 256) {
      authDataHeader = Buffer.from([0x58, authDataBuffer.length]);
    } else {
      authDataHeader = Buffer.from([
        0x59,
        (authDataBuffer.length >> 8) & 0xff,
        authDataBuffer.length & 0xff,
      ]);
    }

    const attestationObject = Buffer.concat([
      Buffer.from([0xa3]), // map of 3 items
      fmtKey,
      fmtValue,
      attStmtKey,
      attStmtValue,
      authDataKey,
      authDataHeader,
      authDataBuffer,
    ]);

    return this.toBase64url(attestationObject);
  }

  /**
   * Create an authentication response (for loginWithWebAuthn)
   */
  createAuthenticationResponse(challenge, origin, rpId, credentialId, privateKey, username) {
    // Flags: UP (0x01) + UV (0x04) = 0x05
    const flags = 0x05;

    const clientDataJSON = this.createClientDataJSON('webauthn.get', challenge, origin);
    const authenticatorData = this.createAuthenticatorData(rpId, flags);

    // Create signature over authenticatorData || SHA-256(clientDataJSON)
    const clientDataBuffer = Buffer.from(clientDataJSON, 'base64url');
    const clientDataHash = crypto.createHash('sha256').update(clientDataBuffer).digest();
    const authDataBuffer = Buffer.from(authenticatorData, 'base64url');
    const signedData = Buffer.concat([authDataBuffer, clientDataHash]);

    const signature = this.sign(privateKey, signedData);

    return {
      id: credentialId,
      rawId: credentialId,
      response: {
        clientDataJSON,
        authenticatorData,
        signature,
        userHandle: this.stringToBase64url(username),
      },
      authenticatorAttachment: 'platform',
      clientExtensionResults: {},
      type: 'public-key',
    };
  }
}

let anonymousGraphqlFetch;
let graphqlFetchAsAdmin;
let graphqlFetchAsUser;
let serverPort;

test.describe('WebAuthn Flows', () => {
  test.before(async () => {
    const { createAnonymousGraphqlFetch, createLoggedInGraphqlFetch, port } = await setupDatabase();
    anonymousGraphqlFetch = createAnonymousGraphqlFetch();
    graphqlFetchAsAdmin = createLoggedInGraphqlFetch(ADMIN_TOKEN);
    graphqlFetchAsUser = createLoggedInGraphqlFetch(USER_TOKEN);
    serverPort = port;
  });

  test.after(async () => {
    await disconnect();
  });

  test.describe('Mutation.createWebAuthnCredentialCreationOptions', () => {
    test('create a webauthn credential', async () => {
      const { data: { createWebAuthnCredentialCreationOptions } = {} } = await anonymousGraphqlFetch({
        query: /* GraphQL */ `
          mutation {
            createWebAuthnCredentialCreationOptions(username: "blub")
          }
        `,
      });
      assert.partialDeepStrictEqual(
        Object.keys(createWebAuthnCredentialCreationOptions).sort(),
        ['requestId', 'rp', 'user', 'challenge', 'pubKeyCredParams'].sort(),
      );
    });
  });

  test.describe('Mutation.createWebAuthnCredentialRequestOptions', () => {
    test('create a webauthn credential', async () => {
      const { data: { createWebAuthnCredentialRequestOptions } = {} } = await anonymousGraphqlFetch({
        query: /* GraphQL */ `
          mutation {
            createWebAuthnCredentialRequestOptions(username: "blub")
          }
        `,
      });
      assert.partialDeepStrictEqual(
        Object.keys(createWebAuthnCredentialRequestOptions).sort(),
        ['requestId', 'challenge'].sort(),
      );
    });
  });

  test.describe('User.webAuthnCredentials', () => {
    test('should return empty array when no devices registered', async () => {
      const {
        data: { me },
      } = await graphqlFetchAsAdmin({
        query: /* GraphQL */ `
          query {
            me {
              _id
              webAuthnCredentials {
                _id
              }
            }
          }
        `,
      });

      assert.ok(me);
      assert.ok(Array.isArray(me.webAuthnCredentials));
    });

    test('should return null for anonymous user', async () => {
      const {
        data: { me },
      } = await anonymousGraphqlFetch({
        query: /* GraphQL */ `
          query {
            me {
              _id
              webAuthnCredentials {
                _id
              }
            }
          }
        `,
      });

      assert.equal(me, null);
    });
  });

  test.describe('Mutation.loginWithWebAuthn', () => {
    test('should return error for invalid credentials', async () => {
      const { errors } = await anonymousGraphqlFetch({
        query: /* GraphQL */ `
          mutation LoginWithWebAuthn($credentials: JSON!) {
            loginWithWebAuthn(webAuthnPublicKeyCredentials: $credentials) {
              _id
              user {
                _id
                username
              }
            }
          }
        `,
        variables: {
          credentials: {
            response: {
              userHandle: Buffer.from('nonexistent').toString('base64'),
            },
          },
        },
      });

      assert.ok(errors);
      assert.ok(errors.length > 0);
    });

    test('should return error for user without WebAuthn credentials', async () => {
      const { errors } = await anonymousGraphqlFetch({
        query: /* GraphQL */ `
          mutation LoginWithWebAuthn($credentials: JSON!) {
            loginWithWebAuthn(webAuthnPublicKeyCredentials: $credentials) {
              _id
              user {
                _id
              }
            }
          }
        `,
        variables: {
          credentials: {
            response: {
              userHandle: Buffer.from('admin').toString('base64'),
            },
          },
        },
      });

      assert.ok(errors);
      assert.ok(errors.length > 0);
    });
  });

  test.describe('Mutation.addWebAuthnCredentials', () => {
    test('should return error when not logged in', async () => {
      const { errors } = await anonymousGraphqlFetch({
        query: /* GraphQL */ `
          mutation AddWebAuthnCredentials($credentials: JSON!) {
            addWebAuthnCredentials(credentials: $credentials) {
              _id
              username
            }
          }
        `,
        variables: {
          credentials: {},
        },
      });

      assert.ok(errors);
      assert.strictEqual(errors[0]?.extensions?.code, 'NoPermissionError');
    });
  });

  test.describe('Mutation.removeWebAuthnCredentials', () => {
    test('should return error when not logged in', async () => {
      const { errors } = await anonymousGraphqlFetch({
        query: /* GraphQL */ `
          mutation RemoveWebAuthnCredentials($credentialsId: ID!) {
            removeWebAuthnCredentials(credentialsId: $credentialsId) {
              _id
              username
            }
          }
        `,
        variables: {
          credentialsId: 'test-credential-id',
        },
      });

      assert.ok(errors);
      assert.strictEqual(errors[0]?.extensions?.code, 'NoPermissionError');
    });

    test('should return error for non-existing credential', async () => {
      const { errors } = await graphqlFetchAsAdmin({
        query: /* GraphQL */ `
          mutation RemoveWebAuthnCredentials($credentialsId: ID!) {
            removeWebAuthnCredentials(credentialsId: $credentialsId) {
              _id
              username
            }
          }
        `,
        variables: {
          credentialsId: 'non-existing-credential-id',
        },
      });

      assert.ok(errors);
      assert.strictEqual(errors[0]?.extensions?.code, 'UserWebAuthnCredentialsNotFoundError');
    });
  });

  test.describe('WebAuthn Full Flow', () => {
    const authenticator = new VirtualAuthenticator();
    let storedCredentialId;
    let storedPrivateKey;
    const testUsername = 'user'; // Use existing seeded user
    let origin;
    const rpId = 'localhost';

    test.before(() => {
      origin = `http://localhost:${serverPort}`;
    });

    test('should successfully register a WebAuthn credential', async () => {
      // Step 1: Get credential creation options
      const { data: { createWebAuthnCredentialCreationOptions: options } = {} } =
        await graphqlFetchAsUser({
          query: /* GraphQL */ `
            mutation CreateOptions($username: String!) {
              createWebAuthnCredentialCreationOptions(username: $username)
            }
          `,
          variables: { username: testUsername },
          headers: { origin },
        });

      assert.ok(options);
      assert.ok(options.challenge);
      assert.ok(options.requestId);

      // Step 2: Create registration response using virtual authenticator
      const { registration, credentialId, privateKey } = authenticator.createRegistrationResponse(
        options.challenge,
        origin,
        rpId,
        testUsername,
      );

      storedCredentialId = credentialId;
      storedPrivateKey = privateKey;

      // Step 3: Submit the registration
      const { data, errors } = await graphqlFetchAsUser({
        query: /* GraphQL */ `
          mutation AddCredentials($credentials: JSON!) {
            addWebAuthnCredentials(credentials: $credentials) {
              _id
              username
              webAuthnCredentials {
                _id
                created
              }
            }
          }
        `,
        variables: { credentials: registration },
        headers: { origin },
      });

      assert.ok(!errors, `Unexpected errors: ${JSON.stringify(errors)}`);
      assert.ok(data?.addWebAuthnCredentials);
      assert.strictEqual(data.addWebAuthnCredentials.username, testUsername);
      assert.ok(Array.isArray(data.addWebAuthnCredentials.webAuthnCredentials));
      assert.ok(data.addWebAuthnCredentials.webAuthnCredentials.length > 0);
    });

    test('should query webAuthnCredentials for user with registered devices', async () => {
      const { data, errors } = await graphqlFetchAsUser({
        query: /* GraphQL */ `
          query {
            me {
              _id
              username
              webAuthnCredentials {
                _id
                created
              }
            }
          }
        `,
      });

      assert.ok(!errors, `Unexpected errors: ${JSON.stringify(errors)}`);
      assert.ok(data?.me);
      assert.ok(Array.isArray(data.me.webAuthnCredentials));
      assert.ok(data.me.webAuthnCredentials.length > 0);
      assert.ok(data.me.webAuthnCredentials[0]._id);
      assert.ok(data.me.webAuthnCredentials[0].created);
    });

    test('should successfully login with WebAuthn credential', async () => {
      // Step 1: Get credential request options
      const { data: { createWebAuthnCredentialRequestOptions: options } = {} } =
        await anonymousGraphqlFetch({
          query: /* GraphQL */ `
            mutation CreateRequestOptions($username: String!) {
              createWebAuthnCredentialRequestOptions(username: $username)
            }
          `,
          variables: { username: testUsername },
          headers: { origin },
        });

      assert.ok(options);
      assert.ok(options.challenge);
      assert.ok(options.requestId);

      // Step 2: Create authentication response using virtual authenticator
      const authResponse = authenticator.createAuthenticationResponse(
        options.challenge,
        origin,
        rpId,
        storedCredentialId,
        storedPrivateKey,
        testUsername,
      );

      // Add requestId to the response
      authResponse.requestId = options.requestId;

      // Step 3: Submit the authentication
      const { data, errors } = await anonymousGraphqlFetch({
        query: /* GraphQL */ `
          mutation LoginWithWebAuthn($credentials: JSON!) {
            loginWithWebAuthn(webAuthnPublicKeyCredentials: $credentials) {
              _id
              user {
                _id
                username
              }
            }
          }
        `,
        variables: { credentials: authResponse },
        headers: { origin },
      });

      assert.ok(!errors, `Unexpected errors: ${JSON.stringify(errors)}`);
      assert.ok(data?.loginWithWebAuthn);
      assert.ok(data.loginWithWebAuthn._id); // Login token
      assert.strictEqual(data.loginWithWebAuthn.user.username, testUsername);
    });

    test('should successfully remove WebAuthn credential', async () => {
      const { data, errors } = await graphqlFetchAsUser({
        query: /* GraphQL */ `
          mutation RemoveCredentials($credentialsId: ID!) {
            removeWebAuthnCredentials(credentialsId: $credentialsId) {
              _id
              username
              webAuthnCredentials {
                _id
              }
            }
          }
        `,
        variables: { credentialsId: storedCredentialId },
      });

      assert.ok(!errors, `Unexpected errors: ${JSON.stringify(errors)}`);
      assert.ok(data?.removeWebAuthnCredentials);
      assert.strictEqual(data.removeWebAuthnCredentials.username, testUsername);
      // Credential should be removed
      const remainingCreds = data.removeWebAuthnCredentials.webAuthnCredentials.filter(
        (c) => c._id === storedCredentialId,
      );
      assert.strictEqual(remainingCreds.length, 0);
    });

    test('should fail login after credential removal', async () => {
      // Get new credential request options
      const { data: { createWebAuthnCredentialRequestOptions: options } = {} } =
        await anonymousGraphqlFetch({
          query: /* GraphQL */ `
            mutation CreateRequestOptions($username: String!) {
              createWebAuthnCredentialRequestOptions(username: $username)
            }
          `,
          variables: { username: testUsername },
          headers: { origin },
        });

      // Try to authenticate with the removed credential
      const authResponse = authenticator.createAuthenticationResponse(
        options.challenge,
        origin,
        rpId,
        storedCredentialId,
        storedPrivateKey,
        testUsername,
      );
      authResponse.requestId = options.requestId;

      const { errors } = await anonymousGraphqlFetch({
        query: /* GraphQL */ `
          mutation LoginWithWebAuthn($credentials: JSON!) {
            loginWithWebAuthn(webAuthnPublicKeyCredentials: $credentials) {
              _id
            }
          }
        `,
        variables: { credentials: authResponse },
        headers: { origin },
      });

      assert.ok(errors);
      assert.ok(errors.length > 0);
    });
  });
});
