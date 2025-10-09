import {
  setupDatabase,
  createAnonymousGraphqlFetch,
  createLoggedInGraphqlFetch,
  disconnect,
} from './helpers.js';
import { ADMIN_TOKEN } from './seeds/users.js';
import assert from 'node:assert';
import test from 'node:test';

let anonymousGraphqlFetch;
let graphqlFetchAsAdmin;

test.describe('WebAuthn Flows', () => {
  test.before(async () => {
    await setupDatabase();
    anonymousGraphqlFetch = createAnonymousGraphqlFetch();
    graphqlFetchAsAdmin = createLoggedInGraphqlFetch(ADMIN_TOKEN);
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

  test.describe('TODO: WebAuthn credential mocking', () => {
    test.todo(
      `addWebAuthnCredentials should successfully add valid credentials Requires mocking WebAuthn verification API or test authenticator. verifyCredentialCreation needs valid WebAuthn credential data.`,
    );

    test.todo(
      `loginWithWebAuthn should successfully login with valid credentials Requires mocking WebAuthn verification and pre-seeded credentials in test fixtures.`,
    );

    test.todo(
      `removeWebAuthnCredentials should successfully remove existing credential. Requires first adding a WebAuthn credential (blocked by addWebAuthnCredentials above`,
    );

    test.todo(
      `webAuthnCredentials query should return credentials for user with registered devices Requires pre-seeding users with WebAuthn credentials in test fixtures.`,
    );
  });
});
