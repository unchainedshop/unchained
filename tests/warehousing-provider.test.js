import { test, before, describe } from 'node:test';
import assert from 'node:assert';
import { setupDatabase, disconnect } from './helpers.js';
import { ADMIN_TOKEN } from './seeds/users.js';
import { SimpleWarehousingProvider } from './seeds/warehousings.js';

let createLoggedInGraphqlFetch;
let createAnonymousGraphqlFetch;

let graphqlFetch;
let graphqlAnonymousFetch;

describe('Warehousing: Provider', () => {
  before(async () => {
    ({ createLoggedInGraphqlFetch, createAnonymousGraphqlFetch } = await setupDatabase());
    graphqlFetch = createLoggedInGraphqlFetch(ADMIN_TOKEN);
    graphqlAnonymousFetch = createAnonymousGraphqlFetch();
  });

  test.after(async () => {
    await disconnect();
  });

  describe('Query.warehousingProviders when loggedin should', () => {
    test('return array of all warehousingProviders when type is not given', async () => {
      const {
        data: { warehousingProviders },
      } = await graphqlFetch({
        query: /* GraphQL */ `
          query WarehousingProviders {
            warehousingProviders {
              _id
              created
              updated
              deleted
              type
              interface {
                _id
                label
                version
              }
              configuration
              configurationError
              isActive
            }
          }
        `,
        variables: {},
      });
      assert.ok(warehousingProviders.length >= 1);
      const providerExists = warehousingProviders.some((p) => p._id === SimpleWarehousingProvider._id);
      assert.ok(providerExists);
    });

    test('return list of warehousingProviders based on the given type', async () => {
      const {
        data: { warehousingProviders },
      } = await graphqlFetch({
        query: /* GraphQL */ `
          query WarehousingProviders($type: WarehousingProviderType) {
            warehousingProviders(type: $type) {
              _id
            }
          }
        `,
        variables: {
          type: 'PHYSICAL',
        },
      });
      assert.strictEqual(warehousingProviders.length, 1);
    });
  });

  describe('Query.warehousingProvidersCount when loggedin should', () => {
    test('return total number of warehousing providers', async () => {
      const {
        data: { warehousingProvidersCount },
      } = await graphqlFetch({
        query: /* GraphQL */ `
          query {
            warehousingProvidersCount
          }
        `,
        variables: {},
      });
      assert.ok(warehousingProvidersCount >= 1);
    });

    test('return total number of warehousingProviders based on the given type', async () => {
      const {
        data: { warehousingProvidersCount },
      } = await graphqlFetch({
        query: /* GraphQL */ `
          query WarehousingProvidersCount($type: WarehousingProviderType) {
            warehousingProvidersCount(type: $type)
          }
        `,
        variables: {
          type: 'PHYSICAL',
        },
      });
      assert.strictEqual(warehousingProvidersCount, 1);
    });
  });

  describe('Query.warehousingProvider when logged in should', () => {
    test('return single warehousingProvider when ID is provided', async () => {
      const {
        data: { warehousingProvider },
      } = await graphqlFetch({
        query: /* GraphQL */ `
          query WarehousingProvider($warehousingProviderId: ID!) {
            warehousingProvider(warehousingProviderId: $warehousingProviderId) {
              _id
              created
              updated
              deleted
              type
              interface {
                _id
                label
                version
              }
              configuration
              configurationError
              isActive
            }
          }
        `,
        variables: {
          warehousingProviderId: SimpleWarehousingProvider._id,
        },
      });
      assert.strictEqual(warehousingProvider._id, SimpleWarehousingProvider._id);
    });

    test('return error when passed invalid warehousingProviderId ', async () => {
      const {
        data: { warehousingProvider },
        errors,
      } = await graphqlFetch({
        query: /* GraphQL */ `
          query WarehousingProvider($warehousingProviderId: ID!) {
            warehousingProvider(warehousingProviderId: $warehousingProviderId) {
              _id
            }
          }
        `,
        variables: {
          warehousingProviderId: '',
        },
      });
      assert.strictEqual(warehousingProvider, null);
      assert.strictEqual(errors[0]?.extensions?.code, 'InvalidIdError');
    });
  });

  describe('Query.warehousingProviders for anonymous user should', () => {
    test('return NoPermissionError', async () => {
      const { errors } = await graphqlAnonymousFetch({
        query: /* GraphQL */ `
          query WarehousingProviders {
            warehousingProviders {
              _id
            }
          }
        `,
        variables: {},
      });
      assert.strictEqual(errors[0]?.extensions?.code, 'NoPermissionError');
    });
  });

  describe('Query.warehousingProvidersCount for anonymous user should', () => {
    test('return NoPermissionError', async () => {
      const { errors } = await graphqlAnonymousFetch({
        query: /* GraphQL */ `
          query {
            warehousingProvidersCount
          }
        `,
        variables: {},
      });
      assert.strictEqual(errors[0]?.extensions?.code, 'NoPermissionError');
    });
  });
});
