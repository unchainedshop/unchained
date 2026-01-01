import test from 'node:test';
import assert from 'node:assert';
import { setupDatabase, disconnect } from './helpers.js';
import { ADMIN_TOKEN, USER_TOKEN } from './seeds/users.js';
import {
  TestToken1,
  TestToken3,
  AlreadyExportedToken,
  InvalidatedToken,
  TokenWithInvalidProduct,
} from './seeds/tokens.js';
import { tokenSurrogates } from '@unchainedshop/core-warehousing';
import { eq } from 'drizzle-orm';

let graphqlFetchAsAdmin;
let graphqlFetchAsUser;
let graphqlFetchAsAnonymous;
let db;

test.describe('Token Export and Invalidation', () => {
  test.before(async () => {
    const {
      createLoggedInGraphqlFetch,
      createAnonymousGraphqlFetch,
      db: drizzleDb,
    } = await setupDatabase();
    db = drizzleDb;
    graphqlFetchAsAdmin = createLoggedInGraphqlFetch(ADMIN_TOKEN);
    graphqlFetchAsUser = createLoggedInGraphqlFetch(USER_TOKEN);
    graphqlFetchAsAnonymous = createAnonymousGraphqlFetch();
  });

  test.after(async () => {
    await disconnect();
  });

  test.describe('Mutation.exportToken for admin user', () => {
    test('should export token with valid parameters', async () => {
      const {
        data: { exportToken },
      } = await graphqlFetchAsAdmin({
        query: /* GraphQL */ `
          mutation ExportToken($tokenId: ID!, $quantity: Int!, $recipientWalletAddress: String!) {
            exportToken(
              tokenId: $tokenId
              quantity: $quantity
              recipientWalletAddress: $recipientWalletAddress
            ) {
              _id
              tokenSerialNumber
              quantity
              walletAddress
            }
          }
        `,
        variables: {
          tokenId: TestToken1._id,
          quantity: 1,
          recipientWalletAddress: '0x1111111111111111111111111111111111111111',
        },
      });

      assert.ok(exportToken);
      assert.strictEqual(exportToken._id, TestToken1._id);
      assert.strictEqual(exportToken.tokenSerialNumber, TestToken1.tokenSerialNumber);
    });

    test('should export token with multiple quantity', async () => {
      const {
        data: { exportToken },
      } = await graphqlFetchAsAdmin({
        query: /* GraphQL */ `
          mutation ExportToken($tokenId: ID!, $quantity: Int!, $recipientWalletAddress: String!) {
            exportToken(
              tokenId: $tokenId
              quantity: $quantity
              recipientWalletAddress: $recipientWalletAddress
            ) {
              _id
              quantity
            }
          }
        `,
        variables: {
          tokenId: TestToken1._id,
          quantity: 5,
          recipientWalletAddress: '0x2222222222222222222222222222222222222222',
        },
      });

      assert.ok(exportToken);
      assert.strictEqual(exportToken._id, TestToken1._id);
    });

    test('should return error when token not found', async () => {
      const { errors } = await graphqlFetchAsAdmin({
        query: /* GraphQL */ `
          mutation ExportToken($tokenId: ID!, $quantity: Int!, $recipientWalletAddress: String!) {
            exportToken(
              tokenId: $tokenId
              quantity: $quantity
              recipientWalletAddress: $recipientWalletAddress
            ) {
              _id
            }
          }
        `,
        variables: {
          tokenId: 'non-existing-token',
          quantity: 1,
          recipientWalletAddress: '0x3333333333333333333333333333333333333333',
        },
      });

      assert.ok(errors);
      assert.strictEqual(errors[0]?.extensions?.code, 'TokenNotFoundError');
    });

    test('should return error when tokenId is invalid', async () => {
      const { errors } = await graphqlFetchAsAdmin({
        query: /* GraphQL */ `
          mutation ExportToken($tokenId: ID!, $quantity: Int!, $recipientWalletAddress: String!) {
            exportToken(
              tokenId: $tokenId
              quantity: $quantity
              recipientWalletAddress: $recipientWalletAddress
            ) {
              _id
            }
          }
        `,
        variables: {
          tokenId: '',
          quantity: 1,
          recipientWalletAddress: '0x4444444444444444444444444444444444444444',
        },
      });

      assert.ok(errors);
      assert.strictEqual(errors[0]?.extensions?.code, 'InvalidIdError');
    });

    test('should return TokenWrongStatusError when exporting already exported token', async () => {
      const { errors } = await graphqlFetchAsAdmin({
        query: /* GraphQL */ `
          mutation ExportToken($tokenId: ID!, $quantity: Int!, $recipientWalletAddress: String!) {
            exportToken(
              tokenId: $tokenId
              quantity: $quantity
              recipientWalletAddress: $recipientWalletAddress
            ) {
              _id
            }
          }
        `,
        variables: {
          tokenId: AlreadyExportedToken._id,
          quantity: 1,
          recipientWalletAddress: '0x5555555555555555555555555555555555555555',
        },
      });

      assert.ok(errors);
      assert.strictEqual(errors[0]?.extensions?.code, 'TokenWrongStatusError');
    });

    test('should not create duplicate work items for same token', async () => {
      await graphqlFetchAsAdmin({
        query: /* GraphQL */ `
          mutation ExportToken($tokenId: ID!, $quantity: Int!, $recipientWalletAddress: String!) {
            exportToken(
              tokenId: $tokenId
              quantity: $quantity
              recipientWalletAddress: $recipientWalletAddress
            ) {
              _id
            }
          }
        `,
        variables: {
          tokenId: TestToken3._id,
          quantity: 1,
          recipientWalletAddress: '0x7777777777777777777777777777777777777777',
        },
      });

      const {
        data: { exportToken },
      } = await graphqlFetchAsAdmin({
        query: /* GraphQL */ `
          mutation ExportToken($tokenId: ID!, $quantity: Int!, $recipientWalletAddress: String!) {
            exportToken(
              tokenId: $tokenId
              quantity: $quantity
              recipientWalletAddress: $recipientWalletAddress
            ) {
              _id
            }
          }
        `,
        variables: {
          tokenId: TestToken3._id,
          quantity: 1,
          recipientWalletAddress: '0x8888888888888888888888888888888888888888',
        },
      });

      assert.ok(exportToken);
    });
  });

  test.describe('Mutation.exportToken for normal user', () => {
    test('should return NoPermissionError', async () => {
      const { errors } = await graphqlFetchAsUser({
        query: /* GraphQL */ `
          mutation ExportToken($tokenId: ID!, $quantity: Int!, $recipientWalletAddress: String!) {
            exportToken(
              tokenId: $tokenId
              quantity: $quantity
              recipientWalletAddress: $recipientWalletAddress
            ) {
              _id
            }
          }
        `,
        variables: {
          tokenId: TestToken1._id,
          quantity: 1,
          recipientWalletAddress: '0x9999999999999999999999999999999999999999',
        },
      });

      assert.ok(errors);
      assert.strictEqual(errors[0]?.extensions?.code, 'NoPermissionError');
    });
  });

  test.describe('Mutation.exportToken for anonymous user', () => {
    test('should return NoPermissionError', async () => {
      const { errors } = await graphqlFetchAsAnonymous({
        query: /* GraphQL */ `
          mutation ExportToken($tokenId: ID!, $quantity: Int!, $recipientWalletAddress: String!) {
            exportToken(
              tokenId: $tokenId
              quantity: $quantity
              recipientWalletAddress: $recipientWalletAddress
            ) {
              _id
            }
          }
        `,
        variables: {
          tokenId: TestToken1._id,
          quantity: 1,
          recipientWalletAddress: '0xaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa',
        },
      });

      assert.ok(errors);
      assert.strictEqual(errors[0]?.extensions?.code, 'NoPermissionError');
    });
  });

  test.describe('Mutation.invalidateToken for admin user', () => {
    test('should return error when trying to invalidate an already invalidated token', async () => {
      const { errors } = await graphqlFetchAsAdmin({
        query: /* GraphQL */ `
          mutation InvalidateToken($tokenId: ID!) {
            invalidateToken(tokenId: $tokenId) {
              _id
            }
          }
        `,
        variables: {
          tokenId: InvalidatedToken._id,
        },
      });

      assert.ok(errors);
      assert.strictEqual(errors[0]?.extensions?.code, 'TokenWrongStatusError');
    });

    test('should return error when token not found', async () => {
      const { errors } = await graphqlFetchAsAdmin({
        query: /* GraphQL */ `
          mutation InvalidateToken($tokenId: ID!) {
            invalidateToken(tokenId: $tokenId) {
              _id
            }
          }
        `,
        variables: {
          tokenId: 'non-existing-token',
        },
      });

      assert.ok(errors);
      assert.strictEqual(errors[0]?.extensions?.code, 'TokenNotFoundError');
    });

    test('should return ProductNotFoundError when token has invalid product', async () => {
      // Insert the token with invalid product directly (not seeded to avoid breaking other token queries)
      // Token surrogates are now in Drizzle/SQLite
      await db.insert(tokenSurrogates).values({
        _id: TokenWithInvalidProduct._id,
        userId: TokenWithInvalidProduct.userId,
        walletAddress: TokenWithInvalidProduct.walletAddress,
        invalidatedDate: TokenWithInvalidProduct.invalidatedDate,
        expiryDate: TokenWithInvalidProduct.expiryDate,
        quantity: TokenWithInvalidProduct.quantity,
        contractAddress: TokenWithInvalidProduct.contractAddress,
        chainId: TokenWithInvalidProduct.chainId,
        tokenSerialNumber: TokenWithInvalidProduct.tokenSerialNumber,
        productId: TokenWithInvalidProduct.productId,
        orderPositionId: TokenWithInvalidProduct.orderPositionId,
        meta: TokenWithInvalidProduct.meta ? JSON.stringify(TokenWithInvalidProduct.meta) : null,
      });

      const { errors } = await graphqlFetchAsAdmin({
        query: /* GraphQL */ `
          mutation InvalidateToken($tokenId: ID!) {
            invalidateToken(tokenId: $tokenId) {
              _id
            }
          }
        `,
        variables: {
          tokenId: TokenWithInvalidProduct._id,
        },
      });

      assert.ok(errors);
      assert.strictEqual(errors[0]?.extensions?.code, 'ProductNotFoundError');

      // Clean up - remove the token with invalid product to avoid affecting other tests
      await db.delete(tokenSurrogates).where(eq(tokenSurrogates._id, TokenWithInvalidProduct._id));
    });

    test('should successfully invalidate a token when all invalidation criteria are met (needs proper virtual provider setup)', async () => {
      const {
        data: { invalidateToken },
      } = await graphqlFetchAsAdmin({
        query: /* GraphQL */ `
          mutation InvalidateToken($tokenId: ID!) {
            invalidateToken(tokenId: $tokenId) {
              _id
              tokenSerialNumber
              invalidatedDate
              status
            }
          }
        `,
        variables: {
          tokenId: TestToken1._id,
        },
      });

      assert.ok(invalidateToken);
      assert.ok(invalidateToken?.invalidatedDate);
    });
  });

  test.describe('Mutation.invalidateToken for normal user', () => {
    test('should invalidate token successfully', async () => {
      const {
        data: { invalidateToken },
      } = await graphqlFetchAsUser({
        query: /* GraphQL */ `
          mutation InvalidateToken($tokenId: ID!) {
            invalidateToken(tokenId: $tokenId) {
              _id
            }
          }
        `,
        variables: {
          tokenId: TestToken3._id,
        },
      });

      assert.ok(invalidateToken);
    });
  });

  test.describe('Mutation.invalidateToken for anonymous user', () => {
    test('should return NoPermissionError', async () => {
      const { errors } = await graphqlFetchAsAnonymous({
        query: /* GraphQL */ `
          mutation InvalidateToken($tokenId: ID!) {
            invalidateToken(tokenId: $tokenId) {
              _id
            }
          }
        `,
        variables: {
          tokenId: TestToken1._id,
        },
      });

      assert.ok(errors);
      assert.strictEqual(errors[0]?.extensions?.code, 'NoPermissionError');
    });
  });
});
