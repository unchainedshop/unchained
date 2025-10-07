import test from 'node:test';
import assert from 'node:assert';
import {
  setupDatabase,
  createLoggedInGraphqlFetch,
  createAnonymousGraphqlFetch,
  disconnect,
} from './helpers.js';
import { USER_TOKEN } from './seeds/users.js';

let graphqlFetchAsUser;
let graphqlFetchAsAnonymous;

test.describe('Web3 Authentication', () => {
  test.before(async () => {
    await setupDatabase();
    graphqlFetchAsUser = createLoggedInGraphqlFetch(USER_TOKEN);
    graphqlFetchAsAnonymous = createAnonymousGraphqlFetch();
  });

  test.after(async () => {
    await disconnect();
  });

  test.describe('Mutation.addWeb3Address for logged in user', () => {
    test('should add web3 address to user', async () => {
      const { data } = await graphqlFetchAsUser({
        query: /* GraphQL */ `
          mutation AddWeb3Address($address: String!) {
            addWeb3Address(address: $address) {
              _id
              web3Addresses {
                address
                verified
              }
            }
          }
        `,
        variables: {
          address: '0x1234567890123456789012345678901234567890',
        },
      });
      const { addWeb3Address } = data;
      assert.ok(addWeb3Address);
      assert.strictEqual(addWeb3Address._id, 'user');
      assert.ok(Array.isArray(addWeb3Address.web3Addresses));
      const foundAddress = addWeb3Address.web3Addresses.find(
        (a) => a.address === '0x1234567890123456789012345678901234567890',
      );
      assert.ok(foundAddress);
      assert.strictEqual(foundAddress.verified, false);
    });

    test('should not add duplicate web3 addresses', async () => {
      const {
        data: { me },
      } = await graphqlFetchAsUser({
        query: /* GraphQL */ `
          query Web3Addresses {
            me {
              web3Addresses {
                address
              }
            }
          }
        `,
        variables: {
          address: '0x1234567890123456789012345678901234567890',
        },
      });
      const {
        data: { addWeb3Address },
      } = await graphqlFetchAsUser({
        query: /* GraphQL */ `
          mutation AddWeb3Address($address: String!) {
            addWeb3Address(address: $address) {
              _id
              web3Addresses {
                address
                verified
              }
            }
          }
        `,
        variables: {
          address: '0x1234567890123456789012345678901234567890',
        },
      });
      assert.ok(addWeb3Address);
      assert.ok(me.web3Addresses?.length > 0);
      assert.ok(addWeb3Address.web3Addresses?.length === me.web3Addresses?.length);
    });
  });

  test.describe('Mutation.addWeb3Address for anonymous user', () => {
    test('should return NoPermissionError', async () => {
      const { errors } = await graphqlFetchAsAnonymous({
        query: /* GraphQL */ `
          mutation AddWeb3Address($address: String!) {
            addWeb3Address(address: $address) {
              _id
            }
          }
        `,
        variables: {
          address: '0xabcdef1234567890abcdef1234567890abcdef12',
        },
      });

      assert.ok(errors);
      assert.strictEqual(errors[0]?.extensions?.code, 'NoPermissionError');
    });
  });

  test.describe('Mutation.removeWeb3Address for logged in user', () => {
    test('should remove web3 address from user', async () => {
      const {
        data: { removeWeb3Address },
      } = await graphqlFetchAsUser({
        query: /* GraphQL */ `
          mutation RemoveWeb3Address($address: String!) {
            removeWeb3Address(address: $address) {
              _id
              web3Addresses {
                address
              }
            }
          }
        `,
        variables: {
          address: '0x1234567890123456789012345678901234567890',
        },
      });

      assert.ok(removeWeb3Address);
      assert.strictEqual(removeWeb3Address._id, 'user');
      const foundAddress = removeWeb3Address.web3Addresses?.find(
        (a) => a.address === '0x1234567890123456789012345678901234567890',
      );
      assert.strictEqual(foundAddress, undefined);
    });

    test('should return error for non-existing address', async () => {
      const { errors } = await graphqlFetchAsUser({
        query: /* GraphQL */ `
          mutation RemoveWeb3Address($address: String!) {
            removeWeb3Address(address: $address) {
              _id
            }
          }
        `,
        variables: {
          address: '0xnonexistent1234567890123456789012345678',
        },
      });

      assert.ok(errors);
      assert.ok(errors.length > 0);
    });
  });

  test.describe('Mutation.removeWeb3Address for anonymous user', () => {
    test('should return NoPermissionError', async () => {
      const { errors } = await graphqlFetchAsAnonymous({
        query: /* GraphQL */ `
          mutation RemoveWeb3Address($address: String!) {
            removeWeb3Address(address: $address) {
              _id
            }
          }
        `,
        variables: {
          address: '0x1234567890123456789012345678901234567890',
        },
      });

      assert.ok(errors);
      assert.strictEqual(errors[0]?.extensions?.code, 'NoPermissionError');
    });
  });
});
