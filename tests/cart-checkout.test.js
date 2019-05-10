import { setupDatabase, createAdminGraphqlFetch } from './helpers';

let connection;
let db;
let graphqlFetch;

describe('cart checkout', () => {
  beforeAll(async () => {
    [db, connection] = await setupDatabase();
    graphqlFetch = await createAdminGraphqlFetch();
  });

  afterAll(async () => {
    await connection.close();
  });

  it('TODO: checkout', async () => {
    // TODO: checkout
  });
});
