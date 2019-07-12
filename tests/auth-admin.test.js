import fetch from 'isomorphic-unfetch';
import { setupDatabase, createLoggedInGraphqlFetch } from './helpers';
import { Admin, ADMIN_TOKEN, User } from './seeds/users';

let connection;
let db;
let graphqlFetch;

/* TODO:
- enrollUser
- setPassword
- setRoles
*/

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
      await Users.findOrInsertOne({
        ...User,
        _id: 'guest',
        guest: true,
        emails: [
          {
            address: 'guest@localhost',
            verified: true
          }
        ]
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
        `
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
        `
      });
      expect(users.length).toEqual(3);
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
            verified: true
          }
        ]
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
          userId: User._id
        }
      });
      expect(user).toMatchObject({
        _id: User._id
      });
    });
  });

  describe('Mutation.updateUserAvatar', () => {
    it('update the avatar of a foreign user', async () => {
      const imageResult = await fetch(
        'https://assets-cdn.github.com/images/modules/logos_page/Octocat.png'
      );
      const imageBuffer = await imageResult.buffer();
      const avatar = {
        name: 'Octocat.png',
        type: 'image/png',
        size: imageBuffer.length,
        buffer: imageBuffer.toString('base64')
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
          avatar
        }
      });
      expect(updateUserAvatar).toMatchObject({
        _id: User._id,
        avatar: {
          name: 'Octocat.png'
        }
      });
    });
  });

  describe('Mutation.updateEmail', () => {
    it('update the e-mail of a foreign user', async () => {
      const email = 'admin2@localhost';
      const { data: { updateEmail } = {} } = await graphqlFetch({
        query: /* GraphQL */ `
          mutation updateEmail($email: String!, $userId: ID) {
            updateEmail(email: $email, userId: $userId) {
              _id
              email
              isEmailVerified
            }
          }
        `,
        variables: {
          userId: User._id,
          email
        }
      });
      expect(updateEmail).toMatchObject({
        _id: User._id,
        email,
        isEmailVerified: false
      });
    });
  });

  describe('Mutation.updateUserTags', () => {
    it('update the tags of myself as admin', async () => {
      const tags = ['new-tag'];
      const { data: { updateUserTags } = {} } = await graphqlFetch({
        query: /* GraphQL */ `
          mutation updateUserTags($tags: [String]!, $userId: ID!) {
            updateUserTags(tags: $tags, userId: $userId) {
              _id
              tags
            }
          }
        `,
        variables: {
          userId: Admin._id,
          tags
        }
      });
      expect(updateUserTags).toMatchObject({
        _id: Admin._id,
        tags
      });
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
          lastName: 'K'
        }
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
          profile
        }
      });
      expect(updateUserProfile).toMatchObject({
        _id: User._id,
        name: profile.displayName,
        profile: {
          ...profile,
          birthday: profile.birthday.getTime()
        }
      });
    });
  });

  describe('Mutation.enrollUser', () => {
    it('enroll a user without a password', async () => {
      const profile = {
        displayName: 'Admin3'
      };
      const email = 'admin3@localhost';
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
              email
            }
          }
        `,
        variables: {
          email,
          password,
          profile
        }
      });
      expect(enrollUser).toMatchObject({
        email,
        isEmailVerified: false
      });
    });

    it('enroll a user with pre-setting a password', async () => {
      const profile = {
        displayName: 'Admin4'
      };
      const email = 'admin4@localhost';
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
              email
            }
          }
        `,
        variables: {
          email,
          password,
          profile
        }
      });
      expect(enrollUser).toMatchObject({
        email,
        isEmailVerified: false
      });
    });
  });
});
