import { setupDatabase, createLoggedInGraphqlFetch, createAnonymousGraphqlFetch } from './helpers.js';
import { Admin, ADMIN_TOKEN, User, USER_TOKEN } from './seeds/users';
import { intervalUntilTimeout } from './lib/wait';
import assert from 'node:assert';
import { describe, it, beforeAll } from 'node:test';

let db;
let graphqlFetchAsAdminUser;
let graphqlFetchAsAnonymousUser;
let graphqlFetchAsNormalUser;

describe('Auth for admin users', () => {
  beforeAll(async () => {
    [db] = await setupDatabase();
    graphqlFetchAsAdminUser = createLoggedInGraphqlFetch(ADMIN_TOKEN);
    graphqlFetchAsNormalUser = createLoggedInGraphqlFetch(USER_TOKEN);
    graphqlFetchAsAnonymousUser = createAnonymousGraphqlFetch();
  });

  describe('Query.users', () => {
    beforeAll(async () => {
      const Users = db.collection('users');

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

    it('returns the 2 default users', async () => {
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
    it('returns 2 additional guest when using includeGuests', async () => {
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

    it('returns users by queryString', async () => {
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

  describe('Query.user', () => {
    beforeAll(async () => {
      const Users = db.collection('users');
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

    it('returns foreign user by id', async () => {
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
      assert.deepStrictEqual(user, {
        _id: User._id,
      });
    });
  });

  describe('Query.usersCount for admin user', () => {
    it('returns the 2 default users', async () => {
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
    it('returns 3  when using includeGuests', async () => {
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

    it('returns 1 for queryString guest', async () => {
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

  describe('Query.usersCount for anonymous user', () => {
    it('return NoPermissionError', async () => {
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

  describe('Query.usersCount for loged in user', () => {
    it('return NoPermissionError', async () => {
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

  describe('Mutation.addEmail', () => {
    it.todo('add an e-mail to a foreign user', async () => {
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
          {},
          {
            address: email,
            verified: false,
          },
        ],
      });
    });
  });

  describe('Mutation.removeEmail', () => {
    it.todo('remove an e-mail of a foreign user', async () => {
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
      assert.deepStrictEqual(removeEmail, {
        _id: User._id,
        emails: [
          {
            address: String,
            verified: String,
          },
        ],
      });
    });
  });

  describe('Mutation.setUserTags', () => {
    it('update the tags of myself as admin', async () => {
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

    it('return not found error when passed non existing userId', async () => {
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

    it('return error when passed invalid userId', async () => {
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

  describe('Mutation.updateUserProfile', () => {
    it('update the profile of a foreign user', async () => {
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

  describe('Mutation.enrollUser', () => {
    it('enroll a user without a password', async () => {
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

      assert.deepStrictEqual(enrollUser, {
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

    it('should fire off the enrollment email', async () => {
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

    it('enroll a user with pre-setting a password', async () => {
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
      assert.deepStrictEqual(enrollUser, {
        isInitialPassword: true,
        primaryEmail: {
          address: email,
          verified: false,
        },
      });
    });
  });

  describe('Mutation.setPassword', () => {
    it('set the password of a foreign user', async () => {
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

  describe('Mutation.setUsername', () => {
    it('set the username of a foreign user', async () => {
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

  describe('Mutation.setRoles', () => {
    it('set the roles of a foreign user', async () => {
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

    it('return error when passed invalid userId', async () => {
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

    it('return not found error when passed non-existing userId', async () => {
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

  describe('Mutation.setUsername for admin user should', () => {
    it('update guest username successuly for the specified user ID', async () => {
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

    it('return UserNotFoundError when passed non existing user ID', async () => {
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

    it('update username for the specified user ID', async () => {
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

  describe('Mutation.setUsername for anonymous user should', () => {
    it('return NoPermissionError', async () => {
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
