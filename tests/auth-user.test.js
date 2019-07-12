import { setupDatabase, createLoggedInGraphqlFetch } from './helpers';
import { User, Admin, USER_TOKEN } from './seeds/users';

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

  describe('Query.me', () => {
    it('returns currently logged in user', async () => {
      const { data: { me } = {} } = await graphqlFetch({
        query: /* GraphQL */ `
          query {
            me {
              _id
              name
              profile {
                gender
              }
            }
          }
        `
      });
      expect(me).toMatchObject({
        _id: User._id,
        profile: {
          gender: 'm'
        }
      });
    });
  });

  describe('Query.user', () => {
    it('returns currently logged in user when no userId provided', async () => {
      const { data: { user } = {} } = await graphqlFetch({
        query: /* GraphQL */ `
          query {
            user {
              _id
              name
            }
          }
        `
      });
      expect(user).toMatchObject({
        _id: User._id
      });
    });
    it('does not allow a user to just retrieve data of other users', async () => {
      const { errors } = await graphqlFetch({
        query: /* GraphQL */ `
          query($userId: ID) {
            user(userId: $userId) {
              _id
            }
          }
        `,
        variables: {
          userId: Admin._id
        }
      });
      expect(errors.length).toEqual(1);
    });
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

  describe('Mutation.resendVerificationEmail', () => {
    it('resend verification e-mail', async () => {
      const { data: { resendVerificationEmail } = {} } = await graphqlFetch({
        query: /* GraphQL */ `
          mutation {
            resendVerificationEmail(email: "user@localhost") {
              success
            }
          }
        `
      });
      expect(resendVerificationEmail).toMatchObject({
        success: true
      });
    });
  });

  describe('Mutation.verifyEmail', () => {
    it('verifies the e-mail of user', async () => {
      // Reset the password with that token
      const Users = db.collection('users');
      const user = await Users.findOne({
        _id: 'user'
      });

      const {
        services: {
          email: {
            verificationTokens: [{ token }]
          }
        }
      } = user;

      const { data: { verifyEmail } = {} } = await graphqlFetch({
        query: /* GraphQL */ `
          mutation verifyEmail($token: String!) {
            verifyEmail(token: $token) {
              id
              token
              user {
                _id
              }
            }
          }
        `,
        variables: {
          token
        }
      });
      expect(verifyEmail).toMatchObject({
        user: {}
      });
    });
    it('e-mail is tagged as verified', async () => {
      // Reset the password with that token
      const Users = db.collection('users');
      const user = await Users.findOne({
        _id: 'user'
      });

      expect(user.emails[0].verified).toEqual(true);
    });
  });

  describe('Mutation.logout', () => {
    it('log out userthatlogsout', async () => {
      const Users = db.collection('users');
      await Users.findOrInsertOne({
        ...User,
        _id: 'userthatlogsout',
        username: 'userthatlogsout',
        emails: [
          {
            address: 'userthatlogsout@localhost',
            verified: true
          }
        ],
        services: {
          ...User.services,
          resume: {
            loginTokens: [
              {
                when: new Date(new Date().getTime() + 1000000),
                hashedToken: 'dF4ilYpWpsSvkb7hdZKqsiYa207t2HI+C+HJcowykZk='
              }
            ]
          }
        }
      });
      const { data: { logout } = {} } = await graphqlFetch({
        query: /* GraphQL */ `
          mutation logout($token: String!) {
            logout(token: $token) {
              success
            }
          }
        `,
        variables: {
          token: 'FWhglvqdNkNX80jZMJ61FvDUkKzCsESVfbui9H8Fg27'
        }
      });
      expect(logout).toMatchObject({
        success: true
      });
    });
    it('token is gone', async () => {
      // Reset the password with that token
      const Users = db.collection('users');
      const user = await Users.findOne({
        _id: 'userthatlogsout'
      });
      const {
        services: {
          resume: { loginTokens }
        }
      } = user;
      expect(loginTokens.length).toEqual(1);
    });
  });
});
