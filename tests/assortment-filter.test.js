import {
  setupDatabase,
  createLoggedInGraphqlFetch,
  createAnonymousGraphqlFetch,
} from './helpers';
import { ADMIN_TOKEN } from './seeds/users';
import { SimpleAssortment, AssortmentFilters } from './seeds/assortments';
import { MultiChoiceFilter } from './seeds/filters';

let connection;
let graphqlFetch;

describe('AssortmentFilter', () => {
  beforeAll(async () => {
    [, connection] = await setupDatabase();
    graphqlFetch = await createLoggedInGraphqlFetch(ADMIN_TOKEN);
  });

  afterAll(async () => {
    await connection.close();
  });

  describe('mutation.reorderAssortmentFilters for admin users should', () => {
    it('update sortkey value when passed valid assortment filter ID', async () => {
      const {
        data: { reorderAssortmentFilters },
      } = await graphqlFetch({
        query: /* GraphQL */ `
          mutation ReorderAssortmentFilters(
            $sortkeys: [ReorderAssortmentFilterInput!]!
          ) {
            reorderAssortmentFilters(sortKeys: $sortkeys) {
              _id
              sortKey
              tags
              meta
              assortment {
                _id
              }
              filter {
                _id
              }
            }
          }
        `,
        variables: {
          sortkeys: [
            {
              assortmentFilterId: AssortmentFilters[0]._id,
              sortKey: 10,
            },
          ],
        },
      });

      expect(reorderAssortmentFilters[0].sortKey).toEqual(11);
    });

    it('skip when passed invalid assortment filter ID', async () => {
      const {
        data: { reorderAssortmentFilters },
      } = await graphqlFetch({
        query: /* GraphQL */ `
          mutation ReorderAssortmentFilters(
            $sortkeys: [ReorderAssortmentFilterInput!]!
          ) {
            reorderAssortmentFilters(sortKeys: $sortkeys) {
              _id
            }
          }
        `,
        variables: {
          sortkeys: [
            {
              assortmentFilterId: 'invalid-id',
              sortKey: 10,
            },
          ],
        },
      });

      expect(reorderAssortmentFilters.length).toEqual(0);
    });
  });

  describe('mutation.reorderAssortmentFilters for anonymous user should', () => {
    const graphqlAnonymousFetch = createAnonymousGraphqlFetch();
    it('return error', async () => {
      const { errors } = await graphqlAnonymousFetch({
        query: /* GraphQL */ `
          mutation ReorderAssortmentFilters(
            $sortkeys: [ReorderAssortmentFilterInput!]!
          ) {
            reorderAssortmentFilters(sortKeys: $sortkeys) {
              _id
            }
          }
        `,
        variables: {
          sortkeys: [
            {
              assortmentFilterId: AssortmentFilters[0]._id,
              sortKey: 10,
            },
          ],
        },
      });

      expect(errors.length).toEqual(1);
    });
  });

  describe('mutation.addAssortmentFilter for admin users should', () => {
    it('Creates assortment filter successfuly when passed a valid assortment and filter IDs', async () => {
      const {
        data: { addAssortmentFilter },
      } = await graphqlFetch({
        query: /* GraphQL */ `
          mutation AddAssortmentFilter(
            $assortmentId: ID!
            $filterId: ID!
            $tags: [String!]
          ) {
            addAssortmentFilter(
              assortmentId: $assortmentId
              filterId: $filterId
              tags: $tags
            ) {
              _id
              sortKey
              tags
              assortment {
                _id
              }
              filter {
                _id
              }
            }
          }
        `,
        variables: {
          assortmentId: SimpleAssortment[0]._id,
          filterId: MultiChoiceFilter._id,
          tags: ['assortment-filter-1'],
        },
      });

      expect(addAssortmentFilter._id).not.toBe(null);
    });

    it('return error when passed invalid assortment ID', async () => {
      const { errors } = await graphqlFetch({
        query: /* GraphQL */ `
          mutation AddAssortmentFilter(
            $assortmentId: ID!
            $filterId: ID!
            $tags: [String!]
          ) {
            addAssortmentFilter(
              assortmentId: $assortmentId
              filterId: $filterId
              tags: $tags
            ) {
              _id
            }
          }
        `,
        variables: {
          assortmentId: 'invalid-assortment-id',
          filterId: MultiChoiceFilter._id,
          tags: ['assortment-filter-1'],
        },
      });

      expect(errors.length).toEqual(1);
    });

    it('return error when passed invalid filter ID', async () => {
      const { errors } = await graphqlFetch({
        query: /* GraphQL */ `
          mutation AddAssortmentFilter(
            $assortmentId: ID!
            $filterId: ID!
            $tags: [String!]
          ) {
            addAssortmentFilter(
              assortmentId: $assortmentId
              filterId: $filterId
              tags: $tags
            ) {
              _id
            }
          }
        `,
        variables: {
          assortmentId: SimpleAssortment[0]._id,
          filterId: 'invalid-filter-id',
          tags: ['assortment-filter-1'],
        },
      });
      expect(errors.length).toEqual(1);
    });
  });

  describe('mutation.addAssortmentFilter for anonymous users should', () => {
    it('return error', async () => {
      const graphqlAnonymousFetch = await createAnonymousGraphqlFetch();

      const { errors } = await graphqlAnonymousFetch({
        query: /* GraphQL */ `
          mutation AddAssortmentFilter(
            $assortmentId: ID!
            $filterId: ID!
            $tags: [String!]
          ) {
            addAssortmentFilter(
              assortmentId: $assortmentId
              filterId: $filterId
              tags: $tags
            ) {
              _id
            }
          }
        `,
        variables: {
          assortmentId: SimpleAssortment[0]._id,
          filterId: MultiChoiceFilter._id,
          tags: ['assortment-filter-1'],
        },
      });

      expect(errors.length).toEqual(1);
    });
  });

  describe('mutation.removeAssortmentFilter for admin users should', () => {
    it('remove assortment filter successfuly when passed valid ID', async () => {
      const {
        // eslint-disable-next-line no-unused-vars
        data: { removeAssortmentFilter },
      } = await graphqlFetch({
        query: /* GraphQL */ `
          mutation RemoveAssortmentFilter($assortmentFilterId: ID!) {
            removeAssortmentFilter(assortmentFilterId: $assortmentFilterId) {
              _id
              sortKey
              tags
              meta
              assortment {
                _id
              }
              filter {
                _id
              }
            }
          }
        `,
        variables: {
          assortmentFilterId: AssortmentFilters[0]._id,
        },
      });

      const { errors } = await graphqlFetch({
        query: /* GraphQL */ `
          mutation RemoveAssortmentFilter($assortmentFilterId: ID!) {
            removeAssortmentFilter(assortmentFilterId: $assortmentFilterId) {
              _id
            }
          }
        `,
        variables: {
          assortmentFilterId: AssortmentFilters[0]._id,
        },
      });

      expect(errors.length).toEqual(1);
    });
  });

  describe('mutation.removeAssortmentFilter for anonymous users should', () => {
    it('return error', async () => {
      const graphqlAnonymousFetch = await createAnonymousGraphqlFetch();
      const { errors } = await graphqlAnonymousFetch({
        query: /* GraphQL */ `
          mutation RemoveAssortmentFilter($assortmentFilterId: ID!) {
            removeAssortmentFilter(assortmentFilterId: $assortmentFilterId) {
              _id
              sortKey
              tags
              meta
              assortment {
                _id
              }
              filter {
                _id
              }
            }
          }
        `,
        variables: {
          assortmentFilterId: AssortmentFilters[0]._id,
        },
      });
      expect(errors.length).toEqual(1);
    });
  });
});
