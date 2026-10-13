import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import { acpConfig, type ACPContext } from './config.ts';
import { buildACPProductFeed } from './feed.ts';

const contextFor = (
  exportedProductIds: string[],
  catalog: Map<string, any>,
  onPage: (productIds: string[]) => void = () => undefined,
) =>
  ({
    locale: new Intl.Locale('de-CH'),
    services: {
      filters: {
        searchProducts: async () => ({
          searchConfiguration: {},
          aggregatedFilteredProductIds: exportedProductIds,
        }),
      },
      products: {
        simulateProductInventory: async () => [],
        simulateProductPricing: async () => null,
      },
      files: { resolveMediaFiles: async () => [] },
    },
    modules: {
      products: {
        search: {
          findFilteredProducts: async ({ productIds }) => {
            const products = productIds.flatMap((id) => catalog.get(id) ?? []);
            onPage(productIds);
            return products;
          },
        },
        findProducts: async ({ proxyAssignmentProductIds }) =>
          [...catalog.values()].filter(({ proxy }) =>
            proxy?.assignments.some(({ productId }) => proxyAssignmentProductIds.includes(productId)),
          ),
        proxyProducts: async ({ proxy }) =>
          proxy.assignments.map(({ productId }) => catalog.get(productId)),
        texts: { findLocalizedText: async () => null },
        media: { findProductMedias: async () => [] },
      },
    },
  }) as unknown as ACPContext;

const exportedRows = async (context: ACPContext) => {
  const feed = await new Response(await buildACPProductFeed(context)).text();
  return feed
    .trim()
    .split('\n')
    .map((line) => JSON.parse(line));
};

const product = (_id: string, assignedProductIds?: string[]) => [
  _id,
  {
    _id,
    slugs: [_id],
    ...(assignedProductIds
      ? {
          proxy: {
            assignments: assignedProductIds.map((productId) => ({
              productId,
              vector: { size: productId },
            })),
          },
        }
      : {}),
  },
];

describe('ACP product feed', () => {
  it('exports what the product search finds, variants only under their proxy', async (t) => {
    t.mock.property(acpConfig, 'sellerName', 'Test Shop');
    t.mock.property(acpConfig, 'productUrlBase', 'https://shop.test/products');
    const catalog = new Map([
      product('shirt', ['shirt-s', 'shirt-m']),
      product('shirt-s'),
      product('shirt-m'),
      product('mug'),
      product('hidden'),
    ] as [string, any][]);

    const rows = await exportedRows(contextFor(['shirt', 'shirt-s', 'shirt-m', 'mug'], catalog));

    assert.deepEqual(
      rows.map(({ id, variants }) => [id, variants.map(({ id: variantId }) => variantId)]),
      [
        ['shirt', ['shirt-s', 'shirt-m']],
        ['mug', ['mug']],
      ],
    );
  });

  it('exports every remaining product when products are deleted during the export', async (t) => {
    t.mock.property(acpConfig, 'sellerName', 'Test Shop');
    t.mock.property(acpConfig, 'productUrlBase', 'https://shop.test/products');
    const productIds = Array.from({ length: 600 }, (_, index) => `p${index}`);
    const catalog = new Map(productIds.map((productId) => product(productId)) as [string, any][]);
    const deleteDuringFirstPage = () => {
      catalog.delete('p0');
      catalog.delete('p300');
    };

    const rows = await exportedRows(contextFor(productIds, catalog, deleteDuringFirstPage));

    assert.deepEqual(
      rows.map(({ id }) => id),
      productIds.filter((productId) => productId !== 'p300'),
    );
  });
});
