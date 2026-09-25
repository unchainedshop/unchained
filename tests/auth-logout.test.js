import {
  setupDatabase,
  createLoggedInGraphqlFetch,
  createAnonymousGraphqlFetch,
  disconnect,
} from './helpers.js';
import {
  getServerPort,
  getOidcPrivateKey,
  TEST_OIDC_ISSUER,
  TEST_OIDC_AUDIENCE,
  TEST_OIDC_PREFIXED_ISSUER,
  oidcSubjectToUserId,
} from './setup.js';
import { Admin, User, ADMIN_TOKEN, USER_TOKEN } from './seeds/users.js';
import assert from 'node:assert';
import test from 'node:test';
import * as jose from 'jose';

let db;
let graphqlFetch;

test.describe('Auth: logoutAllSessions Mutation', () => {
  test.before(async () => {
    [db] = await setupDatabase();
    graphqlFetch = createLoggedInGraphqlFetch(USER_TOKEN);
  });

  test.after(async () => {
    await disconnect();
  });

  test.describe('Mutation.logoutAllSessions', () => {
    test('authenticated user can call logoutAllSessions', async () => {
      const { data: { logoutAllSessions } = {} } = await graphqlFetch({
        query: /* GraphQL */ `
          mutation {
            logoutAllSessions {
              success
            }
          }
        `,
      });

      assert.strictEqual(logoutAllSessions.success, true);
    });

    test('tokenVersion is incremented in database', async () => {
      const Users = db.collection('users');

      // Get current tokenVersion
      const userBefore = await Users.findOne({ _id: User._id });
      const tokenVersionBefore = userBefore?.tokenVersion ?? 0;

      await graphqlFetch({
        query: /* GraphQL */ `
          mutation {
            logoutAllSessions {
              success
            }
          }
        `,
      });

      const userAfter = await Users.findOne({ _id: User._id });
      assert.strictEqual(userAfter.tokenVersion, tokenVersionBefore + 1);
    });

    test('user can pass their own userId explicitly', async () => {
      const { data: { logoutAllSessions } = {} } = await graphqlFetch({
        query: /* GraphQL */ `
          mutation LogoutAllSessions($userId: ID) {
            logoutAllSessions(userId: $userId) {
              success
            }
          }
        `,
        variables: { userId: User._id },
      });

      assert.strictEqual(logoutAllSessions.success, true);
    });

    test('regular user cannot force-logout another user', async () => {
      const { errors } = await graphqlFetch({
        query: /* GraphQL */ `
          mutation LogoutAllSessions($userId: ID) {
            logoutAllSessions(userId: $userId) {
              success
            }
          }
        `,
        variables: { userId: Admin._id },
      });

      assert.strictEqual(errors[0]?.extensions?.code, 'NoPermissionError');
    });

    test('admin can force-logout another user without ending own session', async () => {
      const adminFetch = createLoggedInGraphqlFetch(ADMIN_TOKEN);
      const Users = db.collection('users');

      const userBefore = await Users.findOne({ _id: User._id });
      const tokenVersionBefore = userBefore?.tokenVersion ?? 0;

      const { data: { logoutAllSessions } = {} } = await adminFetch({
        query: /* GraphQL */ `
          mutation LogoutAllSessions($userId: ID) {
            logoutAllSessions(userId: $userId) {
              success
            }
          }
        `,
        variables: { userId: User._id },
      });

      assert.strictEqual(logoutAllSessions.success, true);

      const userAfter = await Users.findOne({ _id: User._id });
      assert.strictEqual(userAfter.tokenVersion, tokenVersionBefore + 1);

      // admin session remains usable
      const { data: { me } = {} } = await adminFetch({
        query: /* GraphQL */ `
          query {
            me {
              _id
            }
          }
        `,
      });
      assert.strictEqual(me._id, Admin._id);
    });

    test('admin force-logout of unknown user returns UserNotFoundError', async () => {
      const adminFetch = createLoggedInGraphqlFetch(ADMIN_TOKEN);
      const { errors } = await adminFetch({
        query: /* GraphQL */ `
          mutation LogoutAllSessions($userId: ID) {
            logoutAllSessions(userId: $userId) {
              success
            }
          }
        `,
        variables: { userId: 'does-not-exist' },
      });

      assert.strictEqual(errors[0]?.extensions?.code, 'UserNotFoundError');
    });

    test('anonymous user cannot call logoutAllSessions', async () => {
      const anonymousFetch = createAnonymousGraphqlFetch();
      const { errors } = await anonymousFetch({
        query: /* GraphQL */ `
          mutation {
            logoutAllSessions {
              success
            }
          }
        `,
      });

      assert.strictEqual(errors[0]?.extensions?.code, 'NoPermissionError');
    });
  });
});

