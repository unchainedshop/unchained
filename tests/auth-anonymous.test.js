import { setupDatabase, createAnonymousGraphqlFetch } from './helpers';

let connection;
let db;
let graphqlFetch;

describe('Auth for anonymous users', () => {
  beforeAll(async () => {
    [db, connection] = await setupDatabase();
    graphqlFetch = await createAnonymousGraphqlFetch();
  });

  afterAll(async () => {
    await connection.close();
  });

  describe('Mutation.loginWithPassword', () => {
    it('login via username and password', async () => {
      const { data: { loginWithPassword } = {} } = await graphqlFetch({
        query: /* GraphQL */ `
          mutation {
            loginWithPassword(username: "admin", plainPassword: "password") {
              id
              token
            }
          }
        `
      });
      expect(loginWithPassword).toMatchObject({
        id: 'admin'
      });
    });
  });

  describe('Mutation.forgotPassword', () => {
    let token;

    it('create a reset token', async () => {
      const { data: { forgotPassword } = {} } = await graphqlFetch({
        query: /* GraphQL */ `
          mutation {
            forgotPassword(email: "user@localhost") {
              success
            }
          }
        `
      });
      expect(forgotPassword).toEqual({
        success: true
      });

      // Get the token which is sent via E-Mail
      const Users = db.collection('users');
      const user = await Users.findOne({ 'emails.address': 'user@localhost' });
      ({
        services: {
          password: {
            reset: { token }
          }
        }
      } = user);
    });

    it('change password with token', async () => {
      // Reset the password with that token
      const { data: { resetPassword } = {} } = await graphqlFetch({
        query: /* GraphQL */ `
          mutation resetPassword($newPlainPassword: String, $token: String!) {
            resetPassword(newPlainPassword: $newPlainPassword, token: $token) {
              id
              token
              user {
                _id
              }
            }
          }
        `,
        variables: {
          newPlainPassword: 'password',
          token
        }
      });
      expect(resetPassword).toMatchObject({
        id: 'user',
        user: {
          _id: 'user'
        }
      });
    });
  });
});
