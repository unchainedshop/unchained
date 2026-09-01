import { setupDatabase, createLoggedInGraphqlFetch } from './helpers.js';
import { getTestPlatform } from './setup.js';
import { ADMIN_TOKEN } from './seeds/users.js';
import assert from 'node:assert';
import test from 'node:test';

let db;
let graphqlFetch;

const runImport = async (events) => {
  const { data } = await graphqlFetch({
    query: /* GraphQL */ `
      mutation AddWork($input: JSON) {
        addWork(type: BULK_IMPORT, input: $input, retries: 0, priority: 10) {
          _id
        }
      }
    `,
    variables: { input: { events, skipCacheInvalidation: true } },
  });
  const workId = data.addWork._id;
  for (let i = 0; i < 200; i += 1) {
    const { data: { work } = {} } = await graphqlFetch({
      query: /* GraphQL */ `
        query Work($workId: ID!) {
          work(workId: $workId) {
            _id
            status
            result
          }
        }
      `,
      variables: { workId },
    });
    if (['SUCCESS', 'FAILED'].includes(work?.status)) return work;
    await new Promise((r) => setTimeout(r, 50));
  }
  throw new Error('bulk import did not finish');
};

const productEvent = (_id, specification) => ({
  entity: 'PRODUCT',
  operation: 'CREATE',
  payload: {
    _id,
    specification: {
      type: 'SIMPLE_PRODUCT',
      content: { en: { title: _id } },
      ...specification,
    },
  },
});

test.describe('Product draft status through bulk import', () => {
  test.before(async () => {
    [db] = await setupDatabase();
    graphqlFetch = createLoggedInGraphqlFetch(ADMIN_TOKEN);
  });

  test('an imported DRAFT status is stored the way every selector reads it', async () => {
    // ProductStatus.DRAFT is 'DRAFT', but drafts are null in the database. Importing the string
    // used to create a document that productExists could not see, so the import reported failure
    // while leaving the row behind.
    const work = await runImport([productEvent('import-draft-status', { status: 'DRAFT' })]);
    assert.strictEqual(work.status, 'SUCCESS');

    const product = await db.collection('products').findOne({ _id: 'import-draft-status' });
    assert.strictEqual(product.status, null, 'draft must be stored as null');

    const { modules } = getTestPlatform().unchainedAPI;
    assert.strictEqual(await modules.products.productExists({ productId: 'import-draft-status' }), true);
    assert.strictEqual(modules.products.isDraft(product), true);
  });

  test('a product imported as a draft can still be published', async () => {
    const { data, errors } = await graphqlFetch({
      query: /* GraphQL */ `
        mutation Publish($productId: ID!) {
          publishProduct(productId: $productId) {
            _id
            status
          }
        }
      `,
      variables: { productId: 'import-draft-status' },
    });
    assert.strictEqual(errors, undefined, JSON.stringify(errors));
    assert.strictEqual(data.publishProduct.status, 'ACTIVE');
  });

  test('publishProduct accepts a product already carrying the string DRAFT status', async () => {
    // Documents written before the import normalisation still hold 'DRAFT'.
    await db.collection('products').insertOne({
      _id: 'legacy-draft-string',
      created: new Date(),
      type: 'SIMPLE_PRODUCT',
      status: 'DRAFT',
      sequence: 9999,
      slugs: ['legacy-draft-string'],
    });
    const { modules } = getTestPlatform().unchainedAPI;
    const product = await db.collection('products').findOne({ _id: 'legacy-draft-string' });

    assert.strictEqual(modules.products.isDraft(product), true);
    assert.strictEqual(await modules.products.publish(product), true, 'isDraft and publish must agree');

    const after = await db.collection('products').findOne({ _id: 'legacy-draft-string' });
    assert.strictEqual(after.status, 'ACTIVE');
  });

  test('an unknown status value is rejected instead of silently stored', async () => {
    const work = await runImport([productEvent('import-bogus-status', { status: 'nonsense' })]);
    assert.strictEqual(work.status, 'FAILED');
    assert.strictEqual(await db.collection('products').findOne({ _id: 'import-bogus-status' }), null);
  });

  test('an imported ACTIVE product is visible to an anonymous storefront search', async () => {
    const work = await runImport([
      productEvent('import-active-status', {
        status: 'ACTIVE',
        published: '2020-01-01T00:00Z',
        meta: { statusProbe: 'yes' },
      }),
    ]);
    assert.strictEqual(work.status, 'SUCCESS');
    const product = await db.collection('products').findOne({ _id: 'import-active-status' });
    assert.strictEqual(product.status, 'ACTIVE');
  });
});
