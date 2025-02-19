import assert from 'node:assert';
import { describe, it, before } from 'node:test';
import { setupDatabase, createLoggedInGraphqlFetch, createAnonymousGraphqlFetch } from './helpers.js';
import { ADMIN_TOKEN } from './seeds/users.js';
import { SimpleAssortment, AssortmentLinks } from './seeds/assortments.js';

let graphqlFetch;

describe('AssortmentLink', () => {
  before(async () => {
    await setupDatabase();
    graphqlFetch = createLoggedInGraphqlFetch(ADMIN_TOKEN);
  });

  describe('mutation.reorderAssortmentLinks for admin users should', () => {
    it('Update assortment link sortkey successfuly when passed a valid assortment link IDs', async () => {
      const {
        data: { reorderAssortmentLinks },
      } = await graphqlFetch({
        query: /* GraphQL */ `
          mutation ReorderAssortmentLinks($sortKeys: [ReorderAssortmentLinkInput!]!) {
            reorderAssortmentLinks(sortKeys: $sortKeys) {
              _id
              sortKey
              tags
              parent {
                _id
              }
              child {
                _id
              }
            }
          }
        `,
        variables: {
          sortKeys: [
            {
              assortmentLinkId: AssortmentLinks[0]._id,
              sortKey: 10,
            },
          ],
        },
      });

      assert.strictEqual(reorderAssortmentLinks[0].sortKey, 11);
    });

    it('Skip any invalid assortment link provided', async () => {
      const {
        data: { reorderAssortmentLinks },
      } = await graphqlFetch({
        query: /* GraphQL */ `
          mutation ReorderAssortmentLinks($sortKeys: [ReorderAssortmentLinkInput!]!) {
            reorderAssortmentLinks(sortKeys: $sortKeys) {
              _id
            }
          }
        `,
        variables: {
          sortKeys: [
            {
              assortmentLinkId: AssortmentLinks[0]._id,
              sortKey: 10,
            },
            {
              assortmentLinkId: 'invalid-assortment-id',
              sortKey: 10,
            },
          ],
        },
      });

      assert.strictEqual(reorderAssortmentLinks.length, 1);
      assert.deepStrictEqual(reorderAssortmentLinks[0], {
        _id: AssortmentLinks[0]._id,
      });
    });
  });

  describe('mutation.reorderAssortmentLinks for anonymous users should', () => {
    it('return error', async () => {
      const graphqlAnonymousFetch = createAnonymousGraphqlFetch();
      const { errors } = await graphqlAnonymousFetch({
        query: /* GraphQL */ `
          mutation ReorderAssortmentLinks($sortKeys: [ReorderAssortmentLinkInput!]!) {
            reorderAssortmentLinks(sortKeys: $sortKeys) {
              _id
            }
          }
        `,
        variables: {
          sortKeys: [
            {
              assortmentLinkId: AssortmentLinks[0]._id,
              sortKey: 10,
            },
          ],
        },
      });

      assert.strictEqual(errors.length, 1);
      assert.strictEqual(errors[0].extensions?.code, 'NoPermissionError');
    });
  });

  describe('mutation.addAssortmentLink for admin users should', () => {
    it('Create assortment link successfuly when passed a valid assortment IDs', async () => {
      const {
        data: { addAssortmentLink },
      } = await graphqlFetch({
        query: /* GraphQL */ `
          mutation AddAssortmentLink(
            $parentAssortmentId: ID!
            $childAssortmentId: ID!
            $tags: [LowerCaseString!]
          ) {
            addAssortmentLink(
              parentAssortmentId: $parentAssortmentId
              childAssortmentId: $childAssortmentId
              tags: $tags
            ) {
              _id
              sortKey
              tags
              parent {
                _id
              }
              child {
                _id
              }
            }
          }
        `,
        variables: {
          parentAssortmentId: SimpleAssortment[0]._id,
          childAssortmentId: SimpleAssortment[3]._id,
          tags: ['assortment-link-test'],
        },
      });

      assert.deepStrictEqual(addAssortmentLink, {
        parent: { _id: SimpleAssortment[0]._id },
        child: { _id: SimpleAssortment[3]._id },
        tags: ['assortment-link-test'],
      });
    });

    it('return not found error when passed non existing parent assortment ID is passed', async () => {
      const { errors } = await graphqlFetch({
        query: /* GraphQL */ `
          mutation AddAssortmentLink(
            $parentAssortmentId: ID!
            $childAssortmentId: ID!
            $tags: [LowerCaseString!]
          ) {
            addAssortmentLink(
              parentAssortmentId: $parentAssortmentId
              childAssortmentId: $childAssortmentId
              tags: $tags
            ) {
              _id
            }
          }
        `,
        variables: {
          parentAssortmentId: 'invalid-id',
          childAssortmentId: SimpleAssortment[3]._id,
          tags: ['assortment-link-test'],
        },
      });
      assert.strictEqual(errors.length, 1);
      assert.strictEqual(errors[0]?.extensions?.code, 'AssortmentNotFoundError');
    });

    it('return error when passed invalid parent assortment ID', async () => {
      const { errors } = await graphqlFetch({
        query: /* GraphQL */ `
          mutation AddAssortmentLink(
            $parentAssortmentId: ID!
            $childAssortmentId: ID!
            $tags: [LowerCaseString!]
          ) {
            addAssortmentLink(
              parentAssortmentId: $parentAssortmentId
              childAssortmentId: $childAssortmentId
              tags: $tags
            ) {
              _id
            }
          }
        `,
        variables: {
          parentAssortmentId: '',
          childAssortmentId: SimpleAssortment[3]._id,
          tags: ['assortment-link-test'],
        },
      });
      assert.strictEqual(errors.length, 1);
      assert.strictEqual(errors[0]?.extensions?.code, 'InvalidIdError');
    });

    it('return not found error when passed non existing child assortment ID', async () => {
      const { errors } = await graphqlFetch({
        query: /* GraphQL */ `
          mutation AddAssortmentLink(
            $parentAssortmentId: ID!
            $childAssortmentId: ID!
            $tags: [LowerCaseString!]
          ) {
            addAssortmentLink(
              parentAssortmentId: $parentAssortmentId
              childAssortmentId: $childAssortmentId
              tags: $tags
            ) {
              _id
            }
          }
        `,
        variables: {
          parentAssortmentId: SimpleAssortment[3]._id,
          childAssortmentId: 'invalid-id',
          tags: ['assortment-link-test'],
        },
      });
      assert.strictEqual(errors.length, 1);
      assert.strictEqual(errors[0]?.extensions?.code, 'AssortmentNotFoundError');
    });

    it('return error when passed invalid child assortment ID', async () => {
      const { errors } = await graphqlFetch({
        query: /* GraphQL */ `
          mutation AddAssortmentLink(
            $parentAssortmentId: ID!
            $childAssortmentId: ID!
            $tags: [LowerCaseString!]
          ) {
            addAssortmentLink(
              parentAssortmentId: $parentAssortmentId
              childAssortmentId: $childAssortmentId
              tags: $tags
            ) {
              _id
            }
          }
        `,
        variables: {
          parentAssortmentId: SimpleAssortment[3]._id,
          childAssortmentId: '',
          tags: ['assortment-link-test'],
        },
      });
      assert.strictEqual(errors.length, 1);
      assert.strictEqual(errors[0]?.extensions?.code, 'InvalidIdError');
    });
  });

  describe('mutation.addAssortmentLink for anonymous user should', () => {
    it('return error', async () => {
      const graphqlAnonymousFetch = createAnonymousGraphqlFetch();

      const { errors } = await graphqlAnonymousFetch({
        query: /* GraphQL */ `
          mutation AddAssortmentLink(
            $parentAssortmentId: ID!
            $childAssortmentId: ID!
            $tags: [LowerCaseString!]
          ) {
            addAssortmentLink(
              parentAssortmentId: $parentAssortmentId
              childAssortmentId: $childAssortmentId
              tags: $tags
            ) {
              _id
            }
          }
        `,
        variables: {
          parentAssortmentId: SimpleAssortment[0]._id,
          childAssortmentId: SimpleAssortment[3]._id,
          tags: ['assortment-link-test'],
        },
      });

      assert.strictEqual(errors.length, 1);
      assert.strictEqual(errors[0].extensions?.code, 'NoPermissionError');
    });
  });

  describe('mutation.removeAssortmentLink for admin user should', () => {
    it('Remove assortment link when passed valid ID', async () => {
      const {
        // eslint-disable-next-line
        data: { removeAssortmentLink },
      } = await graphqlFetch({
        query: /* GraphQL */ `
          mutation removeAssortmentLink($assortmentLinkId: ID!) {
            removeAssortmentLink(assortmentLinkId: $assortmentLinkId) {
              _id
              sortKey
              tags
              parent {
                _id
              }
              child {
                _id
              }
            }
          }
        `,
        variables: {
          assortmentLinkId: AssortmentLinks[0]._id,
        },
      });

      const { errors } = await graphqlFetch({
        query: /* GraphQL */ `
          mutation removeAssortmentLink($assortmentLinkId: ID!) {
            removeAssortmentLink(assortmentLinkId: $assortmentLinkId) {
              _id
            }
          }
        `,
        variables: {
          assortmentLinkId: AssortmentLinks[0]._id,
        },
      });
      assert.strictEqual(errors.length, 1);
      assert.strictEqual(errors[0]?.extensions?.code, 'AssortmentLinkNotFoundError');
    });

    it('return not found error when passed non existing assortmentLinkId', async () => {
      const { errors } = await graphqlFetch({
        query: /* GraphQL */ `
          mutation removeAssortmentLink($assortmentLinkId: ID!) {
            removeAssortmentLink(assortmentLinkId: $assortmentLinkId) {
              _id
            }
          }
        `,
        variables: {
          assortmentLinkId: AssortmentLinks[0]._id,
        },
      });
      assert.strictEqual(errors.length, 1);
      assert.strictEqual(errors[0]?.extensions?.code, 'AssortmentLinkNotFoundError');
    });

    it('return error when passed invalid assortmentLinkId', async () => {
      const { errors } = await graphqlFetch({
        query: /* GraphQL */ `
          mutation removeAssortmentLink($assortmentLinkId: ID!) {
            removeAssortmentLink(assortmentLinkId: $assortmentLinkId) {
              _id
            }
          }
        `,
        variables: {
          assortmentLinkId: '',
        },
      });
      assert.strictEqual(errors.length, 1);
      assert.strictEqual(errors[0]?.extensions?.code, 'InvalidIdError');
    });
  });

  describe('mutation.removeAssortmentLink for anonymous user should', () => {
    it('return error', async () => {
      const graphqlAnonymousFetch = createAnonymousGraphqlFetch();
      const { errors } = await graphqlAnonymousFetch({
        query: /* GraphQL */ `
          mutation removeAssortmentLink($assortmentLinkId: ID!) {
            removeAssortmentLink(assortmentLinkId: $assortmentLinkId) {
              _id
            }
          }
        `,
        variables: {
          assortmentLinkId: AssortmentLinks[0]._id,
        },
      });
      assert.strictEqual(errors.length, 1);
      assert.strictEqual(errors[0].extensions?.code, 'NoPermissionError');
    });
  });
});