test.describe('Auth: JWT revocation for users without a stored tokenVersion', () => {
  let adminFetch;

  // Fresh accounts never get a tokenVersion field, so the first revocation is the one
  // that has to work.
  const createUserSession = async (username) => {
    const { data, errors, headers } = await createAnonymousGraphqlFetch()({
      query: /* GraphQL */ `
        mutation CreateUser($username: String, $email: String, $password: String) {
          createUser(username: $username, email: $email, password: $password) {
            user {
              _id
            }
          }
        }
      `,
      variables: { username, email: `${username}@unchained.local`, password: 'Revocation-Test-1' },
    });
    assert.ifError(errors?.[0]);
    const token = headers.get('set-cookie')?.match(/unchained_token=([^;,]+)/)?.[1];
    assert.ok(token, 'createUser should set the unchained_token cookie');
    return { userId: data.createUser.user._id, token };
  };

  const withSession = (token) => (request) =>
    createAnonymousGraphqlFetch()({ ...request, headers: { cookie: `unchained_token=${token}` } });

  const currentUserId = async (token) => {
    const { data } = await withSession(token)({
      query: /* GraphQL */ `
        query {
          me {
            _id
          }
        }
      `,
    });
    return data?.me?._id ?? null;
  };

  test.before(async () => {
    [db] = await setupDatabase();
    adminFetch = createLoggedInGraphqlFetch(ADMIN_TOKEN);
  });

  test.after(async () => {
    await disconnect();
  });

  test('logoutAllSessions revokes the old token on the first call', async () => {
    const { userId, token } = await createUserSession('revoke-self');
    assert.strictEqual(await currentUserId(token), userId);

    const { data } = await withSession(token)({
      query: /* GraphQL */ `
        mutation {
          logoutAllSessions {
            success
          }
        }
      `,
    });
    assert.strictEqual(data.logoutAllSessions.success, true);

    assert.strictEqual(await currentUserId(token), null);
  });

  test('admin force-logout revokes the old token on the first call', async () => {
    const { userId, token } = await createUserSession('revoke-by-admin');
    assert.strictEqual(await currentUserId(token), userId);

    const { data } = await adminFetch({
      query: /* GraphQL */ `
        mutation LogoutAllSessions($userId: ID) {
          logoutAllSessions(userId: $userId) {
            success
          }
        }
      `,
      variables: { userId },
    });
    assert.strictEqual(data.logoutAllSessions.success, true);

    assert.strictEqual(await currentUserId(token), null);
  });

  test('removing a user with order history invalidates their token', async () => {
    const { userId, token } = await createUserSession('revoke-removed');
    assert.strictEqual(await currentUserId(token), userId);

    // With order history the user is only marked deleted (soft delete), not purged.
    await db.collection('orders').insertOne({
      _id: `revoke-removed-order-${userId}`,
      userId,
      status: 'CONFIRMED',
      created: new Date(),
      currencyCode: 'CHF',
      countryCode: 'CH',
    });

    const { errors } = await adminFetch({
      query: /* GraphQL */ `
        mutation RemoveUser($userId: ID) {
          removeUser(userId: $userId) {
            _id
          }
        }
      `,
      variables: { userId },
    });
    assert.ifError(errors?.[0]);

    assert.strictEqual(await currentUserId(token), null);
  });
});

