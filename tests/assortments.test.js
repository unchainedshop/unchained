import { setupDatabase, createLoggedInGraphqlFetch, createAnonymousGraphqlFetch } from './helpers.js';
import { ADMIN_TOKEN, USER_TOKEN } from './seeds/users.js';
import { SimpleAssortment } from './seeds/assortments.js';
import assert from 'node:assert';
import { describe, it, before } from 'node:test';

let graphqlFetch;
let graphqlFetchAsAnonymousUser;
let graphqlFetchAsNormalUser;

describe('Assortments', () => {
  before(async () => {
    await setupDatabase();
    graphqlFetch = createLoggedInGraphqlFetch(ADMIN_TOKEN);
    graphqlFetchAsNormalUser = createLoggedInGraphqlFetch(USER_TOKEN);
    graphqlFetchAsAnonymousUser = createAnonymousGraphqlFetch();
  });

  describe('Query.assortments for admin user should', () => {
    it('Return the only active assortments when no argument passed', async () => {
      const {
        data: { assortments },
      } = await graphqlFetch({
        query: /* GraphQL */ `
          query Assortments {
            assortments {
              _id
            }
          }
        `,
        variables: {},
      });
      assert.strictEqual(assortments.length, 4);
    });

    it('Return active assortments and include leaves', async () => {
      const result = await graphqlFetch({
        query: /* GraphQL */ `
          query Assortments(
            $limit: Int = 100
            $offset: Int = 0
            $includeInactives: Boolean = false
            $includeLeaves: Boolean = false
          ) {
            assortments(
              limit: $limit
              offset: $offset
              includeInactive: $includeInactives
              includeLeaves: $includeLeaves
            ) {
              _id
              created
              updated
              isActive
              isBase
              isRoot
              sequence
              tags
              texts {
                _id
              }
              productAssignments {
                _id
              }
              filterAssignments {
                _id
              }
              linkedAssortments {
                _id
              }
              assortmentPaths {
                links {
                  assortmentId
                  assortmentTexts {
                    _id
                  }
                  link {
                    _id
                  }
                }
              }
              children {
                _id
              }
              searchProducts {
                productsCount
                filteredProductsCount
                filters {
                  productsCount
                  filteredProductsCount
                  definition {
                    _id
                  }
                  isSelected
                  options {
                    filteredProductsCount
                    definition {
                      _id
                    }
                    isSelected
                  }
                }
                products {
                  _id
                }
              }
            }
          }
        `,
        variables: {
          includeLeaves: true,
        },
      });
      assert.strictEqual(result.data.assortments.length, 5);
    });

    it('Return all assortments and without leaves', async () => {
      const {
        data: { assortments },
      } = await graphqlFetch({
        query: /* GraphQL */ `
          query Assortments(
            $limit: Int = 100
            $offset: Int = 0
            $includeInactive: Boolean = false
            $includeLeaves: Boolean = false
          ) {
            assortments(
              limit: $limit
              offset: $offset
              includeInactive: $includeInactive
              includeLeaves: $includeLeaves
            ) {
              _id
            }
          }
        `,
        variables: {
          includeInactive: true,
          includeLeaves: false,
        },
      });

      assert.strictEqual(assortments.length, 8);
    });

    it('Return all assortments and include leaves', async () => {
      const {
        data: { assortments },
      } = await graphqlFetch({
        query: /* GraphQL */ `
          query Assortments(
            $limit: Int = 100
            $offset: Int = 0
            $includeInactive: Boolean = false
            $includeLeaves: Boolean = false
          ) {
            assortments(
              limit: $limit
              offset: $offset
              includeInactive: $includeInactive
              includeLeaves: $includeLeaves
            ) {
              _id
            }
          }
        `,
        variables: {
          includeInactive: true,
          includeLeaves: true,
        },
      });

      assert.strictEqual(assortments.length, 10);
    });

    it('Search assortments by slug', async () => {
      const {
        data: { assortments },
      } = await graphqlFetch({
        query: /* GraphQL */ `
          query Assortments($queryString: String, $includeLeaves: Boolean, $includeInactive: Boolean) {
            assortments(
              queryString: $queryString
              includeLeaves: $includeLeaves
              includeInactive: $includeInactive
            ) {
              _id
            }
          }
        `,
        variables: {
          queryString: 'search-purpose',
          includeLeaves: true,
          includeInactive: true,
        },
      });

      assert.strictEqual(assortments.length, 2);
    });
  });

  describe('Query.assortmentsCount for admin user should', () => {
    it('Return number of only active assortments when no argument passed', async () => {
      const {
        data: { assortmentsCount },
      } = await graphqlFetch({
        query: /* GraphQL */ `
          query {
            assortmentsCount
          }
        `,
        variables: {},
      });

      assert.strictEqual(assortmentsCount, 4);
    });

    it('Return number of active assortments and include leaves', async () => {
      const {
        data: { assortmentsCount },
      } = await graphqlFetch({
        query: /* GraphQL */ `
          query AssortmentsCount($includeInactives: Boolean, $includeLeaves: Boolean) {
            assortmentsCount(includeInactive: $includeInactives, includeLeaves: $includeLeaves)
          }
        `,
        variables: {
          includeLeaves: true,
        },
      });
      assert.strictEqual(assortmentsCount, 5);
    });

    it('Return number assortments of without leaves including inactives', async () => {
      const {
        data: { assortmentsCount },
      } = await graphqlFetch({
        query: /* GraphQL */ `
          query AssortmentsCount($includeInactive: Boolean, $includeLeaves: Boolean) {
            assortmentsCount(includeInactive: $includeInactive, includeLeaves: $includeLeaves)
          }
        `,
        variables: {
          includeInactive: true,
          includeLeaves: false,
        },
      });

      assert.strictEqual(assortmentsCount, 8);
    });

    it('Return number of all assortments and include leaves', async () => {
      const {
        data: { assortmentsCount },
      } = await graphqlFetch({
        query: /* GraphQL */ `
          query AssortmentsCount($includeInactive: Boolean, $includeLeaves: Boolean) {
            assortmentsCount(includeInactive: $includeInactive, includeLeaves: $includeLeaves)
          }
        `,
        variables: {
          includeInactive: true,
          includeLeaves: true,
        },
      });

      assert.strictEqual(assortmentsCount, 10);
    });
  });

  describe('Query.assortmentsCount for normal user should', () => {
    it('Return number of only active assortments when no argument passed', async () => {
      const {
        data: { assortmentsCount },
      } = await graphqlFetchAsNormalUser({
        query: /* GraphQL */ `
          query {
            assortmentsCount
          }
        `,
        variables: {},
      });

      assert.strictEqual(assortmentsCount, 4);
    });
  });

  describe('Query.assortmentsCount for anonymous user should', () => {
    it('Return number of only active assortments when no argument passed', async () => {
      const {
        data: { assortmentsCount },
      } = await graphqlFetchAsAnonymousUser({
        query: /* GraphQL */ `
          query {
            assortmentsCount
          }
        `,
        variables: {},
      });

      assert.strictEqual(assortmentsCount, 4);
    });
  });

  describe('Query.assortment for admin user should', () => {
    it('return single assortment based on id', async () => {
      const {
        data: { assortment },
      } = await graphqlFetch({
        query: /* GraphQL */ `
          query Assortment($assortmentId: ID) {
            assortment(assortmentId: $assortmentId) {
              _id
              created
              updated
              isActive
              isBase
              isRoot
              sequence
              tags
              texts {
                _id
              }
              productAssignments {
                _id
              }
              filterAssignments {
                _id
              }
              linkedAssortments {
                _id
              }
              assortmentPaths {
                links {
                  assortmentId
                  assortmentTexts {
                    _id
                  }
                  link {
                    _id
                  }
                }
              }
              children {
                _id
              }
              searchProducts {
                productsCount
                filteredProductsCount
                filters {
                  productsCount
                  filteredProductsCount
                  definition {
                    _id
                  }
                  isSelected
                  options {
                    filteredProductsCount
                    definition {
                      _id
                    }
                    isSelected
                  }
                }
                products {
                  _id
                }
              }
            }
          }
        `,
        variables: {
          assortmentId: SimpleAssortment[0]._id,
        },
      });
      assert.strictEqual(assortment._id, SimpleAssortment[0]._id);
    });

    it('return single assortment based on slug', async () => {
      const {
        data: { assortment },
      } = await graphqlFetch({
        query: /* GraphQL */ `
          query Assortment($assortmentId: ID, $slug: String) {
            assortment(assortmentId: $assortmentId, slug: $slug) {
              _id
            }
          }
        `,
        variables: {
          slug: SimpleAssortment[0].slugs[0],
        },
      });

      assert.strictEqual(assortment._id, SimpleAssortment[0]._id);
    });

    it('return error for non-existing id', async () => {
      const { errors } = await graphqlFetch({
        query: /* GraphQL */ `
          query Assortment($assortmentId: ID, $slug: String) {
            assortment(assortmentId: $assortmentId, slug: $slug) {
              _id
            }
          }
        `,
        variables: {
          assortmentId: '',
        },
      });

      assert.strictEqual(errors[0]?.extensions?.code, 'InvalidIdError');
    });

    it('return error for non-existing slug', async () => {
      const { errors } = await graphqlFetch({
        query: /* GraphQL */ `
          query Assortment($assortmentId: ID, $slug: String) {
            assortment(assortmentId: $assortmentId, slug: $slug) {
              _id
            }
          }
        `,
        variables: {
          slug: '',
        },
      });

      assert.strictEqual(errors[0]?.extensions?.code, 'InvalidIdError');
    });

    it('return null when either id or slug are non-existing', async () => {
      const {
        data: { assortment },
      } = await graphqlFetch({
        query: /* GraphQL */ `
          query Assortment($assortmentId: ID, $slug: String) {
            assortment(assortmentId: $assortmentId, slug: $slug) {
              _id
            }
          }
        `,
        variables: {
          assortmentId: SimpleAssortment[0]._id,
          slug: 'non-existing-slug',
        },
      });

      assert.strictEqual(assortment, null);
    });
  });

  describe('Query.searchAssortments for admin user should', () => {
    it('Return assortments successfuly', async () => {
      const {
        data: { searchAssortments },
      } = await graphqlFetch({
        query: /* GraphQL */ `
          query searchAssortments($queryString: String) {
            searchAssortments(queryString: $queryString, includeInactive: true) {
              assortmentsCount
              assortments {
                _id
                isActive
                texts {
                  _id
                  title
                  description
                }
              }
            }
          }
        `,
        variables: {
          queryString: 'simple-assortment',
        },
      });

      assert.strictEqual(searchAssortments.assortmentsCount, 1);
      assert.deepStrictEqual(searchAssortments.assortments[0].texts, {
        _id: 'german',
        title: 'simple assortment de',
        description: 'text-de',
      });
    });
  });

  describe('Query.searchAssortments for anonymous user should', () => {
    it('Return assortments', async () => {
      const graphqlAnonymousFetch = createAnonymousGraphqlFetch();
      const {
        data: {
          searchAssortments: { assortments },
        },
      } = await graphqlAnonymousFetch({
        query: /* GraphQL */ `
          query searchAssortments($queryString: String) {
            searchAssortments(queryString: $queryString) {
              assortmentsCount
              assortments {
                _id
                isActive
                texts {
                  _id
                  title
                  description
                }
              }
            }
          }
        `,
        variables: {
          queryString: 'simple-assortment',
        },
      });
      assert.strictEqual(assortments.length, 0);
    });
  });

  describe('Query.assortments for anonymous user should', () => {
    it('return assortments', async () => {
      const graphqlAnonymousFetch = createAnonymousGraphqlFetch();
      const {
        data: { assortments },
      } = await graphqlAnonymousFetch({
        query: /* GraphQL */ `
          query Assortments {
            assortments {
              _id
            }
          }
        `,
        variables: {},
      });
      assert.strictEqual(assortments.length, 4);
    });
  });

  describe('mutation.createAssortment for admin user should', () => {
    it('Create assortment successfuly', async () => {
      const {
        data: { createAssortment },
      } = await graphqlFetch({
        query: /* GraphQL */ `
          mutation CreateAssortment(
            $assortment: CreateAssortmentInput!
            $texts: [AssortmentTextInput!]
          ) {
            createAssortment(assortment: $assortment, texts: $texts) {
              _id
              created
              updated
              isActive
              isBase
              isRoot
              sequence
              tags
              texts {
                _id
                locale
                slug
                subtitle
                description
                title
              }
              productAssignments {
                _id
                sortKey
                tags
                assortment {
                  _id
                }
                product {
                  _id
                }
              }
              filterAssignments {
                _id
              }
              linkedAssortments {
                _id
              }
              assortmentPaths {
                links {
                  assortmentId
                }
              }
              children {
                _id
              }
              searchProducts {
                productsCount
              }
            }
          }
        `,
        variables: {
          assortment: {
            isRoot: true,
            tags: ['test-assrtment-1', 'test-assortment-2'],
          },
          texts: [{ title: 'test assortment', locale: 'de' }],
        },
      });
      assert.deepStrictEqual(createAssortment.tags, ['test-assrtment-1', 'test-assortment-2']);
      assert.strictEqual(createAssortment.isRoot, true);
      assert.strictEqual(createAssortment.texts.title, 'test assortment');
    });
  });

  describe('mutation.createAssortment for anonymous user should', () => {
    it('Return error', async () => {
      const graphqlAnonymousFetch = createAnonymousGraphqlFetch();
      const { errors } = await graphqlAnonymousFetch({
        query: /* GraphQL */ `
          mutation CreateAssortment(
            $assortment: CreateAssortmentInput!
            $texts: [AssortmentTextInput!]
          ) {
            createAssortment(assortment: $assortment, texts: $texts) {
              _id
            }
          }
        `,
        variables: {
          assortment: {
            isRoot: true,
            tags: ['test-assrtment-1', 'test-assortment-2'],
          },
          texts: [{ title: 'test assortment', locale: 'de' }],
        },
      });

      assert.strictEqual(errors[0].extensions?.code, 'NoPermissionError');
    });
  });

  describe('mutation.updateAssortment for admin user should', () => {
    it('update assortment successfuly when passed valid assortment Id', async () => {
      const {
        data: { updateAssortment },
      } = await graphqlFetch({
        query: /* GraphQL */ `
          mutation UpdateAssortment($assortment: UpdateAssortmentInput!, $assortmentId: ID!) {
            updateAssortment(assortment: $assortment, assortmentId: $assortmentId) {
              _id
              created
              updated
              isActive
              isBase
              isRoot
              sequence
              tags
              texts {
                _id
                locale
                slug
                subtitle
                description
              }
              productAssignments {
                _id
                sortKey
                tags
                assortment {
                  _id
                }
                product {
                  _id
                }
              }
              filterAssignments {
                _id
              }
              linkedAssortments {
                _id
              }
              assortmentPaths {
                links {
                  assortmentId
                }
              }
              children {
                _id
              }
              searchProducts {
                productsCount
              }
            }
          }
        `,
        variables: {
          assortmentId: SimpleAssortment[0]._id,
          assortment: {
            isRoot: false,
            tags: ['test-assrtment-1', 'test-assortment-2'],
            isActive: true,
          },
        },
      });
      assert.deepStrictEqual(updateAssortment.tags, ['test-assrtment-1', 'test-assortment-2']);
      assert.strictEqual(updateAssortment.isRoot, false);
      assert.strictEqual(updateAssortment.isActive, true);
    });

    it('return not found error when passed none existing assortment Id', async () => {
      const { errors } = await graphqlFetch({
        query: /* GraphQL */ `
          mutation UpdateAssortment($assortment: UpdateAssortmentInput!, $assortmentId: ID!) {
            updateAssortment(assortment: $assortment, assortmentId: $assortmentId) {
              _id
            }
          }
        `,
        variables: {
          assortmentId: 'non-existing-id',
          assortment: {
            isRoot: false,
            tags: ['test-assrtment-1', 'test-assortment-2'],
            isActive: true,
          },
        },
      });
      assert.strictEqual(errors[0]?.extensions?.code, 'AssortmentNotFoundError');
    });

    it('return error when passed invalid assortment Id', async () => {
      const { errors } = await graphqlFetch({
        query: /* GraphQL */ `
          mutation UpdateAssortment($assortment: UpdateAssortmentInput!, $assortmentId: ID!) {
            updateAssortment(assortment: $assortment, assortmentId: $assortmentId) {
              _id
            }
          }
        `,
        variables: {
          assortmentId: '',
          assortment: {
            isRoot: false,
            tags: ['test-assrtment-1', 'test-assortment-2'],
            isActive: true,
          },
        },
      });
      assert.strictEqual(errors[0]?.extensions?.code, 'InvalidIdError');
    });
  });

  describe('mutation.updateAssortment for anonymous user should', () => {
    it('Return error', async () => {
      const graphqlAnonymousFetch = createAnonymousGraphqlFetch();
      const { errors } = await graphqlAnonymousFetch({
        query: /* GraphQL */ `
          mutation UpdateAssortment($assortment: UpdateAssortmentInput!, $assortmentId: ID!) {
            updateAssortment(assortment: $assortment, assortmentId: $assortmentId) {
              _id
            }
          }
        `,
        variables: {
          assortmentId: SimpleAssortment[0]._id,
          assortment: {
            isRoot: false,
            tags: ['test-assrtment-1', 'test-assortment-2'],
            isActive: true,
          },
        },
      });

      assert.strictEqual(errors[0]?.extensions?.code, 'NoPermissionError');
    });
  });

  describe('mutation.setBaseAssortment for admin user should', () => {
    it('change isBase property to true when passed valid assortment Id', async () => {
      const {
        data: { setBaseAssortment },
      } = await graphqlFetch({
        query: /* GraphQL */ `
          mutation SetBaseAssortment($assortmentId: ID!) {
            setBaseAssortment(assortmentId: $assortmentId) {
              _id
              created
              updated
              isActive
              isBase
              isRoot
              sequence
              tags
              texts {
                _id
                locale
                slug
                subtitle
                description
              }
              productAssignments {
                _id
                sortKey
                tags
                assortment {
                  _id
                }
                product {
                  _id
                }
              }
              filterAssignments {
                _id
              }
              linkedAssortments {
                _id
              }
              assortmentPaths {
                links {
                  assortmentId
                }
              }
              children {
                _id
              }
              searchProducts {
                productsCount
              }
            }
          }
        `,
        variables: {
          assortmentId: SimpleAssortment[1]._id,
        },
      });
      assert.strictEqual(setBaseAssortment.isBase, true);
    });

    it('return not found error when passed none existing assortment Id', async () => {
      const { errors } = await graphqlFetch({
        query: /* GraphQL */ `
          mutation SetBaseAssortment($assortmentId: ID!) {
            setBaseAssortment(assortmentId: $assortmentId) {
              _id
            }
          }
        `,
        variables: {
          assortmentId: 'non-existing-id',
        },
      });
      assert.strictEqual(errors[0]?.extensions?.code, 'AssortmentNotFoundError');
    });

    it('return error when passed invalid assortment Id', async () => {
      const { errors } = await graphqlFetch({
        query: /* GraphQL */ `
          mutation SetBaseAssortment($assortmentId: ID!) {
            setBaseAssortment(assortmentId: $assortmentId) {
              _id
            }
          }
        `,
        variables: {
          assortmentId: '',
        },
      });
      assert.strictEqual(errors[0]?.extensions?.code, 'InvalidIdError');
    });
  });

  describe('mutation.setBaseAssortment for anonymous user should', () => {
    it('Return error', async () => {
      const graphqlAnonymousFetch = createAnonymousGraphqlFetch();
      const { errors } = await graphqlAnonymousFetch({
        query: /* GraphQL */ `
          mutation SetBaseAssortment($assortmentId: ID!) {
            setBaseAssortment(assortmentId: $assortmentId) {
              _id
            }
          }
        `,
        variables: {
          assortmentId: SimpleAssortment[1]._id,
        },
      });

      assert.strictEqual(errors[0].extensions?.code, 'NoPermissionError');
    });
  });

  describe('mutation.removeAssortment for admin user should', () => {
    it('Remove assortment successfuly when passed valid assortment Id', async () => {
      await graphqlFetch({
        query: /* GraphQL */ `
          mutation RemoveAssortment($assortmentId: ID!) {
            removeAssortment(assortmentId: $assortmentId) {
              _id
              created
              updated
              deleted
              isActive
              isBase
              isRoot
              sequence
              tags
              texts {
                _id
                locale
                slug
                subtitle
                description
              }
              productAssignments {
                _id
                sortKey
                tags
                assortment {
                  _id
                }
                product {
                  _id
                }
              }
              filterAssignments {
                _id
              }
              linkedAssortments {
                _id
              }
              assortmentPaths {
                links {
                  assortmentId
                }
              }
              children {
                _id
              }
              searchProducts {
                productsCount
              }
            }
          }
        `,
        variables: {
          assortmentId: SimpleAssortment[2]._id,
        },
      });

      const {
        data: { assortment },
      } = await graphqlFetch({
        query: /* GraphQL */ `
          query Assortment($assortmentId: ID!) {
            assortment(assortmentId: $assortmentId) {
              _id
              deleted
            }
          }
        `,
        variables: {
          assortmentId: SimpleAssortment[2]._id,
        },
      });

      assert.notStrictEqual(assortment.deleted, null);
    });

    it('return error when passed none existing assortment Id', async () => {
      const { errors } = await graphqlFetch({
        query: /* GraphQL */ `
          mutation RemoveAssortment($assortmentId: ID!) {
            removeAssortment(assortmentId: $assortmentId) {
              _id
            }
          }
        `,
        variables: {
          assortmentId: 'non-existing-id',
        },
      });

      assert.strictEqual(errors[0].extensions?.code, 'AssortmentNotFoundError');
    });
    it('return error when passed none existing assortment Id', async () => {
      const { errors } = await graphqlFetch({
        query: /* GraphQL */ `
          mutation RemoveAssortment($assortmentId: ID!) {
            removeAssortment(assortmentId: $assortmentId) {
              _id
            }
          }
        `,
        variables: {
          assortmentId: '',
        },
      });
      assert.strictEqual(errors[0].extensions?.code, 'InvalidIdError');
    });
  });

  describe('mutation.removeAssortment for anonymous user should', () => {
    it('Return error', async () => {
      const graphqlAnonymousFetch = createAnonymousGraphqlFetch();
      const { errors } = await graphqlAnonymousFetch({
        query: /* GraphQL */ `
          mutation RemoveAssortment($assortmentId: ID!) {
            removeAssortment(assortmentId: $assortmentId) {
              _id
            }
          }
        `,
        variables: {
          assortmentId: SimpleAssortment[3]._id,
        },
      });

      assert.strictEqual(errors[0].extensions?.code, 'NoPermissionError');
    });
  });
});
