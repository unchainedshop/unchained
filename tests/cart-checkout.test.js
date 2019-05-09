const { setupDatabase, createAdminApolloFetch } = require('./helpers');

let connection;
let db;
let apolloFetch;

describe('cart checkout', () => {
  beforeAll(async () => {
    [db, connection] = await setupDatabase();
    apolloFetch = await createAdminApolloFetch();
  });

  afterAll(async () => {
    await connection.close();
  });

  it('TODO: checkout', async () => {
    // TODO: checkout
  });
});
