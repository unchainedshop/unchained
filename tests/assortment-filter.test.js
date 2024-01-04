import {
  setupDatabase,
  createLoggedInGraphqlFetch,
  createAnonymousGraphqlFetch,
} from './helpers';
import { ADMIN_TOKEN } from './seeds/users.js';
import { SimpleAssortment, AssortmentFilters } from './seeds/assortments.js';
import { MultiChoiceFilter } from './seeds/filters.js';

let graphqlFetch;

describe('AssortmentFilter', () => {
  beforeAll(async () => {
    await setupDatabase();
    graphqlFetch = await createLoggedInGraphqlFetch(ADMIN_TOKEN);
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

      expect(reorderAssortmentFilters[0]).toEqual(
        {
          _id: AssortmentFilters[0]._id,
          sortKey: 11,
          tags: AssortmentFilters[0].tags,
          assortment: { _id: AssortmentFilters[0].assortmentId },
          filter: { _id: AssortmentFilters[0].filterId }
        }
      );
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
    it('return error', async () => {
      const graphqlAnonymousFetch = await createAnonymousGraphqlFetch();

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
      expect(errors[0].extensions?.code).toEqual('NoPermissionError');
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
            $tags: [LowerCaseString!]
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

      expect(addAssortmentFilter).toMatchObject({
        tags: ['assortment-filter-1'],
        assortment: { _id: SimpleAssortment[0]._id },
        filter: { _id: MultiChoiceFilter._id }
      });
    });

    it('return error when passed assortment ID that do not exists', async () => {
      const { errors } = await graphqlFetch({
        query: /* GraphQL */ `
          mutation AddAssortmentFilter(
            $assortmentId: ID!
            $filterId: ID!
            $tags: [LowerCaseString!]
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
      expect(errors[0].extensions?.code).toEqual('AssortmentNotFoundError');
    });

    it('return error when passed filter ID that do not exist', async () => {
      const { errors } = await graphqlFetch({
        query: /* GraphQL */ `
          mutation AddAssortmentFilter(
            $assortmentId: ID!
            $filterId: ID!
            $tags: [LowerCaseString!]
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
      expect(errors[0]?.extensions?.code).toEqual('FilterNotFoundError');
    });

    it('return error when passed invalid filter ID', async () => {
      const { errors } = await graphqlFetch({
        query: /* GraphQL */ `
          mutation AddAssortmentFilter(
            $assortmentId: ID!
            $filterId: ID!
            $tags: [LowerCaseString!]
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
          filterId: '',
          tags: ['assortment-filter-1'],
        },
      });
      expect(errors.length).toEqual(1);
      expect(errors[0]?.extensions?.code).toEqual('InvalidIdError');
    });

    it('return error when passed invalid assortment ID', async () => {
      const { errors } = await graphqlFetch({
        query: /* GraphQL */ `
          mutation AddAssortmentFilter(
            $assortmentId: ID!
            $filterId: ID!
            $tags: [LowerCaseString!]
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
          assortmentId: '',
          filterId: MultiChoiceFilter._id,
          tags: ['assortment-filter-1'],
        },
      });

      expect(errors.length).toEqual(1);
      expect(errors[0].extensions?.code).toEqual('InvalidIdError');
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
            $tags: [LowerCaseString!]
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
      expect(errors[0].extensions?.code).toEqual('NoPermissionError');
    });
  });

  describe('mutation.removeAssortmentFilter for admin users should', () => {
    it('remove assortment filter successfuly when passed valid ID', async () => {
      const {
        // eslint-disable-next-line
        data: { removeAssortmentFilter },
      } = await graphqlFetch({
        query: /* GraphQL */ `
          mutation RemoveAssortmentFilter($assortmentFilterId: ID!) {
            removeAssortmentFilter(assortmentFilterId: $assortmentFilterId) {
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
      expect(errors[0]?.extensions?.code).toEqual(
        'AssortmentFilterNotFoundError',
      );
    });

    it('return not found error when passed non existing assortmentFilterId', async () => {
      const { errors } = await graphqlFetch({
        query: /* GraphQL */ `
          mutation RemoveAssortmentFilter($assortmentFilterId: ID!) {
            removeAssortmentFilter(assortmentFilterId: $assortmentFilterId) {
              _id
            }
          }
        `,
        variables: {
          assortmentFilterId: 'invalid-id',
        },
      });

      expect(errors.length).toEqual(1);
      expect(errors[0]?.extensions?.code).toEqual(
        'AssortmentFilterNotFoundError',
      );
    });

    it('return error when passed non existing assortmentFilterId', async () => {
      const { errors } = await graphqlFetch({
        query: /* GraphQL */ `
          mutation RemoveAssortmentFilter($assortmentFilterId: ID!) {
            removeAssortmentFilter(assortmentFilterId: $assortmentFilterId) {
              _id
            }
          }
        `,
        variables: {
          assortmentFilterId: '',
        },
      });

      expect(errors.length).toEqual(1);
      expect(errors[0]?.extensions?.code).toEqual('InvalidIdError');
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
      expect(errors[0].extensions?.code).toEqual('NoPermissionError');
    });
  });
});
