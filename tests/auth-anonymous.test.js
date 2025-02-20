import { setupDatabase, createAnonymousGraphqlFetch, createLoggedInGraphqlFetch } from './helpers.js';
import { User, ADMIN_TOKEN } from './seeds/users.js';
import assert from 'node:assert';
import { describe, it, before } from 'node:test';

let db;
let graphqlFetch;
let adminGraphqlFetch;
let Users;

describe('Auth for anonymous users', () => {
  before(async () => {
    [db] = await setupDatabase();
    graphqlFetch = createAnonymousGraphqlFetch();
    adminGraphqlFetch = createLoggedInGraphqlFetch(ADMIN_TOKEN);
    Users = db.collection('users');
  });

  describe('Mutation.loginAsGuest', () => {
    it('login as guest', async () => {
      // ensure no e-mail verification gets sent
      const result = await graphqlFetch({
        query: /* GraphQL */ `
          mutation {
            loginAsGuest {
              _id
              user {
                isGuest
              }
            }
          }
        `,
      });
      const { data: { workQueue } = {} } = await adminGraphqlFetch({
        query: /* GraphQL */ `
          query {
            workQueue {
              _id
              type
              status
            }
          }
        `,
        variables: {},
      });
      const work = workQueue.filter(({ type, status }) => type === 'MESSAGE' && status === 'SUCCESS');
      assert.strictEqual(work.length, 0);
      assert.ok(result.data.loginAsGuest);
      assert.ok(result.data.loginAsGuest?.user?.isGuest);
    });
  });

  describe('Mutation.createUser', () => {
    it('create a new user', async () => {
      const birthday = new Date().toISOString().split('T')[0];
      const { data } = await graphqlFetch({
        query: /* GraphQL */ `
          mutation createUser(
            $username: String
            $email: String
            $password: String
            $profile: UserProfileInput
          ) {
            createUser(username: $username, email: $email, password: $password, profile: $profile) {
              _id
              user {
                _id
                username
                primaryEmail {
                  address
                }
                profile {
                  birthday
                  displayName
                  phoneMobile
                  gender
                }
              }
            }
          }
        `,
        variables: {
          username: 'newuser',
          email: 'newuser@unchained.local',
          password: 'password',
          profile: {
            displayName: 'New User',
            birthday,
            phoneMobile: '+410000000',
            gender: 'm',
            address: null,
          },
        },
      });
      assert.partialDeepStrictEqual(data.createUser, {
        user: {
          username: 'newuser',
          primaryEmail: {
            address: 'newuser@unchained.local',
          },
          profile: {
            displayName: 'New User',
            birthday,
            phoneMobile: '+410000000',
            gender: 'm',
          },
        },
      });
    });
  });

  describe('Mutation.loginWithPassword', () => {
    it('login via username and password', async () => {
      const { data: { loginWithPassword } = {} } = await graphqlFetch({
        query: /* GraphQL */ `
          mutation {
            loginWithPassword(username: "admin", password: "password") {
              _id
              user {
                _id
                username
              }
            }
          }
        `,
      });
      assert.partialDeepStrictEqual(loginWithPassword, {
        user: {
          _id: 'admin',
          username: 'admin',
        },
      });
    });
  });

  describe('Mutation.forgotPassword', () => {
    before(async () => {
      const user = await Users.findOne({ _id: 'userthatforgetspasswords' });
      if (!user) {
        await Users.insertOne({
          ...User,
          _id: 'userthatforgetspasswords',
          username: `${User.username}${Math.random()}`,
          emails: [
            {
              address: 'userthatforgetspasswords@unchained.local',
              verified: true,
            },
          ],
        });
      }
    });

    it('create a reset token', async () => {
      const { data: { forgotPassword } = {} } = await graphqlFetch({
        query: /* GraphQL */ `
          mutation {
            forgotPassword(email: "userthatforgetspasswords@unchained.local") {
              success
            }
          }
        `,
      });
      assert.deepStrictEqual(forgotPassword, {
        success: true,
      });
    });
  });

  describe('Mutation.resetPassword', () => {
    before(async () => {
      const userCopy = {
        ...User,
        username: `${User.username}${Math.random()}`,
      };
      delete userCopy._id;
      await Users.findOneAndUpdate(
        { _id: 'userthatforgetspasswords' },
        {
          $setOnInsert: {
            ...userCopy,
            emails: [
              {
                address: 'userthatforgetspasswords@unchained.local',
                verified: true,
              },
            ],
          },
        },
        {
          returnDocument: 'after',
          upsert: true,
        },
      );
    });

    it('create a reset token', async () => {
      const { data: { forgotPassword } = {} } = await graphqlFetch({
        query: /* GraphQL */ `
          mutation {
            forgotPassword(email: "userthatforgetspasswords@unchained.local") {
              success
            }
          }
        `,
      });
      assert.deepStrictEqual(forgotPassword, {
        success: true,
      });
    });

    it('change password with token from forgotPassword call', async () => {
      // Reset the password with that token
      const Events = db.collection('events');
      const event = await Events.findOne({
        'payload.userId': 'userthatforgetspasswords',
        'payload.action': 'reset-password',
      });

      const token = event.payload.token;

      const { data: { resetPassword } = {} } = await graphqlFetch({
        query: /* GraphQL */ `
          mutation resetPassword($newPassword: String, $token: String!) {
            resetPassword(newPassword: $newPassword, token: $token) {
              _id
              user {
                _id
              }
            }
          }
        `,
        variables: {
          newPassword: 'password',
          token,
        },
      });
      assert.partialDeepStrictEqual(resetPassword, {
        user: {
          _id: 'userthatforgetspasswords',
        },
      });
    });
  });
});
