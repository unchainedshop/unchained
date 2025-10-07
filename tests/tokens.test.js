import {
  setupDatabase,
  createLoggedInGraphqlFetch,
  disconnect,
  createAnonymousGraphqlFetch,
} from './helpers.js';
import { ADMIN_TOKEN, USER_TOKEN } from './seeds/users.js';
import { TestToken1, TestToken3 } from './seeds/tokens.js';
import assert from 'node:assert';
import test from 'node:test';

test.describe('Tokens', () => {
  let graphqlFetch;
  let graphqlFetchAsNormalUser;
  let graphqlFetchAsAnonymousUser;

  test.before(async () => {
    await setupDatabase();
    graphqlFetch = createLoggedInGraphqlFetch(ADMIN_TOKEN);
    graphqlFetchAsNormalUser = createLoggedInGraphqlFetch(USER_TOKEN);
    graphqlFetchAsAnonymousUser = createAnonymousGraphqlFetch();
  });

  test.after(async () => {
    await disconnect();
  });

  test.describe('Query.tokens for admin user', () => {
    test('Return all tokens when no arguments passed', async () => {
      const {
        data: { tokens },
      } = await graphqlFetch({
        query: /* GraphQL */ `
          query Tokens {
            tokens {
              _id
              quantity
              status
              tokenSerialNumber
            }
          }
        `,
        variables: {},
      });
      assert.strictEqual(tokens.length, 4);
    });

    test('Return tokens with all fields', async () => {
      const {
        data: { tokens },
      } = await graphqlFetch({
        query: /* GraphQL */ `
          query Tokens {
            tokens {
              _id
              quantity
              status
              isInvalidateable
              tokenSerialNumber
              invalidatedDate
              accessKey
              product {
                _id
              }
            }
          }
        `,
        variables: {},
      });
      assert.strictEqual(tokens.length, 4);
      assert.ok(tokens.every((t) => typeof t._id === 'string'));
      assert.ok(tokens.every((t) => typeof t.quantity === 'number'));
      assert.ok(tokens.every((t) => typeof t.status === 'string'));
    });

    test('Return tokens with limit', async () => {
      const {
        data: { tokens },
      } = await graphqlFetch({
        query: /* GraphQL */ `
          query Tokens($limit: Int) {
            tokens(limit: $limit) {
              _id
              tokenSerialNumber
            }
          }
        `,
        variables: {
          limit: 2,
        },
      });
      assert.strictEqual(tokens.length, 2);
    });

    test('Return tokens with offset', async () => {
      const {
        data: { tokens },
      } = await graphqlFetch({
        query: /* GraphQL */ `
          query Tokens($offset: Int) {
            tokens(offset: $offset) {
              _id
              tokenSerialNumber
            }
          }
        `,
        variables: {
          offset: 2,
        },
      });
      assert.strictEqual(tokens.length, 2);
    });

    test('Return tokens with limit and offset', async () => {
      const {
        data: { tokens },        
      } = await graphqlFetch({
        query: /* GraphQL */ `
          query Tokens($limit: Int, $offset: Int) {
            tokens(limit: $limit, offset: $offset) {
              _id
              tokenSerialNumber
            }
          }
        `,
        variables: {
          limit: 1,
          offset: 1,
        },
      });
      assert.strictEqual(tokens.length, 1);
    });

    test('Return tokens filtered by queryString', async () => {
      const {
        data: { tokens },
      } = await graphqlFetch({
        query: /* GraphQL */ `
          query Tokens($queryString: String) {
            tokens(queryString: $queryString) {
              _id
              tokenSerialNumber
            }
          }
        `,
        variables: {
          queryString: 'TOKEN001',
        },
      });
      assert.strictEqual(tokens.length, 1);
      assert.strictEqual(tokens[0]._id, TestToken1._id);
    });

    test('Return empty array when no matching queryString found', async () => {
      const {
        data: { tokens },
      } = await graphqlFetch({
        query: /* GraphQL */ `
          query Tokens($queryString: String) {
            tokens(queryString: $queryString) {
              _id
              tokenSerialNumber
            }
          }
        `,
        variables: {
          queryString: 'wrong',
        },
      });
      assert.strictEqual(tokens.length, 0);
    });
  });

  test.describe('Query.tokens for normal user', () => {
    test('Return NoPermissionError', async () => {
      const { errors } = await graphqlFetchAsNormalUser({
        query: /* GraphQL */ `
          query Tokens($queryString: String) {
            tokens(queryString: $queryString) {
              _id
              tokenSerialNumber
            }
          }
        `,
        variables: {
          queryString: 'TOKEN003',
        },
      });
      assert.strictEqual(errors[0]?.extensions?.code, 'NoPermissionError');
    });
  });

  test.describe('Query.tokens for anonymous user', () => {
    test('Return error when accessing tokens', async () => {
      const { errors } = await graphqlFetchAsAnonymousUser({
        query: /* GraphQL */ `
          query Tokens {
            tokens {
              _id
              tokenSerialNumber
            }
          }
        `,
        variables: {},
      });
      assert.strictEqual(errors[0]?.extensions?.code, 'NoPermissionError');
    });
  });

  test.describe('Query.token for admin user', () => {
    test('Return single token by ID', async () => {
      const {
        data: { token },
      } = await graphqlFetch({
        query: /* GraphQL */ `
          query Token($tokenId: ID!) {
            token(tokenId: $tokenId) {
              _id
              quantity
              status
              tokenSerialNumber
              accessKey
              product {
                _id
              }
            }
          }
        `,
        variables: {
          tokenId: TestToken1._id,
        },
      });
      assert.strictEqual(token._id, TestToken1._id);
      assert.strictEqual(token.tokenSerialNumber, TestToken1.tokenSerialNumber);
      assert.strictEqual(token.quantity, TestToken1.quantity);
    });

    test('Return null for non-existing token ID', async () => {
      const {
        data: { token },
      } = await graphqlFetch({
        query: /* GraphQL */ `
          query Token($tokenId: ID!) {
            token(tokenId: $tokenId) {
              _id
              tokenSerialNumber
            }
          }
        `,
        variables: {
          tokenId: 'non-existing-id',
        },
      });
      assert.strictEqual(token, null);
    });
  });

  test.describe('Query.token for normal user', () => {
    test('Return token if user owns it', async () => {
      const {
        data: { token },
      } = await graphqlFetchAsNormalUser({
        query: /* GraphQL */ `
          query Token($tokenId: ID!) {
            token(tokenId: $tokenId) {
              _id
              tokenSerialNumber
              quantity
            }
          }
        `,
        variables: {
          tokenId: TestToken3._id,
        },
      });
      assert.strictEqual(token._id, TestToken3._id);
    });

    test('Return null if token belongs to another user', async () => {
      const {
        data: { token },
      } = await graphqlFetchAsNormalUser({
        query: /* GraphQL */ `
          query Token($tokenId: ID!) {
            token(tokenId: $tokenId) {
              _id
              tokenSerialNumber
            }
          }
        `,
        variables: {
          tokenId: TestToken1._id,
        },
      });
      assert.strictEqual(token, null);
    });
  });

  test.describe('Query.token for anonymous user', () => {
    test('Return error when accessing token', async () => {
      const { errors } = await graphqlFetchAsAnonymousUser({
        query: /* GraphQL */ `
          query Token($tokenId: ID!) {
            token(tokenId: $tokenId) {
              _id
              tokenSerialNumber
            }
          }
        `,
        variables: {
          tokenId: TestToken1._id,
        },
      });
      assert.strictEqual(errors[0]?.extensions?.code, 'NoPermissionError');
    });
  });

  test.describe('Query.tokensCount for admin user', () => {
    test('Return count of all tokens when no arguments passed', async () => {
      const {
        data: { tokensCount },
      } = await graphqlFetch({
        query: /* GraphQL */ `
          query {
            tokensCount
          }
        `,
        variables: {},
      });
      assert.strictEqual(tokensCount, 4);
    });

    test('Return count of tokens filtered by queryString', async () => {
      const {
        data: { tokensCount },
      } = await graphqlFetch({
        query: /* GraphQL */ `
          query TokensCount($queryString: String) {
            tokensCount(queryString: $queryString)
          }
        `,
        variables: {
          queryString: 'TOKEN001',
        },
      });
      assert.strictEqual(tokensCount, 1);
    });

    test('Return 0 for non-matching queryString', async () => {
      const {
        data: { tokensCount },
      } = await graphqlFetch({
        query: /* GraphQL */ `
          query TokensCount($queryString: String) {
            tokensCount(queryString: $queryString)
          }
        `,
        variables: {
          queryString: 'wrong',
        },
      });
      assert.strictEqual(tokensCount, 0);
    });
  });

  test.describe('Query.tokensCount for normal user', () => {
    test('Return NoPermissionError', async () => {
      const { errors } = await graphqlFetchAsNormalUser({
        query: /* GraphQL */ `
          query {
            tokensCount
          }
        `,
        variables: {},
      });
      assert.strictEqual(errors[0]?.extensions?.code, 'NoPermissionError');
    });
  });

  test.describe('Query.tokensCount for anonymous user', () => {
    test('Return error when accessing tokensCount', async () => {
      const { errors } = await graphqlFetchAsAnonymousUser({
        query: /* GraphQL */ `
          query {
            tokensCount
          }
        `,
        variables: {},
      });
      assert.strictEqual(errors[0]?.extensions?.code, 'NoPermissionError');
    });
  });
});
