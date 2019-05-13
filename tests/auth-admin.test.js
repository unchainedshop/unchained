import { setupDatabase, createLoggedInGraphqlFetch } from './helpers';
import { Admin, ADMIN_TOKEN } from './seeds/users';

let connection;
let db;
let graphqlFetch;

/* TODO:
- updateUserAvatar
- updateEmail
- updateUserTags
- updateUserProfile
- enrollUser
- setPassword
- setRoles
*/

describe('Auth for admin users', () => {
  beforeAll(async () => {
    [db, connection] = await setupDatabase();
    graphqlFetch = await createLoggedInGraphqlFetch(ADMIN_TOKEN);
  });

  afterAll(async () => {
    await connection.close();
  });

  describe('Query.users', () => {
    it('returns the 2 default users', async () => {
      const { data: { users } = {} } = await graphqlFetch({
        query: /* GraphQL */ `
          query {
            users {
              _id
              name
            }
          }
        `
      });
      expect(users.length).toEqual(2);
    });
  });
});
