import {
  setupDatabase,
  createLoggedInGraphqlFetch,
  createAnonymousGraphqlFetch,
} from './helpers';
import { ADMIN_TOKEN } from './seeds/users';
import { SimpleWarehousingProvider } from './seeds/warehousings';

let connection;
let graphqlFetch;

describe('WarehousingProviders', () => {
  beforeAll(async () => {
    [, connection] = await setupDatabase();
    graphqlFetch = await createLoggedInGraphqlFetch(ADMIN_TOKEN);
  });

  afterAll(async () => {
    await connection.close();
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
      expect(Array.isArray(warehousingProviders)).toBe(true);
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

  describe('Query.warehousingProvider when loged in should', () => {
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
    it('return error', async () => {
      const graphqlAnonymousFetch = await createAnonymousGraphqlFetch();
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
      expect(errors.length).toEqual(1);
    });
  });
});
