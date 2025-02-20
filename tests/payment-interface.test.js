import test from 'node:test';
import assert from 'node:assert';
import {
  setupDatabase,
  createLoggedInGraphqlFetch,
  createAnonymousGraphqlFetch,
  disconnect,
} from './helpers.js';
import { ADMIN_TOKEN } from './seeds/users.js';

// Global setup
test.before(async () => {
  await setupDatabase();
});

test.after(async () => {
  await disconnect();
});

test('For logged in users: should return list of paymentInterfaces by type', async () => {
  const graphqlFetch = createLoggedInGraphqlFetch(ADMIN_TOKEN);
  const {
    data: { paymentInterfaces },
  } = await graphqlFetch({
    query: /* GraphQL */ `
      query PaymentInterfaces($type: PaymentProviderType!) {
        paymentInterfaces(type: $type) {
          _id
          label
          version
        }
      }
    `,
    variables: { type: 'INVOICE' },
  });
  assert.notStrictEqual(paymentInterfaces.length, 0);
  assert.partialDeepStrictEqual(paymentInterfaces[0], { _id: 'shop.unchained.invoice' });
  assert.partialDeepStrictEqual(paymentInterfaces[1], { _id: 'shop.unchained.invoice-prepaid' });
});

test('For Anonymous user: should return error', async () => {
  const graphqlAnonymousFetch = createAnonymousGraphqlFetch();
  const { errors } = await graphqlAnonymousFetch({
    query: /* GraphQL */ `
      query PaymentInterfaces($type: PaymentProviderType!) {
        paymentInterfaces(type: $type) {
          _id
        }
      }
    `,
    variables: { type: 'INVOICE' },
  });
  assert.strictEqual(errors[0].extensions?.code, 'NoPermissionError');
});
