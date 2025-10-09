import test from 'node:test';
import assert from 'node:assert';
import {
  setupDatabase,
  createLoggedInGraphqlFetch,
  createAnonymousGraphqlFetch,
  disconnect,
  getConnection,
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
      const testAddress = '0xabcdef9876543210abcdef9876543210abcdef98';
      await graphqlFetchAsUser({
        query: /* GraphQL */ `
          mutation AddWeb3Address($address: String!) {
            addWeb3Address(address: $address) {
              _id
            }
          }
        `,
        variables: {
          address: testAddress,
        },
      });

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
          address: testAddress,
        },
      });

      assert.ok(removeWeb3Address);
      assert.strictEqual(removeWeb3Address._id, 'user');
      const foundAddress = removeWeb3Address.web3Addresses?.find(
        (a) => a.address.toLowerCase() === testAddress.toLowerCase(),
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

  test.describe('Mutation.verifyWeb3Address', () => {
    test('should return error when not logged in', async () => {
      const { errors } = await graphqlFetchAsAnonymous({
        query: /* GraphQL */ `
          mutation VerifyWeb3Address($address: String!, $hash: String!) {
            verifyWeb3Address(address: $address, hash: $hash) {
              _id
              username
            }
          }
        `,
        variables: {
          address: '0x1234567890123456789012345678901234567890',
          hash: '0x0000000000000000000000000000000000000000000000000000000000000000',
        },
      });

      assert.ok(errors);
      assert.strictEqual(errors[0]?.extensions?.code, 'NoPermissionError');
    });

    test('should return error for non-existing address', async () => {
      const { errors } = await graphqlFetchAsUser({
        query: /* GraphQL */ `
          mutation VerifyWeb3Address($address: String!, $hash: String!) {
            verifyWeb3Address(address: $address, hash: $hash) {
              _id
              username
            }
          }
        `,
        variables: {
          address: '0xnonexistent1234567890123456789012345678',
          hash: '0x0000000000000000000000000000000000000000000000000000000000000000',
        },
      });

      assert.ok(errors);
      assert.strictEqual(errors[0]?.extensions?.code, 'UserWeb3AddressNotFoundError');
    });

    test('should return error for invalid signature', async () => {
      await graphqlFetchAsUser({
        query: /* GraphQL */ `
          mutation AddWeb3Address($address: String!) {
            addWeb3Address(address: $address) {
              _id
            }
          }
        `,
        variables: {
          address: '0x1234567890123456789012345678901234567890',
        },
      });

      const { errors } = await graphqlFetchAsUser({
        query: /* GraphQL */ `
          mutation VerifyWeb3Address($address: String!, $hash: String!) {
            verifyWeb3Address(address: $address, hash: $hash) {
              _id
              username
            }
          }
        `,
        variables: {
          address: '0x1234567890123456789012345678901234567890',
          hash: '0x0000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000',
        },
      });

      assert.ok(errors);
      assert.ok(errors.length > 0);
    });
  });

  test.describe('Mutation.verifyWeb3Address with valid signature', () => {
    test('should successfully verify valid signature', async () => {
      const address = '0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266';
      const nonce = 'test';
      const signature =
        '0xf755d9a72d5b7386765e7f0e833af68795b739a267122dae933f41b781b5aed0626ce3263308ebd4c37bed84319b66da2794368771046825bd89b98ba68c4e871b';

      await graphqlFetchAsUser({
        query: /* GraphQL */ `
          mutation AddWeb3Address($address: String!) {
            addWeb3Address(address: $address) {
              _id
            }
          }
        `,
        variables: {
          address,
        },
      });

      const connection = getConnection();
      const db = connection.db('test');
      const Users = db.collection('users');

      await Users.updateOne(
        { _id: 'user', 'services.web3.address': address },
        {
          $set: {
            'services.web3.$.nonce': nonce,
          },
        },
      );

      const {
        data: { verifyWeb3Address },
      } = await graphqlFetchAsUser({
        query: /* GraphQL */ `
          mutation VerifyWeb3Address($address: String!, $hash: String!) {
            verifyWeb3Address(address: $address, hash: $hash) {
              _id
              web3Addresses {
                address
                verified
                nonce
              }
            }
          }
        `,
        variables: {
          address,
          hash: signature,
        },
      });

      assert.ok(verifyWeb3Address);
      const verifiedAddress = verifyWeb3Address.web3Addresses.find(
        (a) => a.address.toLowerCase() === address.toLowerCase(),
      );
      assert.ok(verifiedAddress);
      assert.strictEqual(verifiedAddress.verified, true, 'Address should be verified');
    });
  });
});
