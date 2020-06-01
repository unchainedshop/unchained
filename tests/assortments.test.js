import {
  setupDatabase,
  createLoggedInGraphqlFetch,
  createAnonymousGraphqlFetch,
} from "./helpers";
import { ADMIN_TOKEN } from "./seeds/users";
import { SimpleAssortment } from "./seeds/assortments";

let connection;
let graphqlFetch;

describe("Assortments", () => {
  beforeAll(async () => {
    [, connection] = await setupDatabase();
    graphqlFetch = await createLoggedInGraphqlFetch(ADMIN_TOKEN);
  });

  afterAll(async () => {
    await connection.close();
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
      const {
        data: { assortments },
      } = await graphqlFetch({
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
              meta
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
              search {
                totalProducts
                filteredProducts
                filters {
                  examinedProducts
                  filteredProducts
                  definition {
                    _id
                  }
                  isSelected
                  options {
                    filteredProducts
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

      expect(assortments.length).toEqual(5);
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
  });

  describe("Query.assortment for admin user should", () => {
    it("return single assortment based on id", async () => {
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
              meta
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
              search {
                totalProducts
                filteredProducts
                filters {
                  examinedProducts
                  filteredProducts
                  definition {
                    _id
                  }
                  isSelected
                  options {
                    filteredProducts
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
    it("return single assortment based on slug", async () => {
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

    it("return null for non-existing id", async () => {
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
          assortmentId: "non-existing-id",
        },
      });

      expect(assortment).toBe(null);
    });

    it("return null for non-existing slug", async () => {
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
          slug: "non-existing-slug",
        },
      });

      expect(assortment).toBe(null);
    });

    it("return null when either id or slug are non-existing", async () => {
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
          slug: "non-existing-slug",
        },
      });

      expect(assortment).toBe(null);
    });
  });

  describe("Query.assortments for anonymous user should", () => {
    it("return assortments", async () => {
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

      expect(Array.isArray(assortments)).toBe(true);
    });
  });
  describe("mutation.createAssortment for loged in user should", () => {
    it("Create assortment successfuly", async () => {
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
              meta
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
                meta
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
              search {
                totalProducts
              }
            }
          }
        `,
        variables: {
          assortment: {
            isRoot: true,
            tags: ["test-assrtment-1", "test-assortment-2"],
            title: "test assortment",
          },
        },
      });
      expect(createAssortment.tags).toEqual([
        "test-assrtment-1",
        "test-assortment-2",
      ]);
    });
  });

  describe("mutation.createAssortment for anonymous user should", () => {
    it("Return error", async () => {
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
            tags: ["test-assrtment-1", "test-assortment-2"],
            title: "test assortment",
          },
        },
      });

      expect(errors.length).toEqual(1);
    });
  });

  describe("mutation.updateAssortment for loged in user should", () => {
    it("update assortment successfuly when passed valid assortment Id", async () => {
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
              meta
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
                meta
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
              search {
                totalProducts
              }
            }
          }
        `,
        variables: {
          assortmentId: SimpleAssortment[0]._id,
          assortment: {
            isRoot: false,
            tags: ["test-assrtment-1", "test-assortment-2"],
            isActive: true,
          },
        },
      });
      expect(updateAssortment.tags).toEqual([
        "test-assrtment-1",
        "test-assortment-2",
      ]);
    });

    it("return error when passed none existing assortment Id", async () => {
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
          assortmentId: "non-existing-id",
          assortment: {
            isRoot: false,
            tags: ["test-assrtment-1", "test-assortment-2"],
            isActive: true,
          },
        },
      });
      expect(errors.length).toEqual(1);
    });
  });

  describe("mutation.updateAssortment for anonymous user should", () => {
    it("Return error", async () => {
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
            tags: ["test-assrtment-1", "test-assortment-2"],
            isActive: true,
          },
        },
      });

      expect(errors.length).toEqual(1);
    });
  });

  describe("mutation.setBaseAssortment for loged in user should", () => {
    it("change isBase property to true when passed valid assortment Id", async () => {
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
              meta
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
                meta
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
              search {
                totalProducts
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

    it("return error when passed none existing assortment Id", async () => {
      const { errors } = await graphqlFetch({
        query: /* GraphQL */ `
          mutation SetBaseAssortment($assortmentId: ID!) {
            setBaseAssortment(assortmentId: $assortmentId) {
              _id
            }
          }
        `,
        variables: {
          assortmentId: "non-existing-id",
        },
      });
      expect(errors.length).toEqual(1);
    });
  });

  describe("mutation.setBaseAssortment for anonymous user should", () => {
    it("Return error", async () => {
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

      expect(errors.length).toEqual(1);
    });
  });

  describe("mutation.removeAssortment for loged in user should", () => {
    it("Remove assortment successfuly when passed valid assortment Id", async () => {
      const {
        data: { removeAssortment },
      } = await graphqlFetch({
        query: /* GraphQL */ `
          mutation RemoveAssortment($assortmentId: ID!) {
            removeAssortment(assortmentId: $assortmentId) {
              _id
              created
              updated
              isActive
              isBase
              isRoot
              sequence
              tags
              meta
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
                meta
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
              search {
                totalProducts
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
            }
          }
        `,
        variables: {
          assortmentId: SimpleAssortment[2]._id,
        },
      });

      expect(assortment).toBe(null);
    });

    it("return error when passed none existing assortment Id", async () => {
      const { errors } = await graphqlFetch({
        query: /* GraphQL */ `
          mutation RemoveAssortment($assortmentId: ID!) {
            removeAssortment(assortmentId: $assortmentId) {
              _id
            }
          }
        `,
        variables: {
          assortmentId: "non-existing-id",
        },
      });
      expect(errors.length).toEqual(1);
    });
  });

  describe("mutation.removeAssortment for anonymous user should", () => {
    it("Return error", async () => {
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

      expect(errors.length).toEqual(1);
    });
  });
});
