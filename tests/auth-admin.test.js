import FormData from 'form-data';
import {
  setupDatabase,
  createLoggedInGraphqlFetch,
  createAnonymousGraphqlFetch,
  uploadFormData,
} from './helpers';
import { Admin, ADMIN_TOKEN, User, USER_TOKEN } from './seeds/users';
import { intervalUntilTimeout } from './lib/wait';

const fs = require('fs');
const crypto = require('crypto');
const path = require('path');

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
        _id: 'guest',
        username: 'guest',
        guest: true,
        emails: [
          {
            address: 'guest@localhost',
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
      expect(users).toEqual([
        { _id: 'admin', name: 'admin@unchained.local' },
        { _id: 'user', name: 'user@unchained.local' },
      ]);
    });
    it('returns 1 additional guest when using includeGuests', async () => {
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
      expect(users).toEqual([
        { _id: 'admin', name: 'admin@unchained.local' },
        { _id: 'user', name: 'user@unchained.local' },
        { _id: 'guest', name: 'guest@localhost' },
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
      expect(users.length).toEqual(1);
      expect(users[0]).toMatchObject({
        _id: 'guest',
        name: 'guest@localhost',
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
            address: 'guest@localhost',
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
      expect(user).toMatchObject({
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
      expect(usersCount).toEqual(2);
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
      expect(usersCount).toEqual(3);
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
      expect(usersCount).toEqual(1);
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
      expect(errors[0]?.extensions?.code).toEqual('NoPermissionError');
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
      expect(errors[0]?.extensions?.code).toEqual('NoPermissionError');
    });
  });

  describe('Mutation.updateUserAvatar', () => {
    it('update the avatar of a foreign user', async () => {
      const avatar = fs.createReadStream(
        path.resolve(__dirname, `./assets/image.jpg`),
      );

      const body = new FormData();
      body.append(
        'operations',
        JSON.stringify({
          query: `
          mutation updateUserAvatar($userId: ID, $avatar: Upload!) {
            updateUserAvatar(userId: $userId, avatar: $avatar) {
              _id
              avatar {
                name
                url
              }
            }
          }
        `,
          variables: {
            userId: User._id,
            avatar: null,
          },
        }),
      );

      body.append('map', JSON.stringify({ 1: ['variables.avatar'] }));
      body.append('1', avatar);
      const {
        data: { updateUserAvatar },
      } = await uploadFormData({ token: ADMIN_TOKEN, body });

      expect(updateUserAvatar).toMatchObject({
        _id: User._id,
        avatar: {
          name: 'image.jpg',
        },
      });
      const hash = crypto.createHash('sha256');
      const download = (await fetch(updateUserAvatar.avatar.url)).body;
      download.on('data', chunk => hash.update(chunk));
      download.on('end', () => expect(hash.digest('hex')).toBe('f0d184ed4614ccfad07d2193d20c15dd6df9e3a5136cd62afdab2545cae6a0a2'));
    }, 99999);
  });

  describe('Mutation.addEmail', () => {
    it('add an e-mail to a foreign user', async () => {
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

      expect(addEmail).toMatchObject({
        _id: User._id,
        emails: [
          {
            address: expect.anything(),
            verified: expect.anything(),
          },
          {
            address: email,
            verified: false,
          },
        ],
      });
    });
  });

  describe('Mutation.removeEmail', () => {
    it('remove an e-mail of a foreign user', async () => {
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
      expect(removeEmail).toMatchObject({
        _id: User._id,
        emails: [
          {
            address: expect.anything(),
            verified: expect.anything(),
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
          mutation setUserTags($tags: [String]!, $userId: ID!) {
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
      expect(setUserTags).toMatchObject({
        _id: Admin._id,
        tags,
      });
    });

    it('return not found error when passed non existing userId', async () => {
      const tags = ['new-tag'];
      const { errors } = await graphqlFetchAsAdminUser({
        query: /* GraphQL */ `
          mutation setUserTags($tags: [String]!, $userId: ID!) {
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
      expect(errors[0]?.extensions?.code).toEqual('UserNotFoundError');
    });

    it('return error when passed invalid userId', async () => {
      const tags = ['new-tag'];
      const { errors } = await graphqlFetchAsAdminUser({
        query: /* GraphQL */ `
          mutation setUserTags($tags: [String]!, $userId: ID!) {
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
      expect(errors[0]?.extensions?.code).toEqual('InvalidIdError');
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
      const { data: { updateUserProfile } = {} } =
        await graphqlFetchAsAdminUser({
          query: /* GraphQL */ `
            mutation updateUserProfile(
              $profile: UserProfileInput!
              $userId: ID
            ) {
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
      expect(updateUserProfile).toMatchObject({
        _id: User._id,
        name: profile.displayName,
        profile: {
          ...profile,
          birthday: "2037-01-02",
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
          mutation enrollUser(
            $email: String!
            $password: HashedPasswordInput
            $profile: UserProfileInput!
          ) {
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

      expect(enrollUser).toMatchObject({
        isInitialPassword: true,
        primaryEmail: {
          address: email,
          verified: false,
        },
      });

      const work = await intervalUntilTimeout(async () => {
        const work = await (db.collection('work_queue')).find({ type: "EMAIL", "input.to": email, retries: 20 }).toArray();
        if (work?.length) return work;
        return false;
      }, 5000);

      // length of two means only the enrollment got triggered
      expect(work).toHaveLength(1);
    }, 10000);

    it('should fire off the enrollment email', async () => {
      const email = 'admin3@unchained.local';

      const { data: { sendEnrollmentEmail } = {} } =
        await graphqlFetchAsAdminUser({
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

      expect(sendEnrollmentEmail).toMatchObject({
        success: true,
      });

      const work = await intervalUntilTimeout(async () => {
        const work = await (db.collection('work_queue')).find({ type: "EMAIL", "input.to": email, retries: 20 }).toArray();
        if (work?.length) return work;
        return false;
      }, 5000);
      // length of two means only the enrollment got triggered
      expect(work).toHaveLength(2);
    }, 10000);

    it('enroll a user with pre-setting a password', async () => {
      const profile = {
        displayName: 'Admin4',
      };
      const email = 'admin4@unchained.local';
      const plainPassword = 'admin4';
      const { data: { enrollUser } = {} } = await graphqlFetchAsAdminUser({
        query: /* GraphQL */ `
          mutation enrollUser(
            $email: String!
            $plainPassword: String
            $profile: UserProfileInput!
          ) {
            enrollUser(
              email: $email
              plainPassword: $plainPassword
              profile: $profile
            ) {
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
          plainPassword,
          profile,
        },
      });
      expect(enrollUser).toMatchObject({
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
      const newPlainPassword = 'new';
      const { data: { setPassword } = {} } = await graphqlFetchAsAdminUser({
        query: /* GraphQL */ `
          mutation setPassword($userId: ID!, $newPlainPassword: String!) {
            setPassword(newPlainPassword: $newPlainPassword, userId: $userId) {
              _id
            }
          }
        `,
        variables: {
          userId: User._id,
          newPlainPassword,
        },
      });
      expect(setPassword).toMatchObject({
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

      expect(setUsername).toMatchObject({
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
      expect(setRoles).toMatchObject({
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
      expect(errors[0]?.extensions?.code).toEqual('InvalidIdError');
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
      expect(errors[0]?.extensions?.code).toEqual('UserNotFoundError');
    });
  });

  describe('Mutation.setUsername for admin user should', () => {
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
      expect(setUsername.username).toEqual('admin-updated');
    });

    it('update guest username successuly for the specified user ID', async () => {
      const {
        data: { setUsername },
      } = await graphqlFetchAsAdminUser({
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
      expect(setUsername.username).toEqual('user-updated');
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
      expect(errors[0]?.extensions?.code).toEqual('UserNotFoundError');
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
      expect(errors[0]?.extensions?.code).toEqual('NoPermissionError');
    });
  });
});
