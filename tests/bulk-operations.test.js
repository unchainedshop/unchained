import assert from 'node:assert';
import test from 'node:test';
import { createLoggedInGraphqlFetch, disconnect, setupDatabase } from './helpers.js';
import { SimpleAssortment } from './seeds/assortments.js';
import { MultiChoiceFilter } from './seeds/filters.js';
import {
  LeveledPricingProduct,
  SimpleProduct,
  SimpleProduct2,
  SimpleProductDraft,
  UnpublishedProduct,
} from './seeds/products.js';
import { ADMIN_TOKEN, User } from './seeds/users.js';

let graphqlFetch;

const loadEvents = async (types) => {
  const { data, errors } = await graphqlFetch({
    query: /* GraphQL */ `
      query BulkOperationEvents($types: [String!]) {
        events(types: $types, limit: 100, sort: [{ key: "created", value: ASC }]) {
          type
          payload
        }
      }
    `,
    variables: { types },
  });
  assert.ifError(errors?.[0]);
  return data.events;
};

test.describe('Bulk operations', () => {
  test.before(async () => {
    await setupDatabase();
    graphqlFetch = createLoggedInGraphqlFetch(ADMIN_TOKEN);
  });

  test.after(async () => {
    await disconnect();
  });

  test('returns canonical results for unique, missing, and duplicate IDs', async () => {
    const singleResult = await graphqlFetch({
      query: /* GraphQL */ `
        mutation SingleUpdatesForEventComparison($assortmentId: ID!, $filterId: ID!, $userId: ID!) {
          updateAssortment(assortmentId: $assortmentId, assortment: { isActive: false }) {
            _id
          }
          updateFilter(filterId: $filterId, filter: { isActive: false }) {
            _id
          }
          setUserTags(userId: $userId, tags: ["single-event-shape"]) {
            _id
          }
        }
      `,
      variables: {
        assortmentId: SimpleAssortment[0]._id,
        filterId: MultiChoiceFilter._id,
        userId: User._id,
      },
    });
    assert.ifError(singleResult.errors?.[0]);

    const { data, errors } = await graphqlFetch({
      query: /* GraphQL */ `
        mutation CanonicalBulkResults($assortmentIds: [ID!]!, $filterIds: [ID!]!, $userIds: [ID!]!) {
          assortments: bulkSetAssortmentActive(assortmentIds: $assortmentIds, isActive: true) {
            successIds
            successCount
            failedCount
            failedIds
          }
          filters: bulkSetFilterActive(filterIds: $filterIds, isActive: true) {
            successIds
            successCount
            failedCount
            failedIds
          }
          users: bulkUpdateUserTags(userIds: $userIds, add: ["bulk-result"]) {
            successIds
            successCount
            failedCount
            failedIds
          }
        }
      `,
      variables: {
        assortmentIds: [SimpleAssortment[0]._id, 'missing-assortment', SimpleAssortment[0]._id],
        filterIds: [MultiChoiceFilter._id, 'missing-filter', MultiChoiceFilter._id],
        userIds: [User._id, 'missing-user', User._id],
      },
    });

    assert.ifError(errors?.[0]);
    assert.deepStrictEqual(data, {
      assortments: {
        successIds: [SimpleAssortment[0]._id],
        successCount: 1,
        failedCount: 1,
        failedIds: ['missing-assortment'],
      },
      filters: {
        successIds: [MultiChoiceFilter._id],
        successCount: 1,
        failedCount: 1,
        failedIds: ['missing-filter'],
      },
      users: {
        successIds: [User._id],
        successCount: 1,
        failedCount: 1,
        failedIds: ['missing-user'],
      },
    });

    const assortmentEvents = (await loadEvents(['ASSORTMENT_UPDATE'])).filter(
      ({ payload }) => payload?.assortmentId === SimpleAssortment[0]._id,
    );
    assert.strictEqual(assortmentEvents.length, 2);
    assert.deepStrictEqual(
      Object.keys(assortmentEvents[1].payload).sort(),
      Object.keys(assortmentEvents[0].payload).sort(),
    );

    const filterEvents = (await loadEvents(['FILTER_UPDATE'])).filter(
      ({ payload }) => payload?.filterId === MultiChoiceFilter._id,
    );
    assert.strictEqual(filterEvents.length, 2);
    assert.deepStrictEqual(
      Object.keys(filterEvents[1].payload).sort(),
      Object.keys(filterEvents[0].payload).sort(),
    );
    assert.strictEqual(filterEvents[1].payload.isActive, true);

    const userEvents = (await loadEvents(['USER_UPDATE_TAGS'])).filter(
      ({ payload }) => payload?.user?._id === User._id,
    );
    assert.strictEqual(userEvents.length, 2);
    assert.deepStrictEqual(
      Object.keys(userEvents[1].payload).sort(),
      Object.keys(userEvents[0].payload).sort(),
    );
    assert.deepStrictEqual(
      Object.keys(userEvents[1].payload.user).sort(),
      Object.keys(userEvents[0].payload.user).sort(),
    );
    assert.deepStrictEqual(userEvents[1].payload.user.tags, ['single-event-shape', 'bulk-result']);
  });

  test('emits the same product update event shape as a single update', async () => {
    const singleTags = ['single-event-shape'];
    const singleResult = await graphqlFetch({
      query: /* GraphQL */ `
        mutation SingleProductUpdate($productId: ID!, $tags: [LowerCaseString!]) {
          updateProduct(productId: $productId, product: { tags: $tags }) {
            _id
          }
        }
      `,
      variables: { productId: SimpleProduct2._id, tags: singleTags },
    });
    assert.ifError(singleResult.errors?.[0]);

    const bulkResult = await graphqlFetch({
      query: /* GraphQL */ `
        mutation BulkProductTagUpdate($productIds: [ID!]!) {
          bulkUpdateProductTags(productIds: $productIds, add: ["bulk-event-shape"], remove: ["tag-1"]) {
            successCount
            failedCount
            failedIds
          }
        }
      `,
      variables: {
        productIds: [SimpleProduct._id, 'missing-product', SimpleProduct._id],
      },
    });

    assert.ifError(bulkResult.errors?.[0]);
    assert.deepStrictEqual(bulkResult.data.bulkUpdateProductTags, {
      successCount: 1,
      failedCount: 1,
      failedIds: ['missing-product'],
    });

    const events = await loadEvents(['PRODUCT_UPDATE']);
    const singleEvent = events.find(({ payload }) => payload?.productId === SimpleProduct2._id);
    const bulkEvent = events.find(({ payload }) => payload?.productId === SimpleProduct._id);

    assert.ok(singleEvent);
    assert.ok(bulkEvent);
    assert.deepStrictEqual(
      Object.keys(bulkEvent.payload).sort(),
      Object.keys(singleEvent.payload).sort(),
    );
    assert.strictEqual(bulkEvent.payload.product._id, SimpleProduct._id);
    assert.deepStrictEqual(bulkEvent.payload.tags, [
      'tag-2',
      'highlight',
      'test-tag',
      'bulk-event-shape',
    ]);
  });

  test('publishes with the same event payload and ordering as single mutations', async () => {
    const singleResult = await graphqlFetch({
      query: /* GraphQL */ `
        mutation SinglePublish($productId: ID!) {
          publishProduct(productId: $productId) {
            _id
          }
        }
      `,
      variables: { productId: SimpleProductDraft._id },
    });
    assert.ifError(singleResult.errors?.[0]);

    const bulkResult = await graphqlFetch({
      query: /* GraphQL */ `
        mutation BulkPublish($productIds: [ID!]!) {
          bulkSetProductStatus(productIds: $productIds, status: ACTIVE) {
            successCount
            failedCount
            failedIds
          }
        }
      `,
      variables: { productIds: [UnpublishedProduct._id] },
    });
    assert.ifError(bulkResult.errors?.[0]);

    const events = (await loadEvents(['PRODUCT_PUBLISH'])).filter(({ payload }) =>
      [SimpleProductDraft._id, UnpublishedProduct._id].includes(payload?.product?._id),
    );
    assert.deepStrictEqual(
      events.map(({ payload }) => payload.product._id),
      [SimpleProductDraft._id, UnpublishedProduct._id],
    );
    assert.deepStrictEqual(Object.keys(events[1].payload).sort(), Object.keys(events[0].payload).sort());
    assert.strictEqual(events[1].payload.product.status, events[0].payload.product.status);
  });

  test('assigns products serially so generated sort keys remain unique', async () => {
    const assortmentId = SimpleAssortment[1]._id;
    const productIds = [SimpleProduct._id, SimpleProduct2._id];
    const singleProductId = UnpublishedProduct._id;
    const singleResult = await graphqlFetch({
      query: /* GraphQL */ `
        mutation SingleAssign($assortmentId: ID!, $productId: ID!) {
          addAssortmentProduct(assortmentId: $assortmentId, productId: $productId) {
            _id
          }
        }
      `,
      variables: { assortmentId, productId: singleProductId },
    });
    assert.ifError(singleResult.errors?.[0]);

    const result = await graphqlFetch({
      query: /* GraphQL */ `
        mutation BulkAssign($assortmentId: ID!, $productIds: [ID!]!) {
          bulkAssignProductsToAssortment(assortmentId: $assortmentId, productIds: $productIds) {
            successCount
            failedCount
            failedIds
          }
        }
      `,
      variables: { assortmentId, productIds },
    });
    assert.ifError(result.errors?.[0]);
    assert.deepStrictEqual(result.data.bulkAssignProductsToAssortment, {
      successCount: 2,
      failedCount: 0,
      failedIds: [],
    });

    const assignmentResult = await graphqlFetch({
      query: /* GraphQL */ `
        query AssignedProducts($assortmentId: ID!) {
          assortment(assortmentId: $assortmentId) {
            productAssignments {
              sortKey
              product {
                _id
              }
            }
          }
        }
      `,
      variables: { assortmentId },
    });
    assert.ifError(assignmentResult.errors?.[0]);
    const assignments = assignmentResult.data.assortment.productAssignments.filter(({ product }) =>
      productIds.includes(product._id),
    );
    assert.strictEqual(assignments.length, 2);
    assert.strictEqual(new Set(assignments.map(({ sortKey }) => sortKey)).size, 2);

    const events = (await loadEvents(['ASSORTMENT_ADD_PRODUCT'])).filter(
      ({ payload }) => payload?.assortmentProduct?.assortmentId === assortmentId,
    );
    assert.deepStrictEqual(
      events.map(({ payload }) => payload.assortmentProduct.productId),
      [singleProductId, ...productIds],
    );
    assert.deepStrictEqual(
      Object.keys(events[1].payload.assortmentProduct).sort(),
      Object.keys(events[0].payload.assortmentProduct).sort(),
    );
    assert.strictEqual('tags' in events[1].payload.assortmentProduct, false);
  });

  test('keeps the single-product deletion integrity guards', async () => {
    const result = await graphqlFetch({
      query: /* GraphQL */ `
        mutation BulkRemoveWithLinkedProduct($productIds: [ID!]!) {
          bulkRemoveProducts(productIds: $productIds) {
            successIds
            successCount
            failedCount
            failedIds
          }
        }
      `,
      variables: {
        productIds: [SimpleProduct._id, LeveledPricingProduct._id, 'missing-product'],
      },
    });
    assert.ifError(result.errors?.[0]);
    assert.deepStrictEqual(result.data.bulkRemoveProducts, {
      successIds: [LeveledPricingProduct._id],
      successCount: 1,
      failedCount: 2,
      failedIds: [SimpleProduct._id, 'missing-product'],
    });

    const removeEvents = await loadEvents(['PRODUCT_REMOVE']);
    assert.strictEqual(
      removeEvents.some(({ payload }) => payload?.productId === SimpleProduct._id),
      false,
    );
    assert.strictEqual(
      removeEvents.some(({ payload }) => payload?.productId === LeveledPricingProduct._id),
      true,
    );
  });

  test('rejects oversized bulk requests before touching domain services', async () => {
    const productIds = Array.from({ length: 1001 }, (_, index) => `missing-${index}`);
    const { errors } = await graphqlFetch({
      query: /* GraphQL */ `
        mutation OversizedBulkRequest($productIds: [ID!]!) {
          bulkSetProductStatus(productIds: $productIds, status: ACTIVE) {
            successCount
          }
        }
      `,
      variables: { productIds },
    });

    assert.strictEqual(errors?.[0]?.extensions?.code, 'BulkOperationTooLargeError');
  });
});
