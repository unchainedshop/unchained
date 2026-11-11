import {
  setupDatabase,
  createAnonymousGraphqlFetch,
  createLoggedInGraphqlFetch,
  disconnect,
  getServerBaseUrl,
} from './helpers.js';
import { User, ADMIN_TOKEN } from './seeds/users.js';
import assert from 'node:assert';
import test from 'node:test';

let db;
let graphqlFetch;
let adminGraphqlFetch;
let Users;

test.describe('Auth for anonymous users', () => {
  test.before(async () => {
    [db] = await setupDatabase();
    graphqlFetch = createAnonymousGraphqlFetch();
    adminGraphqlFetch = createLoggedInGraphqlFetch(ADMIN_TOKEN);
    Users = db.collection('users');
  });

  test.after(async () => {
    await disconnect();
  });

  test.describe('Mutation.loginAsGuest', () => {
    test('login as guest', async () => {
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

  test.describe('Mutation.createUser', () => {
    test('create a new user', async () => {
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

  test('ends other sessions when the password changes', async () => {
    const baseUrl = getServerBaseUrl();
    const post = async (query, cookie) => {
      const response = await fetch(`${baseUrl}/graphql`, {
        method: 'POST',
        headers: { 'content-type': 'application/json', ...(cookie ? { cookie } : {}) },
        body: JSON.stringify({ query }),
      });
      const sessionCookie = response.headers
        .getSetCookie()
        .map((value) => value.split(';')[0])
        .filter((value) => value.split('=')[1])
        .pop();
      return { sessionCookie, body: await response.json() };
    };
    const login = () =>
      post('mutation { loginWithPassword(username: "admin", password: "password") { _id } }');

    const stolen = (await login()).sessionCookie;
    const owner = (await login()).sessionCookie;

    const changed = await post(
      'mutation { changePassword(oldPassword: "password", newPassword: "password") { success } }',
      owner,
    );
    assert.strictEqual(changed.body.data.changePassword.success, true);

    // The other session is gone, the caller keeps a working one.
    const replayed = await post('{ me { _id } }', stolen);
    assert.strictEqual(replayed.body.data.me, null);

    const stillValid = await post('{ me { _id } }', changed.sessionCookie);
    assert.strictEqual(stillValid.body.data.me._id, 'admin');
  });

  test.describe('Mutation.loginWithPassword', () => {
    test('login via username and password', async () => {
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

    test('replaces a legacy bcrypt hash and keeps the rest of the password service', async () => {
      const reset = [{ token: 'pending-reset', address: 'bcrypt@unchained.local', when: new Date() }];
      await Users.insertOne({
        ...User,
        _id: 'bcryptuser',
        username: 'bcryptuser',
        emails: [{ address: 'bcrypt@unchained.local', verified: true }],
        initialPassword: true,
        services: { password: { ...User.services.password, reset } },
      });
      const login = () =>
        graphqlFetch({
          query: /* GraphQL */ `
            mutation {
              loginWithPassword(username: "bcryptuser", password: "password") {
                user {
                  _id
                }
              }
            }
          `,
        });

      assert.strictEqual((await login()).data?.loginWithPassword.user._id, 'bcryptuser');
      const { services, initialPassword } = await Users.findOne({ _id: 'bcryptuser' });
      assert.strictEqual(services.password.bcrypt, undefined);
      assert.match(services.password.pbkdf2, /^[0-9a-f]{32}:[0-9a-f]{64}$/);
      assert.deepStrictEqual(services.password.reset, reset);
      assert.strictEqual(initialPassword, true);
      assert.strictEqual((await login()).data?.loginWithPassword.user._id, 'bcryptuser');
    });
  });

  test.describe('Mutation.forgotPassword', () => {
    test.before(async () => {
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

    test('create a reset token', async () => {
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

  test.describe('Mutation.resetPassword', () => {
    test.before(async () => {
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

    test('create a reset token', async () => {
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

    test('change password with token from forgotPassword call', async () => {
      // Reset the password with that token
      const Events = db.collection('events');
      const event = await Events.findOne({
        'payload.userId': 'userthatforgetspasswords',
        'payload.action': 'reset-password',
      });

      const token = event.payload.token;

      const { data } = await graphqlFetch({
        query: /* GraphQL */ `
          mutation resetPassword($newPassword: String!, $token: String!) {
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
      assert.partialDeepStrictEqual(data?.resetPassword, {
        user: {
          _id: 'userthatforgetspasswords',
        },
      });
    });
  });
});
