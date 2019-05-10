import { setupDatabase, createAnonymousApolloFetch } from './helpers';

let connection;
let db;
let apolloFetch;

describe('authentication', () => {
  beforeAll(async () => {
    [db, connection] = await setupDatabase();
    apolloFetch = await createAnonymousApolloFetch();
  });

  afterAll(async () => {
    await connection.close();
  });

  it('TODO: change password', async () => {
    // TODO: Change password
  });
});
