import { setupDatabase, createAnonymousGraphqlFetch, createLoggedInGraphqlFetch } from './helpers.js';
import { User, Admin, USER_TOKEN, ADMIN_TOKEN } from './seeds/users.js';

let db;
let graphqlFetch;
let anonymousGraphqlFetch;

describe('WebAuthn Flows', () => {
  beforeAll(async () => {
    [db] = await setupDatabase();
    anonymousGraphqlFetch = await createAnonymousGraphqlFetch();
    graphqlFetch = await createLoggedInGraphqlFetch(USER_TOKEN);
  });
  
  describe('Mutation.createWebAuthnCredentialCreationOptions', () => {
    let webAuthnChallenge;

    it('create a webauthn credential', async () => {
      const { data: { createWebAuthnCredentialCreationOptions } = {} } = await anonymousGraphqlFetch({
        query: /* GraphQL */ `
          mutation {
            createWebAuthnCredentialCreationOptions(username: "blub")
          }
        `,
      });
      webAuthnChallenge = createWebAuthnCredentialCreationOptions.challenge;
      expect(createWebAuthnCredentialCreationOptions).toMatchObject({
        requestId: expect.any(Number),
        rp: {},
        user: {},
        challenge: expect.any(String),
        pubKeyCredParams: expect.any(Array),
      });
    });

    it.todo('create a user with the previously created challenge');
  });

  describe('Mutation.createWebAuthnCredentialRequestOptions', () => {
    let webAuthnChallenge;

    it('create a webauthn credential', async () => {
      const { data: { createWebAuthnCredentialRequestOptions } = {} } = await anonymousGraphqlFetch({
        query: /* GraphQL */ `
          mutation {
            createWebAuthnCredentialRequestOptions(username: "blub")
          }
        `,
      });
      webAuthnChallenge = createWebAuthnCredentialRequestOptions.challenge;
      expect(createWebAuthnCredentialRequestOptions).toMatchObject({
        requestId: expect.any(Number),
        challenge: expect.any(String),
      });
    });
  });

  describe('Mutation.loginWithWebAuthn', () => {
    it.todo('login with previously registered credentials');
  });
  describe('Mutation.addWebAuthnCredentials', () => {
    it.todo('add webauthn device to admin user');
  });
  describe('Mutation.removeWebAuthnCredentials', () => {
    it.todo('remove webauthn device from admin user');
  });
  describe('User.webAuthnCredentials', () => {
    it.todo('see a list of registered devices');
  });
});
