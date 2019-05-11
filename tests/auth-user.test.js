import { setupDatabase, createLoggedInGraphqlFetch } from './helpers';
import { USER_TOKEN } from './seeds/users';

let connection;
let db;
let graphqlFetch;

describe('Auth for logged in users', () => {
  beforeAll(async () => {
    [db, connection] = await setupDatabase();
    graphqlFetch = await createLoggedInGraphqlFetch(USER_TOKEN);
  });

  afterAll(async () => {
    await connection.close();
  });

  describe('Mutation.changePassword', () => {
    it('change own password as user', async () => {
      const { data: { changePassword } = {} } = await graphqlFetch({
        query: /* GraphQL */ `
          mutation {
            changePassword(
              oldPlainPassword: "password"
              newPlainPassword: "password"
            ) {
              success
            }
          }
        `
      });
      expect(changePassword).toMatchObject({
        success: true
      });
    });
  });
});
