import {
  setupDatabase,
  createLoggedInGraphqlFetch,
  createAnonymousGraphqlFetch,
} from './helpers.js';
import { ADMIN_TOKEN, USER_TOKEN } from './seeds/users.js';
import { SimpleAssortment, GermanAssortmentText } from './seeds/assortments.js';

let graphqlFetch;
let graphqlFetchAsAnonymousUser;
let graphqlFetchAsNormalUser;

describe('Assortments', () => {
  beforeAll(async () => {
    await setupDatabase();
    graphqlFetch = await createLoggedInGraphqlFetch(ADMIN_TOKEN);
    graphqlFetchAsNormalUser = await createLoggedInGraphqlFetch(USER_TOKEN);
    graphqlFetchAsAnonymousUser = await createAnonymousGraphqlFetch();
  });

  describe("Query.assortments for admin user should", () => {
    it("Return the only active assortments when no argument passed", async () => {
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
      expect(assortments.length).toEqual(4);
    });

    it("Return active assortments and include leaves", async () => {
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
      expect(result.data.assortments.length).toEqual(5);
    });

    it("Return all assortments and without leaves", async () => {
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

      expect(assortments.length).toEqual(8);
    });

    it("Return all assortments and include leaves", async () => {
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

      expect(assortments.length).toEqual(10);
    });

    it("Search assortments by slug", async () => {
      const {
        data: { assortments },
      } = await graphqlFetch({
        query: /* GraphQL */ `
          query Assortments($queryString: String, $includeLeaves: Boolean, $includeInactive: Boolean) {
            assortments(queryString: $queryString, includeLeaves: $includeLeaves, includeInactive: $includeInactive) {
              _id
            }
          }
        `,
        variables: {
          queryString: 'search-purpose',
          includeLeaves: true,
          includeInactive: true
        },
      });
      
      expect(assortments.length).toEqual(2);
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

      expect(assortmentsCount).toEqual(4);
    });

    it('Return number of active assortments and include leaves', async () => {
      const {
        data: { assortmentsCount },
      } = await graphqlFetch({
        query: /* GraphQL */ `
          query AssortmentsCount(
            $includeInactives: Boolean
            $includeLeaves: Boolean
          ) {
            assortmentsCount(
              includeInactive: $includeInactives
              includeLeaves: $includeLeaves
            )
          }
        `,
        variables: {
          includeLeaves: true,
        },
      });
      expect(assortmentsCount).toEqual(5);
    });

    it('Return number assortments of without leaves including inactives', async () => {
      const {
        data: { assortmentsCount },
      } = await graphqlFetch({
        query: /* GraphQL */ `
          query AssortmentsCount(
            $includeInactive: Boolean
            $includeLeaves: Boolean
          ) {
            assortmentsCount(
              includeInactive: $includeInactive
              includeLeaves: $includeLeaves
            )
          }
        `,
        variables: {
          includeInactive: true,
          includeLeaves: false,
        },
      });

      expect(assortmentsCount).toEqual(8);
    });

    it('Return number of all assortments and include leaves', async () => {
      const {
        data: { assortmentsCount },
      } = await graphqlFetch({
        query: /* GraphQL */ `
          query AssortmentsCount(
            $includeInactive: Boolean
            $includeLeaves: Boolean
          ) {
            assortmentsCount(
              includeInactive: $includeInactive
              includeLeaves: $includeLeaves
            )
          }
        `,
        variables: {
          includeInactive: true,
          includeLeaves: true,
        },
      });

      expect(assortmentsCount).toEqual(10);
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

      expect(assortmentsCount).toEqual(4);
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

      expect(assortmentsCount).toEqual(4);
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
      expect(assortment._id).toBe(SimpleAssortment[0]._id);
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

      expect(assortment._id).toBe(SimpleAssortment[0]._id);
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

      expect(errors[0]?.extensions?.code).toEqual('InvalidIdError');
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

      expect(errors[0]?.extensions?.code).toEqual('InvalidIdError');
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

      expect(assortment).toBe(null);
    });
  });

  describe("Query.searchAssortments for admin user should", () => {
    it("Return assortments successfuly", async () => {
      const {
        data: { searchAssortments },
      } = await graphqlFetch({
        query: /* GraphQL */ `
          query searchAssortments($queryString: String) {
            searchAssortments(
              queryString: $queryString
              includeInactive: true
            ) {
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
          queryString: "simple-assortment",
        },
      });

      expect(searchAssortments.assortmentsCount).toEqual(1);
      expect(searchAssortments.assortments[0].texts).toMatchObject({
        _id: "german",
        title: "simple assortment de",
        description: "text-de",
      });
    });
  });

  describe('Query.searchAssortments for anonymous user should', () => {
    it('Return assortments', async () => {
      const graphqlAnonymousFetch = await createAnonymousGraphqlFetch();
      const {
        data: {
          searchAssortments: { assortments },
        },
      } = await graphqlAnonymousFetch({
        query: /* GraphQL */ `
          query searchAssortments($queryString: String) {
            searchAssortments(
              queryString: $queryString
              includeInactive: true
            ) {
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
      expect(assortments.length).toBe(1);
      expect(assortments[0]).toEqual({
        _id: SimpleAssortment[0]._id,
        isActive: SimpleAssortment[0].isActive,
        texts: {
          _id: GermanAssortmentText._id,
          title: GermanAssortmentText.title,
          description: GermanAssortmentText.description,
        } 
      });
    });
  });

  describe('Query.assortments for anonymous user should', () => {
    it('return assortments', async () => {
      const graphqlAnonymousFetch = await createAnonymousGraphqlFetch();
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
      expect(assortments.length).toBe(4);
    });
  });

  describe('mutation.createAssortment for admin user should', () => {
    it('Create assortment successfuly', async () => {
      const {
        data: { createAssortment },
      } = await graphqlFetch({
        query: /* GraphQL */ `
          mutation CreateAssortment($assortment: CreateAssortmentInput!) {
            createAssortment(assortment: $assortment) {
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
            title: 'test assortment',
          },
        },
      });
      expect(createAssortment.tags).toEqual([
        'test-assrtment-1',
        'test-assortment-2',
      ]);
      expect(createAssortment.isRoot).toBe(true);
      expect(createAssortment.texts.title).toBe('test assortment');
    });
  });

  describe('mutation.createAssortment for anonymous user should', () => {
    it('Return error', async () => {
      const graphqlAnonymousFetch = await createAnonymousGraphqlFetch();
      const { errors } = await graphqlAnonymousFetch({
        query: /* GraphQL */ `
          mutation CreateAssortment($assortment: CreateAssortmentInput!) {
            createAssortment(assortment: $assortment) {
              _id
            }
          }
        `,
        variables: {
          assortment: {
            isRoot: true,
            tags: ['test-assrtment-1', 'test-assortment-2'],
            title: 'test assortment',
          },
        },
      });

      expect(errors[0].extensions?.code).toEqual('NoPermissionError');
    });
  });

  describe('mutation.updateAssortment for admin user should', () => {
    it('update assortment successfuly when passed valid assortment Id', async () => {
      const {
        data: { updateAssortment },
      } = await graphqlFetch({
        query: /* GraphQL */ `
          mutation UpdateAssortment(
            $assortment: UpdateAssortmentInput!
            $assortmentId: ID!
          ) {
            updateAssortment(
              assortment: $assortment
              assortmentId: $assortmentId
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
      expect(updateAssortment.tags).toEqual([
        'test-assrtment-1',
        'test-assortment-2',
      ]);
      expect(updateAssortment.isRoot).toBe(false);
      expect(updateAssortment.isActive).toBe(true);
    });

    it('return not found error when passed none existing assortment Id', async () => {
      const { errors } = await graphqlFetch({
        query: /* GraphQL */ `
          mutation UpdateAssortment(
            $assortment: UpdateAssortmentInput!
            $assortmentId: ID!
          ) {
            updateAssortment(
              assortment: $assortment
              assortmentId: $assortmentId
            ) {
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
      expect(errors[0]?.extensions?.code).toEqual('AssortmentNotFoundError');
    });

    it('return error when passed invalid assortment Id', async () => {
      const { errors } = await graphqlFetch({
        query: /* GraphQL */ `
          mutation UpdateAssortment(
            $assortment: UpdateAssortmentInput!
            $assortmentId: ID!
          ) {
            updateAssortment(
              assortment: $assortment
              assortmentId: $assortmentId
            ) {
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
      expect(errors[0]?.extensions?.code).toEqual('InvalidIdError');
    });
  });

  describe('mutation.updateAssortment for anonymous user should', () => {
    it('Return error', async () => {
      const graphqlAnonymousFetch = await createAnonymousGraphqlFetch();
      const { errors } = await graphqlAnonymousFetch({
        query: /* GraphQL */ `
          mutation UpdateAssortment(
            $assortment: UpdateAssortmentInput!
            $assortmentId: ID!
          ) {
            updateAssortment(
              assortment: $assortment
              assortmentId: $assortmentId
            ) {
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

      expect(errors[0]?.extensions?.code).toEqual('NoPermissionError');
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
      expect(setBaseAssortment.isBase).toBe(true);
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
      expect(errors[0]?.extensions?.code).toEqual('AssortmentNotFoundError');
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
      expect(errors[0]?.extensions?.code).toEqual('InvalidIdError');
    });
  });

  describe('mutation.setBaseAssortment for anonymous user should', () => {
    it('Return error', async () => {
      const graphqlAnonymousFetch = await createAnonymousGraphqlFetch();
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

      expect(errors[0].extensions?.code).toEqual('NoPermissionError');
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

      expect(assortment.deleted).not.toBe(null);
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

      expect(errors[0].extensions?.code).toEqual('AssortmentNotFoundError');
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
      expect(errors[0].extensions?.code).toEqual('InvalidIdError');
    });
  });

  describe('mutation.removeAssortment for anonymous user should', () => {
    it('Return error', async () => {
      const graphqlAnonymousFetch = await createAnonymousGraphqlFetch();
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

      expect(errors[0].extensions?.code).toEqual('NoPermissionError');
    });
  });
});
