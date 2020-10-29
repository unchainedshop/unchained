import fetch from 'isomorphic-unfetch';
import { setupDatabase, createLoggedInGraphqlFetch } from './helpers';
import { Admin, ADMIN_TOKEN, User } from './seeds/users';

let connection;
let db;
let graphqlFetch;

describe('Auth for admin users', () => {
  beforeAll(async () => {
    [db, connection] = await setupDatabase();
    graphqlFetch = await createLoggedInGraphqlFetch(ADMIN_TOKEN);
  });

  afterAll(async () => {
    await connection.close();
  });

  describe('Query.users', () => {
    beforeAll(async () => {
      const Users = db.collection('users');

      Users.createIndex({
        username: 'text',
      });

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
      const { data: { users } = {} } = await graphqlFetch({
        query: /* GraphQL */ `
          query {
            users {
              _id
              name
            }
          }
        `,
      });
      expect(users.length).toEqual(2);
    });
    it('returns 1 additional guest when using includeGuests', async () => {
      const { data: { users } = {} } = await graphqlFetch({
        query: /* GraphQL */ `
          query {
            users(includeGuests: true) {
              _id
              name
            }
          }
        `,
      });
      expect(users.length).toEqual(3);
    });

    it('returns users by queryString', async () => {
      const { data: { users } = {} } = await graphqlFetch({
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
      expect(users[0]).toMatchObject({
        _id: 'guest',
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
      const { data: { user } = {} } = await graphqlFetch({
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

    it('returns not found error when passed non existing userID', async () => {
      const { errors } = await graphqlFetch({
        query: /* GraphQL */ `
          query user($userId: ID) {
            user(userId: $userId) {
              _id
              name
            }
          }
        `,
        variables: {
          userId: 'non-existing-id',
        },
      });
      expect(errors[0]?.extensions?.code).toEqual('UserNotFoundError');
    });
  });

  describe('Mutation.updateUserAvatar', () => {
    it('update the avatar of a foreign user', async () => {
      const imageResult = await fetch(
        'https://assets-cdn.github.com/images/modules/logos_page/Octocat.png',
      );
      const imageBuffer = await imageResult.buffer();
      const avatar = {
        name: 'Octocat.png',
        type: 'image/png',
        size: imageBuffer.length,
        buffer: imageBuffer.toString('base64'),
      };

      const { data: { updateUserAvatar } = {} } = await graphqlFetch({
        query: /* GraphQL */ `
          mutation updateUserAvatar($userId: ID, $avatar: Upload!) {
            updateUserAvatar(userId: $userId, avatar: $avatar) {
              _id
              avatar {
                name
              }
            }
          }
        `,
        variables: {
          userId: User._id,
          avatar,
        },
      });
      expect(updateUserAvatar).toMatchObject({
        _id: User._id,
        avatar: {
          name: 'Octocat.png',
        },
      });
    });
  });

  describe('Mutation.updateEmail', () => {
    it('update the e-mail of a foreign user', async () => {
      const email = 'newuser@unchained.localhost';
      const { data: { updateEmail } = {} } = await graphqlFetch({
        query: /* GraphQL */ `
          mutation updateEmail($email: String!, $userId: ID) {
            updateEmail(email: $email, userId: $userId) {
              _id
              primaryEmail {
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
      expect(updateEmail).toMatchObject({
        _id: User._id,
        primaryEmail: {
          address: email,
          verified: false,
        },
      });
    });
  });

  describe('Mutation.addEmail', () => {
    it('add an e-mail to a foreign user', async () => {
      const email = 'newuser2@unchained.local';
      const { data: { addEmail } = {} } = await graphqlFetch({
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
      const { data: { removeEmail } = {} } = await graphqlFetch({
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
      const { data: { setUserTags } = {} } = await graphqlFetch({
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
      const { errors } = await graphqlFetch({
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
      const { errors } = await graphqlFetch({
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
        birthday: new Date('01.03.37'),
        phoneMobile: '+414114141',
        gender: 'm',
        address: {
          firstName: 'P',
          lastName: 'K',
        },
      };
      const { data: { updateUserProfile } = {} } = await graphqlFetch({
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
      expect(updateUserProfile).toMatchObject({
        _id: User._id,
        name: profile.displayName,
        profile: {
          ...profile,
          birthday: profile.birthday.getTime(),
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
      const { data: { enrollUser } = {} } = await graphqlFetch({
        query: /* GraphQL */ `
          mutation enrollUser(
            $email: String!
            $password: String
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
    });
    it('should fire off the enrollment email', async () => {
      const email = 'admin3@unchained.local';

      const { data: { sendEnrollmentEmail } = {} } = await graphqlFetch({
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

      const { data: { workQueue } = {} } = await graphqlFetch({
        query: /* GraphQL */ `
          query($status: [WorkStatus]) {
            workQueue(status: $status) {
              _id
              type
              status
            }
          }
        `,
        variables: {
          // Empty array as status queries the whole queue
          status: [],
        },
      });
      const work = workQueue.filter(
        ({ type, status }) => type === 'MESSAGE' && status === 'SUCCESS',
      );

      // length of two means only the verification email and the enrollment got triggered
      expect(work).toHaveLength(2);
    });

    it('enroll a user with pre-setting a password', async () => {
      const profile = {
        displayName: 'Admin4',
      };
      const email = 'admin4@unchained.local';
      const password = 'admin4';
      const { data: { enrollUser } = {} } = await graphqlFetch({
        query: /* GraphQL */ `
          mutation enrollUser(
            $email: String!
            $password: String
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
    });
  });

  describe('Mutation.setPassword', () => {
    it('set the password of a foreign user', async () => {
      const newPassword = 'new';
      const { data: { setPassword } = {} } = await graphqlFetch({
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
      expect(setPassword).toMatchObject({
        _id: User._id,
      });
    });
  });

  describe('Mutation.setUsername', () => {
    it('set the username of a foreign user', async () => {
      const username = 'John Doe';
      const { data: { setUsername } = {} } = await graphqlFetch({
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
      const { data: { setRoles } = {} } = await graphqlFetch({
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
      const { errors } = await graphqlFetch({
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
      const { errors } = await graphqlFetch({
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
});
