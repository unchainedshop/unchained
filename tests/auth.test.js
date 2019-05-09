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

  it('login with password and logout', async () => {
    const { data: { loginWithPassword } = {} } = await apolloFetch({
      query: /* GraphQL */ `
        mutation {
          loginWithPassword(username: "admin", plainPassword: "password") {
            id
          }
        }
      `
    });
    expect(loginWithPassword).toEqual({
      id: 'admin'
    });
  });

  it('forgot/reset password', async () => {
    const { data: { forgotPassword } = {} } = await apolloFetch({
      query: /* GraphQL */ `
        mutation {
          forgotPassword(email: "admin@localhost") {
            success
          }
        }
      `
    });
    expect(forgotPassword).toEqual({
      success: true
    });
    const Users = db.collection('users');
    const user = await Users.findOne({ 'emails.address': 'admin@localhost' });
    const {
      services: {
        password: {
          reset: { token }
        }
      }
    } = user;

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
      id: 'admin',
      user: {
        _id: 'admin'
      }
    });
  });

  it('TODO: change password', async () => {
    // TODO: Change password
  });

  it('TODO: sign up', async () => {
    // TODO: Sign Up / createUser
  });
});
