import { setupDatabase, createLoggedInGraphqlFetch, createAnonymousGraphqlFetch } from './helpers.js';
import { ADMIN_TOKEN } from './seeds/users.js';
import { SimpleWarehousingProvider } from './seeds/warehousings.js';

let graphqlFetch;
let graphqlAnonymousFetch;

describe('WarehousingProviders', () => {
  beforeAll(async () => {
    await setupDatabase();
    graphqlFetch = createLoggedInGraphqlFetch(ADMIN_TOKEN);
    graphqlAnonymousFetch = createAnonymousGraphqlFetch();
  });

  describe('Query.warehousingProviders when loggedin should', () => {
    it('return array of all warehousingProviders when type is not given', async () => {
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
      expect(warehousingProviders).toMatchObject([
        {
          _id: SimpleWarehousingProvider._id,
          type: SimpleWarehousingProvider.type,
          configuration: [],
          configurationError: null,
          isActive: true,
        },
      ]);
    });

    it('return list of warehousingProviders based on the given type', async () => {
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
      expect(warehousingProviders.length).toEqual(1);
    });
  });

  describe('Query.warehousingProvidersCount when loggedin should', () => {
    it('return total number of warehousing providers', async () => {
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
      expect(warehousingProvidersCount).toEqual(1);
    });

    it('return total number of warehousingProviders based on the given type', async () => {
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
      expect(warehousingProvidersCount).toEqual(1);
    });
  });

  describe('Query.warehousingProvider when logged in should', () => {
    it('return single warehousingProvider when ID is provided', async () => {
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
      expect(warehousingProvider._id).toEqual(SimpleWarehousingProvider._id);
    });

    it('return error when passed invalid warehousingProviderId ', async () => {
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
      expect(warehousingProvider).toBe(null);
      expect(errors[0]?.extensions?.code).toEqual('InvalidIdError');
    });
  });

  describe('Query.warehousingProviders for anonymous user should', () => {
    it('return NoPermissionError', async () => {
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
      expect(errors[0]?.extensions?.code).toEqual('NoPermissionError');
    });
  });

  describe('Query.warehousingProvidersCount for anonymous user should', () => {
    it('return NoPermissionError', async () => {
      const { errors } = await graphqlAnonymousFetch({
        query: /* GraphQL */ `
          query {
            warehousingProvidersCount
          }
        `,
        variables: {},
      });
      expect(errors[0]?.extensions?.code).toEqual('NoPermissionError');
    });
  });
});
