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
});
