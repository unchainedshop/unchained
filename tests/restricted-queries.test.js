import { setupDatabase, createAnonymousGraphqlFetch } from './helpers';

let connection;
// let db;
let graphqlFetch;

const restrictedQueries = [
  'me',
  'deliveryProviders',
  'deliveryProvider',
  'deliveryInterfaces',
  'warehousingProviders',
  'warehousingProvider',
  'warehousingInterfaces',
  'paymentProviders',
  'paymentProvider',
  'paymentInterfaces',
  'orders',
  'order',
  'logs'
];

describe('public queries', () => {
  beforeAll(async () => {
    [, /* db */ connection] = await setupDatabase();
    graphqlFetch = await createAnonymousGraphqlFetch();
  });

  afterAll(async () => {
    await connection.close();
  });

  restrictedQueries.map(queryName => {
    it(`${queryName} is restricted`, async () => {
      const { errors } = await graphqlFetch({
        query: /* GraphQL */ `
        {
          ${queryName} {
            _id
          }
        }
        `
      });

      console.log(errors);
    });
  });
});
