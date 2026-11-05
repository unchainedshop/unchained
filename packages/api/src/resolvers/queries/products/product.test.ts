import { afterEach, describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { productsSettings } from '@unchainedshop/core-products';
import product from './product.ts';
import productCatalogPrices from './productCatalogPrices.ts';

const products = {
  active: { _id: 'active', status: 'ACTIVE', slugs: ['active'] },
  draft: { _id: 'draft', status: null, slugs: ['draft'] },
  draftString: { _id: 'draft-string', status: 'DRAFT', slugs: ['draft-string'] },
  deleted: { _id: 'deleted', status: 'DELETED', slugs: ['deleted'] },
} as const;

const prices = [{ amount: 100, currencyCode: 'CHF', countryCode: 'CH' }];

const buildContext = ({ mayListDrafts = false } = {}) => {
  const checks: [string, unknown[]][] = [];
  const all = Object.values(products) as any[];
  const findById = (productId: string) => all.find(({ _id }) => _id === productId) ?? null;
  const context = {
    userId: 'user',
    roles: {
      userHasPermission: async (_context: unknown, action: string, args: unknown[]) => {
        checks.push([action, args]);
        return mayListDrafts;
      },
    },
    modules: {
      products: {
        findProduct: async ({ productId, slug }: { productId?: string; slug?: string }) =>
          slug ? (all.find(({ slugs }) => slugs.includes(slug)) ?? null) : findById(productId!),
        isActive: (p: { status: string | null }) => p.status === 'ACTIVE',
        prices: { catalogPrices: () => prices },
      },
    },
    loaders: {
      productLoader: { load: async ({ productId }: { productId: string }) => findById(productId) },
    },
  } as any;
  return { context, checks };
};

const hideDrafts = async (enabled: boolean) =>
  productsSettings.configureSettings({ hideDrafts: enabled });

describe('Query.product', () => {
  afterEach(() => hideDrafts(false));

  it('returns drafts and deleted products to anyone by default', async () => {
    const { context, checks } = buildContext();

    assert.equal((await product(undefined as never, { slug: 'draft' }, context))?._id, 'draft');
    assert.equal((await product(undefined as never, { productId: 'deleted' }, context))?._id, 'deleted');
    assert.deepEqual(checks, []);
  });

  it('with hideDrafts returns active products without a permission check', async () => {
    await hideDrafts(true);
    const { context, checks } = buildContext();

    assert.equal((await product(undefined as never, { slug: 'active' }, context))?._id, 'active');
    assert.deepEqual(checks, []);
  });

  it('with hideDrafts returns null for drafts and deleted products when drafts may not be listed', async () => {
    await hideDrafts(true);
    const { context, checks } = buildContext();

    assert.equal(await product(undefined as never, { slug: 'draft' }, context), null);
    assert.equal(await product(undefined as never, { productId: 'draft' }, context), null);
    assert.equal(await product(undefined as never, { slug: 'draft-string' }, context), null);
    assert.equal(await product(undefined as never, { productId: 'deleted' }, context), null);
    assert.deepEqual(
      checks,
      Array(4).fill(['viewProducts', [undefined, { includeDrafts: true }]]),
      'asks for the same permission as products(includeDrafts: true)',
    );
  });

  it('with hideDrafts returns drafts and deleted products to callers who may list drafts', async () => {
    await hideDrafts(true);
    const { context } = buildContext({ mayListDrafts: true });

    assert.equal((await product(undefined as never, { slug: 'draft' }, context))?._id, 'draft');
    assert.equal((await product(undefined as never, { productId: 'deleted' }, context))?._id, 'deleted');
  });

  it('returns null for unknown products without a permission check', async () => {
    await hideDrafts(true);
    const { context, checks } = buildContext();

    assert.equal(await product(undefined as never, { slug: 'unknown' }, context), null);
    assert.deepEqual(checks, []);
  });
});

describe('Query.productCatalogPrices', () => {
  afterEach(() => hideDrafts(false));

  it('returns the prices of drafts by default', async () => {
    const { context } = buildContext();

    assert.deepEqual(
      await productCatalogPrices(undefined as never, { productId: 'draft' }, context),
      prices,
    );
  });

  it('with hideDrafts treats a draft like an unknown product when drafts may not be listed', async () => {
    await hideDrafts(true);
    const { context } = buildContext();

    assert.equal(await productCatalogPrices(undefined as never, { productId: 'draft' }, context), null);
    assert.equal(
      await productCatalogPrices(undefined as never, { productId: 'unknown' }, context),
      null,
    );
    assert.deepEqual(
      await productCatalogPrices(undefined as never, { productId: 'active' }, context),
      prices,
    );
  });

  it('with hideDrafts returns the prices of drafts to callers who may list drafts', async () => {
    await hideDrafts(true);
    const { context } = buildContext({ mayListDrafts: true });

    assert.deepEqual(
      await productCatalogPrices(undefined as never, { productId: 'draft' }, context),
      prices,
    );
  });
});
