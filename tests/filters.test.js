import { setupDatabase, createLoggedInGraphqlFetch } from './helpers';
import { ADMIN_TOKEN } from './seeds/users';

let connection;
let db; // eslint-disable-line
let graphqlFetch;

describe('Filters', () => {
  beforeAll(async () => {
    [db, connection] = await setupDatabase();
    graphqlFetch = await createLoggedInGraphqlFetch(ADMIN_TOKEN);
  });

  afterAll(async () => {
    await connection.close();
  });

  describe('Mutation.createFilter', () => {
    it('create a new filter', async () => {
      const { data: { createFilter } = {} } = await graphqlFetch({
        query: /* GraphQL */ `
          mutation createFilter($filter: CreateFilterInput!) {
            createFilter(filter: $filter) {
              _id
              isActive
              texts {
                title
              }
              type
              key
              options {
                _id
                texts {
                  _id
                  title
                  subtitle
                }
                value
              }
            }
          }
        `,
        variables: {
          filter: {
            key: 'warehousing.baseUnit',
            title: 'Mengeneinheit Filter',
            type: 'SINGLE_CHOICE',
            options: ['ST']
          }
        }
      });
      expect(createFilter).toMatchObject({
        isActive: false,
        texts: {
          title: 'Mengeneinheit Filter'
        },
        type: 'SINGLE_CHOICE',
        key: 'warehousing.baseUnit',
        options: [
          {
            texts: null,
            value: 'ST'
          }
        ]
      });
    });
  });
});
