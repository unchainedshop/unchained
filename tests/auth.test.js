const { setupDatabase, createAdminApolloFetch } = require('./helpers');

let connection;
let db;
let apolloFetch;

describe('authentication', () => {
  beforeAll(async () => {
    [db, connection] = await setupDatabase();
    apolloFetch = await createAdminApolloFetch();
  });

  afterAll(async () => {
    await connection.close();
  });

  it('login with password', async () => {
    const { data } = await apolloFetch({
      query: /* GraphQL */ `
        mutation {
          loginWithPassword(username: "admin", plainPassword: "password") {
            id
          }
        }
      `
    });
    expect(data).toEqual({
      loginWithPassword: {
        id: 'admin'
      }
    });
  });
});
