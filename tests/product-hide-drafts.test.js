import { createHash } from 'node:crypto';
import assert from 'node:assert';
import test from 'node:test';
import { productsSettings } from '@unchainedshop/core-products';
import { setupDatabase, createLoggedInGraphqlFetch, createAnonymousGraphqlFetch } from './helpers.js';
import { ADMIN_TOKEN, USER_TOKEN } from './seeds/users.js';

const sha256 = (text) => createHash('sha256').update(text).digest('hex');

// productionManager (tests/setup.js) allows viewProducts, so it may list drafts without being admin
const DRAFT_VIEWER_TOKEN = 'Bearer draft-viewer-secret';
const DraftViewer = {
  _id: 'draft-viewer',
  username: 'draft-viewer',
  emails: [{ address: 'draft-viewer@unchained.local', verified: true }],
  guest: false,
  created: new Date(),
  roles: ['productionManager'],
  services: { token: { secret: sha256('draft-viewer-secret') } },
};

const pricing = [
  {
    amount: 4200,
    minQuantity: 0,
    isTaxable: true,
    isNetPrice: false,
    currencyCode: 'CHF',
    countryCode: 'CH',
  },
];

const hiddenDraftProduct = (_id, status) => ({
  _id,
  created: new Date(),
  type: 'SIMPLE_PRODUCT',
  status,
  sequence: 9000,
  slugs: [_id],
  commerce: { pricing },
});

const ProductQuery = /* GraphQL */ `
  query Product($productId: ID, $slug: String) {
    product(productId: $productId, slug: $slug) {
      _id
      status
    }
  }
`;

const CatalogPricesQuery = /* GraphQL */ `
  query CatalogPrices($productId: ID!) {
    productCatalogPrices(productId: $productId) {
      amount
    }
  }
`;

let graphqlFetchAsAnonymousUser;
let graphqlFetchAsNormalUser;
let graphqlFetchAsDraftViewer;
let graphqlFetchAsAdmin;

const readProduct = async (graphqlFetch, variables) => {
  const { data, errors } = await graphqlFetch({ query: ProductQuery, variables });
  assert.strictEqual(errors, undefined, JSON.stringify(errors));
  return data.product;
};

const readCatalogPrices = (graphqlFetch, productId) =>
  graphqlFetch({ query: CatalogPricesQuery, variables: { productId } });

test.describe('Products option hideDrafts', () => {
  test.before(async () => {
    const [db] = await setupDatabase();
    await db
      .collection('products')
      .insertMany([
        hiddenDraftProduct('hide-drafts-active', 'ACTIVE'),
        hiddenDraftProduct('hide-drafts-draft', null),
        hiddenDraftProduct('hide-drafts-draft-string', 'DRAFT'),
        hiddenDraftProduct('hide-drafts-deleted', 'DELETED'),
      ]);
    await db.collection('users').insertOne(DraftViewer);
    graphqlFetchAsAnonymousUser = createAnonymousGraphqlFetch();
    graphqlFetchAsNormalUser = createLoggedInGraphqlFetch(USER_TOKEN);
    graphqlFetchAsDraftViewer = createLoggedInGraphqlFetch(DRAFT_VIEWER_TOKEN);
    graphqlFetchAsAdmin = createLoggedInGraphqlFetch(ADMIN_TOKEN);
  });

  test.describe('off (default)', () => {
    test('product returns drafts and deleted products to anonymous users', async () => {
      assert.strictEqual(productsSettings.hideDrafts, false);
      assert.deepStrictEqual(
        await readProduct(graphqlFetchAsAnonymousUser, { slug: 'hide-drafts-draft' }),
        { _id: 'hide-drafts-draft', status: 'DRAFT' },
      );
      assert.deepStrictEqual(
        await readProduct(graphqlFetchAsAnonymousUser, { productId: 'hide-drafts-deleted' }),
        { _id: 'hide-drafts-deleted', status: 'DELETED' },
      );
    });

    test('productCatalogPrices returns the prices of a draft to anonymous users', async () => {
      const { data, errors } = await readCatalogPrices(graphqlFetchAsAnonymousUser, 'hide-drafts-draft');
      assert.strictEqual(errors, undefined, JSON.stringify(errors));
      assert.deepStrictEqual(data.productCatalogPrices, [{ amount: 4200 }]);
    });
  });

  test.describe('on', () => {
    test.before(() => {
      productsSettings.hideDrafts = true;
    });

    test.after(() => {
      productsSettings.hideDrafts = false;
    });

    test('product still returns active products to anonymous users', async () => {
      assert.deepStrictEqual(
        await readProduct(graphqlFetchAsAnonymousUser, { slug: 'hide-drafts-active' }),
        { _id: 'hide-drafts-active', status: 'ACTIVE' },
      );
    });

    test('product returns null for drafts and deleted products to anonymous and normal users', async () => {
      for (const graphqlFetch of [graphqlFetchAsAnonymousUser, graphqlFetchAsNormalUser]) {
        for (const productId of [
          'hide-drafts-draft',
          'hide-drafts-draft-string',
          'hide-drafts-deleted',
        ]) {
          assert.strictEqual(await readProduct(graphqlFetch, { productId }), null, productId);
          assert.strictEqual(await readProduct(graphqlFetch, { slug: productId }), null, productId);
        }
      }
    });

    test('product returns drafts and deleted products to callers who may list drafts', async () => {
      for (const graphqlFetch of [graphqlFetchAsDraftViewer, graphqlFetchAsAdmin]) {
        assert.deepStrictEqual(await readProduct(graphqlFetch, { slug: 'hide-drafts-draft' }), {
          _id: 'hide-drafts-draft',
          status: 'DRAFT',
        });
        assert.deepStrictEqual(await readProduct(graphqlFetch, { productId: 'hide-drafts-deleted' }), {
          _id: 'hide-drafts-deleted',
          status: 'DELETED',
        });
      }
    });

    test('productCatalogPrices answers for a draft as for an unknown product', async () => {
      const unknown = await readCatalogPrices(graphqlFetchAsAnonymousUser, 'hide-drafts-unknown');
      const draft = await readCatalogPrices(graphqlFetchAsAnonymousUser, 'hide-drafts-draft');
      assert.strictEqual(draft.data, unknown.data);
      assert.deepStrictEqual(
        draft.errors?.map(({ message }) => message),
        unknown.errors?.map(({ message }) => message),
      );

      const active = await readCatalogPrices(graphqlFetchAsAnonymousUser, 'hide-drafts-active');
      assert.deepStrictEqual(active.data.productCatalogPrices, [{ amount: 4200 }]);
    });

    test('productCatalogPrices returns the prices of a draft to callers who may list drafts', async () => {
      const { data, errors } = await readCatalogPrices(graphqlFetchAsDraftViewer, 'hide-drafts-draft');
      assert.strictEqual(errors, undefined, JSON.stringify(errors));
      assert.deepStrictEqual(data.productCatalogPrices, [{ amount: 4200 }]);
    });
  });
});
