import {
  setupDatabase,
  createLoggedInGraphqlFetch,
  createAnonymousGraphqlFetch,
  disconnect,
} from './helpers.js';
import { ADMIN_TOKEN, USER_TOKEN } from './seeds/users.js';
import assert from 'node:assert';
import test from 'node:test';

let graphqlFetchAsAdminUser;
let graphqlFetchAsNormalUser;
let graphqlfetchAsAnonymousUser;

test.describe('Heartbeat', () => {
  test.before(async () => {
    await setupDatabase();
    graphqlFetchAsAdminUser = createLoggedInGraphqlFetch(ADMIN_TOKEN);
    graphqlFetchAsNormalUser = createLoggedInGraphqlFetch(USER_TOKEN);
    graphqlfetchAsAnonymousUser = createAnonymousGraphqlFetch();
  });

  test.after(async () => {
    await disconnect();
  });

  test.describe('mutation.heartbeat for admin User should', () => {
    test('update user information successfully', async () => {
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

      assert.deepStrictEqual(heartbeat, {
        _id: 'admin',
        username: 'admin',
        isGuest: false,
      });
    });
  });

  test.describe('mutation.heartbeat for normal User should', () => {
    test('update user information succesfully', async () => {
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
      assert.deepStrictEqual(heartbeat, {
        _id: 'user',
        username: 'user',
        isGuest: false,
      });
    });
  });

  test.describe('mutation.heartbeat for anonymous User should', () => {
    test('return UserNotFoundError', async () => {
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
      assert.strictEqual(errors[0]?.extensions?.code, 'UserNotFoundError');
    });
  });
});