test.describe('Auth: Backchannel Logout Handler', () => {
  const BACKCHANNEL_USER_ID = 'backchannel-test-user';

  test.before(async () => {
    [db] = await setupDatabase();

    // Create test user for backchannel logout
    const Users = db.collection('users');
    await Users.findOrInsertOne({
      ...User,
      _id: BACKCHANNEL_USER_ID,
      username: 'backchannel-user',
      emails: [{ address: 'backchannel@unchained.local', verified: true }],
      tokenVersion: 0,
      oidcLogoutAt: null,
    });
  });

  test.after(async () => {
    await disconnect();
  });

  // Helper to create a signed logout token
  async function createLogoutToken(overrides = {}) {
    const privateKey = getOidcPrivateKey();
    const now = Math.floor(Date.now() / 1000);
    const payload = {
      iss: TEST_OIDC_ISSUER,
      sub: BACKCHANNEL_USER_ID,
      aud: TEST_OIDC_AUDIENCE,
      iat: now,
      jti: `logout-${Date.now()}`,
      events: {
        'http://schemas.openid.net/event/backchannel-logout': {},
      },
      ...overrides,
    };

    return new jose.SignJWT(payload)
      .setProtectedHeader({ alg: 'RS256', kid: 'test-key-id' })
      .sign(privateKey);
  }

  // Helper to call the handler with form-urlencoded body via HTTP
  async function callHandler(method, body) {
    const port = getServerPort();
    return fetch(`http://localhost:${port}/backchannel-logout`, {
      method,
      headers: body ? { 'Content-Type': 'application/x-www-form-urlencoded' } : {},
      body: body ? new URLSearchParams(body).toString() : undefined,
    });
  }

  // Helper to call the handler with JSON body via HTTP
  async function callHandlerWithJson(method, body) {
    const port = getServerPort();
    return fetch(`http://localhost:${port}/backchannel-logout`, {
      method,
      headers: body ? { 'Content-Type': 'application/json' } : {},
      body: body ? JSON.stringify(body) : undefined,
    });
  }

  test('valid logout token invalidates user sessions', async () => {
    const Users = db.collection('users');

    // Reset the test user
    await Users.updateOne(
      { _id: BACKCHANNEL_USER_ID },
      { $set: { tokenVersion: 5, oidcLogoutAt: null } },
    );

    const logoutToken = await createLogoutToken();
    const response = await callHandler('POST', { logout_token: logoutToken });

    assert.strictEqual(response.status, 200);

    // Verify user's tokenVersion was incremented and oidcLogoutAt was set
    const user = await Users.findOne({ _id: BACKCHANNEL_USER_ID });
    assert.strictEqual(user.tokenVersion, 6, 'tokenVersion should be incremented');
    assert.ok(user.oidcLogoutAt instanceof Date, 'oidcLogoutAt should be set');
  });

  test('missing logout_token returns 400', async () => {
    const response = await callHandler('POST', {});

    assert.strictEqual(response.status, 400);
    const body = await response.json();
    assert.strictEqual(body.error, 'missing_logout_token');
  });

  test('invalid JWT format returns 400', async () => {
    const response = await callHandler('POST', { logout_token: 'not-a-valid-jwt' });

    assert.strictEqual(response.status, 400);
    const body = await response.json();
    assert.strictEqual(body.error, 'invalid_token');
  });

  test('unknown issuer returns 400', async () => {
    const logoutToken = await createLogoutToken({ iss: 'https://unknown-provider.com' });
    const response = await callHandler('POST', { logout_token: logoutToken });

    assert.strictEqual(response.status, 400);
    const body = await response.json();
    assert.strictEqual(body.error, 'unknown_issuer');
  });

  test('invalid signature returns 400', async () => {
    // Generate a different keypair to sign with
    const wrongKeyPair = await jose.generateKeyPair('RS256');

    const payload = {
      iss: TEST_OIDC_ISSUER,
      sub: BACKCHANNEL_USER_ID,
      aud: TEST_OIDC_AUDIENCE,
      iat: Math.floor(Date.now() / 1000),
      jti: `logout-${Date.now()}`,
      events: {
        'http://schemas.openid.net/event/backchannel-logout': {},
      },
    };

    const wronglySignedToken = await new jose.SignJWT(payload)
      .setProtectedHeader({ alg: 'RS256', kid: 'test-key-id' })
      .sign(wrongKeyPair.privateKey);

    const response = await callHandler('POST', { logout_token: wronglySignedToken });

    assert.strictEqual(response.status, 400);
    const body = await response.json();
    assert.strictEqual(body.error, 'invalid_signature');
  });

  test('missing backchannel-logout event claim returns 400', async () => {
    // Create token without the events claim
    const logoutToken = await createLogoutToken({ events: {} });
    const response = await callHandler('POST', { logout_token: logoutToken });

    assert.strictEqual(response.status, 400);
    const body = await response.json();
    assert.strictEqual(body.error, 'invalid_token_type');
  });

  test('user not found returns 200 (per OIDC spec)', async () => {
    const logoutToken = await createLogoutToken({ sub: 'non-existent-user-id' });
    const response = await callHandler('POST', { logout_token: logoutToken });

    // Per OIDC spec, we should return 200 even if user doesn't exist
    assert.strictEqual(response.status, 200);
  });

  test('non-POST method returns 405', async () => {
    const response = await callHandler('GET', null);

    assert.strictEqual(response.status, 405);
    const body = await response.json();
    assert.strictEqual(body.error, 'method_not_allowed');
  });

  test('JSON content type is also supported', async () => {
    const Users = db.collection('users');

    // Reset the test user
    await Users.updateOne(
      { _id: BACKCHANNEL_USER_ID },
      { $set: { tokenVersion: 10, oidcLogoutAt: null } },
    );

    const logoutToken = await createLogoutToken();
    const response = await callHandlerWithJson('POST', { logout_token: logoutToken });

    assert.strictEqual(response.status, 200);

    // Verify user's tokenVersion was incremented
    const user = await Users.findOne({ _id: BACKCHANNEL_USER_ID });
    assert.strictEqual(user.tokenVersion, 11, 'tokenVersion should be incremented');
  });

  test.describe('provider with userIdFromSubject', () => {
    const subject = 'prefixed-subject';
    const mappedUserId = oidcSubjectToUserId(subject);

    test.before(async () => {
      await db.collection('users').findOrInsertOne({
        _id: mappedUserId,
        created: new Date(),
        username: 'prefixed-oidc-user',
        emails: [{ address: 'prefixed-oidc@unchained.local', verified: true }],
        roles: [],
        services: {},
        tokenVersion: 3,
        oidcLogoutAt: null,
      });
    });

    test('logout token revokes the user stored under the mapped id', async () => {
      const logoutToken = await createLogoutToken({ iss: TEST_OIDC_PREFIXED_ISSUER, sub: subject });
      const response = await callHandler('POST', { logout_token: logoutToken });
      assert.strictEqual(response.status, 200);

      const user = await db.collection('users').findOne({ _id: mappedUserId });
      assert.strictEqual(user.tokenVersion, 4, 'tokenVersion of the mapped user should be incremented');
    });

    test('access token authenticates the user stored under the mapped id', async () => {
      const now = Math.floor(Date.now() / 1000);
      const accessToken = await new jose.SignJWT({
        iss: TEST_OIDC_PREFIXED_ISSUER,
        sub: subject,
        aud: TEST_OIDC_AUDIENCE,
        iat: now,
        exp: now + 300,
      })
        .setProtectedHeader({ alg: 'RS256', kid: 'test-key-id' })
        .sign(getOidcPrivateKey());

      const { data } = await createLoggedInGraphqlFetch(`Bearer ${accessToken}`)({
        query: /* GraphQL */ `
          query {
            me {
              _id
            }
          }
        `,
      });
      assert.strictEqual(data?.me?._id, mappedUserId);
    });
  });
});
