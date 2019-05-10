import { setupDatabase, createAnonymousGraphqlFetch } from './helpers';

let connection;
let db;
let graphqlFetch;

describe('authentication', () => {
  beforeAll(async () => {
    [db, connection] = await setupDatabase();
    graphqlFetch = await createAnonymousGraphqlFetch();
  });

  afterAll(async () => {
    await connection.close();
  });

  it('TODO: change password', async () => {
    // TODO: Change password
  });
});
