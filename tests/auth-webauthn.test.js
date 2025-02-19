import { setupDatabase, createAnonymousGraphqlFetch } from './helpers.js';
import assert from 'node:assert';
import test from 'node:test';

let anonymousGraphqlFetch;

test.describe('WebAuthn Flows', () => {
  test.before(async () => {
    await setupDatabase();
    anonymousGraphqlFetch = createAnonymousGraphqlFetch();
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
      assert.deepStrictEqual(createWebAuthnCredentialCreationOptions, {
        requestId: assert.match(Number),
        rp: {},
        user: {},
        challenge: assert.match(String),
        pubKeyCredParams: assert.match(Array),
      });
    });

    test.todo('create a user with the previously created challenge');
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
      assert.deepStrictEqual(createWebAuthnCredentialRequestOptions, {
        requestId: assert.match(Number),
        challenge: assert.match(String),
      });
    });
  });

  test.describe('Mutation.loginWithWebAuthn', () => {
    test.todo('login with previously registered credentials');
  });
  test.describe('Mutation.addWebAuthnCredentials', () => {
    test.todo('add webauthn device to admin user');
  });
  test.describe('Mutation.removeWebAuthnCredentials', () => {
    test.todo('remove webauthn device from admin user');
  });
  test.describe('User.webAuthnCredentials', () => {
    test.todo('see a list of registered devices');
  });
});
