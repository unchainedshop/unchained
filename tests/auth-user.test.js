import { setupDatabase, createLoggedInGraphqlFetch } from './helpers.js';
import { User, Admin, USER_TOKEN, ADMIN_TOKEN } from './seeds/users.js';
import assert from 'node:assert';
import { describe, it, before } from 'node:test';

let db;
let graphqlFetch;
let adminGraphqlFetch;

describe('Auth for logged in users', () => {
  before(async () => {
    [db] = await setupDatabase();
    graphqlFetch = createLoggedInGraphqlFetch(USER_TOKEN);
    adminGraphqlFetch = createLoggedInGraphqlFetch(ADMIN_TOKEN);
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
        `,
      });
      assert.deepStrictEqual(me, {
        _id: User._id,
        profile: {
          gender: 'm',
        },
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
        `,
      });
      assert.deepStrictEqual(user, {
        _id: User._id,
      });
    });

    it('does not allow a user to just retrieve data of other users', async () => {
      const { errors } = await graphqlFetch({
        query: /* GraphQL */ `
          query ($userId: ID) {
            user(userId: $userId) {
              _id
            }
          }
        `,
        variables: {
          userId: Admin._id,
        },
      });
      assert.strictEqual(errors[0].extensions?.code, 'NoPermissionError');
    });
  });

  describe('Mutation.changePassword', () => {
    it('change own password as user', async () => {
      const { data: { changePassword } = {} } = await graphqlFetch({
        query: /* GraphQL */ `
          mutation {
            changePassword(oldPassword: "password", newPassword: "password") {
              success
            }
          }
        `,
      });
      assert.deepStrictEqual(changePassword, {
        success: true,
      });
    });
  });

  describe('Mutation.sendVerificationEmail', () => {
    it('send verification e-mail', async () => {
      const { data: { sendVerificationEmail } = {} } = await graphqlFetch({
        query: /* GraphQL */ `
          mutation {
            sendVerificationEmail(email: "user@unchained.local") {
              success
            }
          }
        `,
      });
      assert.deepStrictEqual(sendVerificationEmail, {
        success: true,
      });
    });

    it('cannot send a verification e-mail to an e-mail not owned by the logged in user', async () => {
      const { data: { sendVerificationEmail } = {} } = await graphqlFetch({
        query: /* GraphQL */ `
          mutation {
            sendVerificationEmail(email: "admin@unchained.local") {
              success
            }
          }
        `,
      });
      assert.strictEqual(sendVerificationEmail, null);
    });
  });

  describe('Mutation.verifyEmail', () => {
    before(async () => {
      const Users = db.collection('users');
      const userCopy = {
        ...User,
        username: `${User.username}${Math.random()}`,
      };
      delete userCopy._id;
      await Users.findOneAndUpdate(
        { _id: 'userthatmustverifyemail' },
        {
          $setOnInsert: {
            ...userCopy,
            emails: [
              {
                address: 'userthatmustverifyemail@unchained.local',
                verified: false,
              },
            ],
          },
        },
        {
          upsert: true,
        },
      );
    });

    it('create a verification token', async () => {
      const { data: { sendVerificationEmail } = {} } = await adminGraphqlFetch({
        query: /* GraphQL */ `
          mutation {
            sendVerificationEmail(email: "userthatmustverifyemail@unchained.local") {
              success
            }
          }
        `,
      });
      assert.deepStrictEqual(sendVerificationEmail, {
        success: true,
      });
    });

    it('verifies the e-mail of user', async () => {
      // Reset the password with that token
      const Events = db.collection('events');
      const event = await Events.findOne({
        'payload.userId': 'userthatmustverifyemail',
        'payload.action': 'verify-email',
      });

      const token = event.payload.token;

      const { data: { verifyEmail } = {} } = await graphqlFetch({
        query: /* GraphQL */ `
          mutation verifyEmail($token: String!) {
            verifyEmail(token: $token) {
              _id
              user {
                _id
              }
            }
          }
        `,
        variables: {
          token,
        },
      });
      assert.deepStrictEqual(verifyEmail, {
        user: {
          _id: 'userthatmustverifyemail',
        },
      });
    });

    it('e-mail is tagged as verified', async () => {
      // Reset the password with that token
      const Users = db.collection('users');
      const user = await Users.findOne({
        _id: 'userthatmustverifyemail',
      });

      assert.strictEqual(user.emails[0].verified, true);
    });
  });

  describe('Mutation.setUsername for normal user should', () => {
    it('return NoPermissionError', async () => {
      const { errors } = await graphqlFetch({
        query: /* GraphQL */ `
          mutation setUsername($username: String!, $userId: ID!) {
            setUsername(username: $username, userId: $userId) {
              _id
            }
          }
        `,
        variables: {
          userId: Admin._id,
          username: 'admin-updated',
        },
      });
      assert.strictEqual(errors[0]?.extensions?.code, 'NoPermissionError');
    });
  });

  describe('Mutation.logout', () => {
    it.skip('log out userthatlogsout', async () => {
      const Users = db.collection('users');
      await Users.findOrInsertOne({
        ...User,
        _id: 'userthatlogsout',
        username: 'userthatlogsout',
        emails: [
          {
            address: 'userthatlogsout@unchained.local',
            verified: true,
          },
        ],
        services: {
          ...User.services,
          resume: {
            loginTokens: [
              {
                when: new Date(),
                hashedToken: 'dF4ilYpWpsSvkb7hdZKqsiYa207t2HI+C+HJcowykZk=',
              },
            ],
          },
        },
      });
      const { data: { logout } = {} } = await graphqlFetch({
        query: /* GraphQL */ `
          mutation logout {
            logout {
              success
            }
          }
        `,
      });
      assert.deepStrictEqual(logout, {
        success: true,
      });
      const user = await Users.findOne({
        _id: 'userthatlogsout',
      });
      const {
        services: {
          resume: { loginTokens },
        },
      } = user;
      assert.strictEqual(loginTokens.length, 1);
    });

    it.skip('log out userthatlogsout without explicit token', async () => {
      const Users = db.collection('users');
      await Users.findOrInsertOne({
        ...User,
        _id: 'userthatlogsout',
        username: 'userthatlogsout',
        emails: [
          {
            address: 'userthatlogsout@unchained.local',
            verified: true,
          },
        ],
        services: {
          ...User.services,
          resume: {
            loginTokens: [
              {
                when: new Date(),
                hashedToken: 'dF4ilYpWpsSvkb7hdZKqsiYa207t2HI+C+HJcowykZk=',
              },
            ],
          },
        },
      });
      const { data: { logout } = {} } = await graphqlFetch({
        query: /* GraphQL */ `
          mutation logout {
            logout {
              success
            }
          }
        `,
        variables: {
          token: 'FWhglvqdNkNX80jZMJ61FvDUkKzCsESVfbui9H8Fg27',
        },
      });
      assert.deepStrictEqual(logout, {
        success: true,
      });
      const user = await Users.findOne({
        _id: 'userthatlogsout',
      });
      const {
        services: {
          resume: { loginTokens },
        },
      } = user;
      assert.strictEqual(loginTokens.length, 1);
    });
  });
});
