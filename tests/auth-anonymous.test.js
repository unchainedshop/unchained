const {
  setupDatabase,
  createAdminApolloFetch,
  createAnonymousApolloFetch
} = require('./helpers');

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

  it('login with password and logout', async () => {
    const { data: { loginWithPassword } = {} } = await apolloFetch({
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

  it('forgot/reset password', async () => {
    const { data: { forgotPassword } = {} } = await apolloFetch({
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
    const {
      services: {
        password: {
          reset: { token }
        }
      }
    } = user;

    // Reset the password with that token
    const { data: { resetPassword } = {} } = await apolloFetch({
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

  it('TODO: sign up', async () => {
    // TODO: Sign Up / createUser
  });
});
