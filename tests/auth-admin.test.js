import {
  setupDatabase,
  createLoggedInGraphqlFetch,
  createAnonymousGraphqlFetch,
  disconnect,
} from './helpers.js';
import { Admin, ADMIN_TOKEN, User, USER_TOKEN } from './seeds/users';
import { intervalUntilTimeout } from './lib/wait';
import assert from 'node:assert';
import test from 'node:test';

let db;
let graphqlFetchAsAdminUser;
let graphqlFetchAsAnonymousUser;
let graphqlFetchAsNormalUser;
let Users;

test.describe('Auth for admin users', () => {
  test.before(async () => {
    [db] = await setupDatabase();
    graphqlFetchAsAdminUser = createLoggedInGraphqlFetch(ADMIN_TOKEN);
    graphqlFetchAsNormalUser = createLoggedInGraphqlFetch(USER_TOKEN);
    graphqlFetchAsAnonymousUser = createAnonymousGraphqlFetch();
    Users = db.collection('users');
  });

  test.after(async () => {
    await disconnect();
  });

  test.describe('Query.users', () => {
    test.before(async () => {
      await Users.findOrInsertOne({
        ...User,
        _id: 'guest2',
        username: 'guest2',
        guest: true,
        emails: [
          {
            address: 'guest2@unchained.local',
            verified: true,
          },
        ],
      });
    });

    test('returns the 2 default users', async () => {
      const { data: { users } = {} } = await graphqlFetchAsAdminUser({
        query: /* GraphQL */ `
          query {
            users {
              _id
              name
            }
          }
        `,
      });
      assert.deepStrictEqual(users, [
        { _id: 'admin', name: 'admin@unchained.local' },
        { _id: 'user', name: 'user@unchained.local' },
      ]);
    });
    test('returns 2 additional guest when using includeGuests', async () => {
      const { data: { users } = {} } = await graphqlFetchAsAdminUser({
        query: /* GraphQL */ `
          query {
            users(includeGuests: true) {
              _id
              name
            }
          }
        `,
      });
      assert.deepStrictEqual(users, [
        { _id: 'admin', name: 'admin@unchained.local' },
        { _id: 'user', name: 'user@unchained.local' },
        { _id: 'guest', name: 'guest@unchained.local' },
        { _id: 'guest2', name: 'guest2@unchained.local' },
      ]);
    });

    test('returns users by queryString', async () => {
      const { data: { users } = {} } = await graphqlFetchAsAdminUser({
        query: /* GraphQL */ `
          query users($queryString: String) {
            users(queryString: $queryString, includeGuests: true) {
              _id
              name
            }
          }
        `,
        variables: {
          queryString: 'guest',
        },
      });
      assert.strictEqual(users.length, 1);
      assert.deepStrictEqual(users[0], {
        _id: 'guest',
        name: 'guest@unchained.local',
      });
    });
  });

  test.describe('Query.user', () => {
    test.before(async () => {
      await Users.findOrInsertOne({
        ...User,
        _id: 'guest',
        guest: true,
        emails: [
          {
            address: 'guest@unchained.local',
            verified: true,
          },
        ],
      });
    });

    test('returns foreign user by id', async () => {
      const { data: { user } = {} } = await graphqlFetchAsAdminUser({
        query: /* GraphQL */ `
          query user($userId: ID) {
            user(userId: $userId) {
              _id
              name
            }
          }
        `,
        variables: {
          userId: User._id,
        },
      });
      assert.partialDeepStrictEqual(user, {
        _id: User._id,
      });
    });
  });

  test.describe('Query.usersCount for admin user', () => {
    test('returns the 2 default users', async () => {
      const {
        data: { usersCount },
      } = await graphqlFetchAsAdminUser({
        query: /* GraphQL */ `
          query {
            usersCount
          }
        `,
      });
      assert.strictEqual(usersCount, 2);
    });
    test('returns 3  when using includeGuests', async () => {
      const {
        data: { usersCount },
      } = await graphqlFetchAsAdminUser({
        query: /* GraphQL */ `
          query {
            usersCount(includeGuests: true)
          }
        `,
      });
      assert.strictEqual(usersCount, 4);
    });

    test('returns 1 for queryString guest', async () => {
      const {
        data: { usersCount },
      } = await graphqlFetchAsAdminUser({
        query: /* GraphQL */ `
          query usersCount($queryString: String) {
            usersCount(queryString: $queryString, includeGuests: true)
          }
        `,
        variables: {
          queryString: 'guest',
        },
      });
      assert.strictEqual(usersCount, 1);
    });
  });

  test.describe('Query.usersCount for anonymous user', () => {
    test('return NoPermissionError', async () => {
      const { errors } = await graphqlFetchAsAnonymousUser({
        query: /* GraphQL */ `
          query {
            usersCount
          }
        `,
      });
      assert.strictEqual(errors[0]?.extensions?.code, 'NoPermissionError');
    });
  });

  test.describe('Query.usersCount for loged in user', () => {
    test('return NoPermissionError', async () => {
      const { errors } = await graphqlFetchAsNormalUser({
        query: /* GraphQL */ `
          query {
            usersCount
          }
        `,
      });
      assert.strictEqual(errors[0]?.extensions?.code, 'NoPermissionError');
    });
  });

  test.describe('Mutation.addEmail', () => {
    test('add an e-mail to a foreign user', async () => {
      const email = 'newuser2@unchained.local';
      const { data: { addEmail } = {} } = await graphqlFetchAsAdminUser({
        query: /* GraphQL */ `
          mutation addEmail($email: String!, $userId: ID) {
            addEmail(email: $email, userId: $userId) {
              _id
              emails {
                address
                verified
              }
            }
          }
        `,
        variables: {
          userId: User._id,
          email,
        },
      });

      assert.partialDeepStrictEqual(addEmail, {
        _id: User._id,
        emails: [
          {
            address: email,
            verified: false,
          },
        ],
      });
    });
  });

  test.describe('Mutation.removeEmail', () => {
    test('remove an e-mail of a foreign user', async () => {
      const email = 'newuser2@unchained.local';
      const { data: { removeEmail } = {} } = await graphqlFetchAsAdminUser({
        query: /* GraphQL */ `
          mutation removeEmail($email: String!, $userId: ID) {
            removeEmail(email: $email, userId: $userId) {
              _id
              emails {
                address
                verified
              }
            }
          }
        `,
        variables: {
          userId: User._id,
          email,
        },
      });

      assert.ok(!removeEmail?.emails?.find((e) => e.address === email));
    });
  });

  test.describe('Mutation.setUserTags', () => {
    test('update the tags of myself as admin', async () => {
      const tags = ['new-tag'];
      const { data: { setUserTags } = {} } = await graphqlFetchAsAdminUser({
        query: /* GraphQL */ `
          mutation setUserTags($tags: [LowerCaseString]!, $userId: ID!) {
            setUserTags(tags: $tags, userId: $userId) {
              _id
              tags
            }
          }
        `,
        variables: {
          userId: Admin._id,
          tags,
        },
      });
      assert.deepStrictEqual(setUserTags, {
        _id: Admin._id,
        tags,
      });
    });

    test('return not found error when passed non existing userId', async () => {
      const tags = ['new-tag'];
      const { errors } = await graphqlFetchAsAdminUser({
        query: /* GraphQL */ `
          mutation setUserTags($tags: [LowerCaseString]!, $userId: ID!) {
            setUserTags(tags: $tags, userId: $userId) {
              _id
              tags
            }
          }
        `,
        variables: {
          userId: 'non-existing-id',
          tags,
        },
      });
      assert.strictEqual(errors[0]?.extensions?.code, 'UserNotFoundError');
    });

    test('return error when passed invalid userId', async () => {
      const tags = ['new-tag'];
      const { errors } = await graphqlFetchAsAdminUser({
        query: /* GraphQL */ `
          mutation setUserTags($tags: [LowerCaseString]!, $userId: ID!) {
            setUserTags(tags: $tags, userId: $userId) {
              _id
              tags
            }
          }
        `,
        variables: {
          userId: '',
          tags,
        },
      });
      assert.strictEqual(errors[0]?.extensions?.code, 'InvalidIdError');
    });
  });

  test.describe('Mutation.updateUserProfile', () => {
    test('update the profile of a foreign user', async () => {
      const profile = {
        displayName: 'Administratörli',
        birthday: new Date('2037-01-02'),
        phoneMobile: '+414114141',
        gender: 'm',
        address: {
          firstName: 'P',
          lastName: 'K',
        },
      };
      const { data: { updateUserProfile } = {} } = await graphqlFetchAsAdminUser({
        query: /* GraphQL */ `
          mutation updateUserProfile($profile: UserProfileInput!, $userId: ID) {
            updateUserProfile(profile: $profile, userId: $userId) {
              _id
              name
              profile {
                birthday
                displayName
                phoneMobile
                gender
                birthday
                address {
                  firstName
                  lastName
                }
              }
            }
          }
        `,
        variables: {
          userId: User._id,
          profile,
        },
      });
      assert.deepStrictEqual(updateUserProfile, {
        _id: User._id,
        name: profile.displayName,
        profile: {
          ...profile,
          birthday: '2037-01-02',
        },
      });
    });
  });

  test.describe('Mutation.enrollUser', () => {
    test('enroll a user without a password', async () => {
      const profile = {
        displayName: 'Admin3',
      };
      const email = 'admin3@unchained.local';
      const password = null;
      const { data: { enrollUser } = {} } = await graphqlFetchAsAdminUser({
        query: /* GraphQL */ `
          mutation enrollUser($email: String!, $password: String, $profile: UserProfileInput!) {
            enrollUser(email: $email, password: $password, profile: $profile) {
              _id
              isInitialPassword
              primaryEmail {
                address
                verified
              }
            }
          }
        `,
        variables: {
          email,
          password,
          profile,
        },
      });

      assert.partialDeepStrictEqual(enrollUser, {
        isInitialPassword: true,
        primaryEmail: {
          address: email,
          verified: false,
        },
      });

      const work = await intervalUntilTimeout(async () => {
        const w2 = await db
          .collection('work_queue')
          .find({ type: 'EMAIL', 'input.to': email, retries: 20 })
          .toArray();
        if (w2?.length) return w2;
        return false;
      }, 5000);

      // length of two means only the enrollment got triggered
      assert.strictEqual(work.length, 1);
    }, 10000);

    test('should fire off the enrollment email', async () => {
      const email = 'admin3@unchained.local';

      const { data: { sendEnrollmentEmail } = {} } = await graphqlFetchAsAdminUser({
        query: /* GraphQL */ `
          mutation sendEnrollmentEmail($email: String!) {
            sendEnrollmentEmail(email: $email) {
              success
            }
          }
        `,
        variables: {
          email,
        },
      });

      assert.deepStrictEqual(sendEnrollmentEmail, {
        success: true,
      });

      const work = await intervalUntilTimeout(async () => {
        const w2 = await db
          .collection('work_queue')
          .find({ type: 'EMAIL', 'input.to': email, retries: 20 })
          .toArray();
        if (w2?.length) return w2;
        return false;
      }, 5000);
      // length of two means only the enrollment got triggered
      assert.strictEqual(work.length, 2);
    }, 10000);

    test('enroll a user with pre-setting a password', async () => {
      const profile = {
        displayName: 'Admin4',
      };
      const email = 'admin4@unchained.local';
      const password = 'admin4-more-chars';
      const { data: { enrollUser } = {} } = await graphqlFetchAsAdminUser({
        query: /* GraphQL */ `
          mutation enrollUser($email: String!, $password: String, $profile: UserProfileInput!) {
            enrollUser(email: $email, password: $password, profile: $profile) {
              _id
              isInitialPassword
              primaryEmail {
                address
                verified
              }
            }
          }
        `,
        variables: {
          email,
          password,
          profile,
        },
      });
      assert.partialDeepStrictEqual(enrollUser, {
        isInitialPassword: true,
        primaryEmail: {
          address: email,
          verified: false,
        },
      });
    });
  });

  test.describe('Mutation.setPassword', () => {
    test('set the password of a foreign user', async () => {
      const newPassword = 'new-passsword';
      const { data: { setPassword } = {} } = await graphqlFetchAsAdminUser({
        query: /* GraphQL */ `
          mutation setPassword($userId: ID!, $newPassword: String!) {
            setPassword(newPassword: $newPassword, userId: $userId) {
              _id
            }
          }
        `,
        variables: {
          userId: User._id,
          newPassword,
        },
      });
      assert.deepStrictEqual(setPassword, {
        _id: User._id,
      });
    });
  });

  test.describe('Mutation.setUsername', () => {
    test('set the username of a foreign user', async () => {
      const username = 'John Doe';
      const { data: { setUsername } = {} } = await graphqlFetchAsAdminUser({
        query: /* GraphQL */ `
          mutation setUsername($userId: ID!, $username: String!) {
            setUsername(username: $username, userId: $userId) {
              username
            }
          }
        `,
        variables: {
          userId: User._id,
          username,
        },
      });

      assert.deepStrictEqual(setUsername, {
        username,
      });
    });
  });

  test.describe('Mutation.setRoles', () => {
    test('set the roles of a foreign user', async () => {
      const roles = ['admin'];
      const { data: { setRoles } = {} } = await graphqlFetchAsAdminUser({
        query: /* GraphQL */ `
          mutation setRoles($userId: ID!, $roles: [String!]!) {
            setRoles(roles: $roles, userId: $userId) {
              _id
              roles
            }
          }
        `,
        variables: {
          userId: User._id,
          roles,
        },
      });
      assert.deepStrictEqual(setRoles, {
        _id: User._id,
        roles,
      });
    });

    test('return error when passed invalid userId', async () => {
      const roles = ['admin'];
      const { errors } = await graphqlFetchAsAdminUser({
        query: /* GraphQL */ `
          mutation setRoles($userId: ID!, $roles: [String!]!) {
            setRoles(roles: $roles, userId: $userId) {
              _id
              roles
            }
          }
        `,
        variables: {
          userId: '',
          roles,
        },
      });
      assert.strictEqual(errors[0]?.extensions?.code, 'InvalidIdError');
    });

    test('return not found error when passed non-existing userId', async () => {
      const roles = ['admin'];
      const { errors } = await graphqlFetchAsAdminUser({
        query: /* GraphQL */ `
          mutation setRoles($userId: ID!, $roles: [String!]!) {
            setRoles(roles: $roles, userId: $userId) {
              _id
              roles
            }
          }
        `,
        variables: {
          userId: 'non-existing',
          roles,
        },
      });
      assert.strictEqual(errors[0]?.extensions?.code, 'UserNotFoundError');
    });
  });

  test.describe('Mutation.setUsername for admin user should', () => {
    test('update guest username successuly for the specified user ID', async () => {
      const { data } = await graphqlFetchAsAdminUser({
        query: /* GraphQL */ `
          mutation setUsername($username: String!, $userId: ID!) {
            setUsername(username: $username, userId: $userId) {
              _id
              username
            }
          }
        `,
        variables: {
          userId: User._id,
          username: 'user-updated',
        },
      });
      assert.strictEqual(data?.setUsername.username, 'user-updated');
    });

    test('return UserNotFoundError when passed non existing user ID', async () => {
      const { errors } = await graphqlFetchAsAdminUser({
        query: /* GraphQL */ `
          mutation setUsername($username: String!, $userId: ID!) {
            setUsername(username: $username, userId: $userId) {
              _id
              username
            }
          }
        `,
        variables: {
          userId: 'non-existing-id',
          username: 'user-updated',
        },
      });
      assert.strictEqual(errors[0]?.extensions?.code, 'UserNotFoundError');
    });

    test('update username for the specified user ID', async () => {
      const {
        data: { setUsername },
      } = await graphqlFetchAsAdminUser({
        query: /* GraphQL */ `
          mutation setUsername($username: String!, $userId: ID!) {
            setUsername(username: $username, userId: $userId) {
              _id
              emails {
                address
                verified
              }
              username
              isGuest
              lastBillingAddress {
                firstName
              }
              cart {
                _id
              }
              avatar {
                _id
              }
              profile {
                displayName
              }
              language {
                _id
              }
              lastContact {
                emailAddress
              }
              primaryEmail {
                address
                verified
              }
              isInitialPassword
              name
              roles
              tags
              orders {
                _id
              }
              quotations {
                _id
              }
              bookmarks {
                _id
              }
              paymentCredentials {
                _id
              }
              enrollments {
                _id
              }
            }
          }
        `,
        variables: {
          userId: Admin._id,
          username: 'admin-updated',
        },
      });
      assert.strictEqual(setUsername.username, 'admin-updated');
    });
  });

  test.describe('Mutation.setUsername for anonymous user should', () => {
    test('return NoPermissionError', async () => {
      const { errors } = await graphqlFetchAsAnonymousUser({
        query: /* GraphQL */ `
          mutation setUsername($username: String!, $userId: ID!) {
            setUsername(username: $username, userId: $userId) {
              _id
            }
          }
        `,
        variables: {
          userId: User._id,
          username: 'admin-updated',
        },
      });
      assert.strictEqual(errors[0]?.extensions?.code, 'NoPermissionError');
    });
  });
});
