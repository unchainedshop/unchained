import fetch from 'isomorphic-unfetch';
import { setupDatabase, createLoggedInGraphqlFetch } from './helpers';
import { Admin, ADMIN_TOKEN, User } from './seeds/users';

let connection;
let db;
let graphqlFetch;

/* TODO:
- updateEmail
- updateUserTags
- updateUserProfile
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
      const { data: { updateEmail } = {} } = await graphqlFetch({
        query: /* GraphQL */ `
          mutation updateEmail($userId: ID, $avatar: Upload!) {
            updateEmail(userId: $userId, avatar: $avatar) {
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
      expect(updateEmail).toMatchObject({
        _id: User._id,
        avatar: {
          name: 'Octocat.png'
        }
      });
    });
  });
});
