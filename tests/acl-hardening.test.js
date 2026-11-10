import test from 'node:test';
import assert from 'node:assert';
import {
  setupDatabase,
  createLoggedInGraphqlFetch,
  createAnonymousGraphqlFetch,
  disconnect,
} from './helpers.js';
import { ADMIN_TOKEN, USER_TOKEN, GUEST_TOKEN } from './seeds/users.js';

test.describe('ACL hardening', () => {
  let db;
  let adminGraphqlFetch;
  let graphqlFetch;
  let guestGraphqlFetch;
  let anonymousGraphqlFetch;

  test.before(async () => {
    [db] = await setupDatabase();
    adminGraphqlFetch = createLoggedInGraphqlFetch(ADMIN_TOKEN);
    graphqlFetch = createLoggedInGraphqlFetch(USER_TOKEN);
    guestGraphqlFetch = createLoggedInGraphqlFetch(GUEST_TOKEN);
    anonymousGraphqlFetch = createAnonymousGraphqlFetch();

    await adminGraphqlFetch({
      query: /* GraphQL */ `
        mutation {
          updateDeliveryProvider(
            deliveryProviderId: "simple-delivery-provider"
            deliveryProvider: { configuration: [{ key: "apiKey", value: "provider-secret" }] }
          ) {
            _id
          }
        }
      `,
    });
  });

  test.after(async () => {
    await disconnect();
  });

  test.describe('Provider configuration', () => {
    const PROVIDER_QUERY = /* GraphQL */ `
      query {
        product(productId: "simpleproduct") {
          ... on SimpleProduct {
            simulatedDispatches {
              deliveryProvider {
                _id
                configuration
              }
            }
          }
        }
      }
    `;

    test('is not readable by an anonymous caller', async () => {
      const { data, errors } = await anonymousGraphqlFetch({ query: PROVIDER_QUERY });

      const [dispatch] = data.product.simulatedDispatches;
      assert.strictEqual(dispatch.deliveryProvider.configuration, null);
      assert.strictEqual(errors[0]?.extensions?.code, 'NoPermissionError');
    });

    test('is not readable by a logged-in customer', async () => {
      const { data, errors } = await graphqlFetch({ query: PROVIDER_QUERY });

      const [dispatch] = data.product.simulatedDispatches;
      assert.strictEqual(dispatch.deliveryProvider.configuration, null);
      assert.strictEqual(errors[0]?.extensions?.code, 'NoPermissionError');
    });

    test('is readable by an admin', async () => {
      const { data, errors } = await adminGraphqlFetch({
        query: /* GraphQL */ `
          query {
            deliveryProvider(deliveryProviderId: "simple-delivery-provider") {
              _id
              configuration
            }
          }
        `,
      });

      assert.strictEqual(errors, undefined, JSON.stringify(errors));
      assert.deepStrictEqual(data.deliveryProvider.configuration, [
        { key: 'apiKey', value: 'provider-secret' },
      ]);
    });
  });

  test.describe('Mutation.confirmMediaUpload', () => {
    test('is refused for a file the caller does not own', async () => {
      const fileId = '7FVJLp22ye9zNNBGEosF9X-screenshot-from-2024-11-26-16-13-44.png';
      const before = await db.collection('media_objects').findOne({ _id: fileId });

      const { errors } = await guestGraphqlFetch({
        query: /* GraphQL */ `
          mutation confirmMediaUpload($mediaUploadTicketId: ID!) {
            confirmMediaUpload(mediaUploadTicketId: $mediaUploadTicketId, size: 1, type: "text/html") {
              _id
            }
          }
        `,
        variables: { mediaUploadTicketId: fileId },
      });

      assert.strictEqual(errors[0]?.extensions?.code, 'NoPermissionError');
      const after = await db.collection('media_objects').findOne({ _id: fileId });
      assert.strictEqual(after.type, before.type);
    });
  });
});
