import {
  setupDatabase,
  createLoggedInGraphqlFetch,
  createAnonymousGraphqlFetch,
} from './helpers';
import { ADMIN_TOKEN } from './seeds/users';

let connection;
let graphqlFetch;
let graphqlAnonymousFetch;

describe('Logs', () => {
  beforeAll(async () => {
    [, connection] = await setupDatabase();
    graphqlFetch = await createLoggedInGraphqlFetch(ADMIN_TOKEN);
    graphqlAnonymousFetch = await createAnonymousGraphqlFetch();
  });

  afterAll(async () => {
    await connection.close();
  });

  describe('Query.Logs for admin user should', () => {
    it('return the first 100 records when no argument is given', async () => {
      const {
        data: { logs },
      } = await graphqlFetch({
        query: /* GraphQL */ `
          query Logs {
            logs {
              _id
              created
              level
              message
              user {
                _id
              }
              order {
                _id
              }
            }
          }
        `,
        variables: {},
      });
      expect(logs.length).toEqual(100);
    });

    it("return list of element specied by it's limit arg", async () => {
      const {
        data: { logs },
      } = await graphqlFetch({
        query: /* GraphQL */ `
          query Logs($limit: Int = 100, $offset: Int = 0) {
            logs(limit: $limit, offset: $offset) {
              _id
            }
          }
        `,
        variables: {
          limit: 50,
        },
      });
      expect(logs.length).toEqual(50);
    });

    it('return the last 3 logs of the 100 first log records', async () => {
      const {
        data: { logs },
      } = await graphqlFetch({
        query: /* GraphQL */ `
          query Logs($limit: Int = 100, $offset: Int = 0) {
            logs(limit: $limit, offset: $offset) {
              _id
            }
          }
        `,
        variables: {
          limit: 3,
          offset: 97,
        },
      });
      expect(logs.length).toEqual(3);
    });
  });

  describe('Query.Logs for anonymous user should', () => {
    it('return error', async () => {
      const { errors } = await graphqlAnonymousFetch({
        query: /* GraphQL */ `
          query Logs($limit: Int = 100, $offset: Int = 0) {
            logs(limit: $limit, offset: $offset) {
              _id
            }
          }
        `,
        variables: {
          limit: 50,
          offset: 97,
        },
      });

      expect(errors[0]?.extensions.code).toBe('NoPermissionError');
    });
  });

  describe('Query.LogsCount for admin user should', () => {
    it('return the first 100 records when no argument is given', async () => {
      const {
        data: { logsCount },
      } = await graphqlFetch({
        query: /* GraphQL */ `
          query LogsCount {
            logsCount
          }
        `,
        variables: {},
      });
      expect(logsCount > 0).toBe(true);
    });
  });

  describe('Query.LogsCount for anonymous user should', () => {
    it('return the first 100 records when no argument is given', async () => {
      const { errors } = await graphqlAnonymousFetch({
        query: /* GraphQL */ `
          query LogsCount {
            logsCount
          }
        `,
        variables: {},
      });
      expect(errors[0]?.extensions.code).toBe('NoPermissionError');
    });
  });
});
