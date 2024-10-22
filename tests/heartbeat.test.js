import { setupDatabase, createLoggedInGraphqlFetch, createAnonymousGraphqlFetch } from './helpers.js';
import { ADMIN_TOKEN, USER_TOKEN } from './seeds/users.js';

let graphqlFetchAsAdminUser;
let graphqlFetchAsNormalUser;
let graphqlfetchAsAnonymousUser;
describe('Heartbeat', () => {
  beforeAll(async () => {
    await setupDatabase();
    graphqlFetchAsAdminUser = await createLoggedInGraphqlFetch(ADMIN_TOKEN);
    graphqlFetchAsNormalUser = await createLoggedInGraphqlFetch(USER_TOKEN);
    graphqlfetchAsAnonymousUser = await createAnonymousGraphqlFetch();
  });

  describe('mutation.heartbeat for admin User should', () => {
    it('update user information successfully', async () => {
      const {
        data: { heartbeat },
      } = await graphqlFetchAsAdminUser({
        query: /* GraphQL */ `
          mutation heartbeat {
            heartbeat {
              _id
              username
              isGuest
              isInitialPassword
              name
              avatar {
                _id
                url
              }
              language {
                _id
                isoCode
                isActive
                isBase
                name
              }
              country {
                _id
                isoCode
                isActive
                isBase
                defaultCurrency {
                  _id
                  isoCode
                }
              }
              lastBillingAddress {
                firstName
                lastName
              }
              lastContact {
                telNumber
                emailAddress
              }
              primaryEmail {
                address
                verified
              }
              emails {
                address
                verified
              }
              roles
              tags
              cart {
                _id
              }
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
        variables: {},
      });

      expect(heartbeat).toMatchObject({
        _id: 'admin',
        username: 'admin',
        isGuest: false,
      });
    });
  });

  describe('mutation.heartbeat for normal User should', () => {
    it('update user information succesfully', async () => {
      const {
        data: { heartbeat },
      } = await graphqlFetchAsNormalUser({
        query: /* GraphQL */ `
          mutation heartbeat {
            heartbeat {
              _id
              username
              isGuest
            }
          }
        `,
        variables: {},
      });
      expect(heartbeat).toMatchObject({
        _id: 'user',
        username: 'user',
        isGuest: false,
      });
    });
  });

  describe('mutation.heartbeat for anonymous User should', () => {
    it('return UserNotFoundError', async () => {
      const { errors } = await graphqlfetchAsAnonymousUser({
        query: /* GraphQL */ `
          mutation heartbeat {
            heartbeat {
              _id
            }
          }
        `,
        variables: {},
      });
      expect(errors[0]?.extensions?.code).toEqual('UserNotFoundError');
    });
  });
});
