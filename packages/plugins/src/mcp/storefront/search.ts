import { z } from 'zod';
import { productResults } from './productResult.ts';
import type { StorefrontMcpTool, StorefrontToolContext } from './tool.ts';

export interface ProductSearchToolOptions {
  productUrl: (product: { productId: string; slug?: string; locale: Intl.Locale }) => string;
  ui?: StorefrontMcpTool['ui'];
}

const inputSchema = z.strictObject({
  query: z
    .string()
    .trim()
    .min(1)
    .max(500)
    .optional()
    .describe('Free-text product search. Omit to browse.'),
  product_id: z.string().min(1).optional().describe('Exact product ID from a previous result.'),
  offset: z.number().int().nonnegative().default(0),
  limit: z.number().int().min(1).max(100).default(20),
});

const outputSchema = z.object({
  totalCount: z.number().int().nonnegative(),
  products: z.array(
    z.object({
      id: z.string(),
      name: z.string(),
      brand: z.string().optional(),
      description: z.string().optional(),
      price: z
        .number()
        .nullable()
        .describe('Quantity-one catalog price in major currency units. For variants, the lowest price.'),
      currency: z.string(),
      formatted_price: z.string().optional(),
      is_net_price: z.boolean().optional(),
      price_range: z.object({ min: z.number(), max: z.number() }).optional(),
      url: z.string(),
    }),
  ),
});

/** Search the current guest catalog. A null result means the shop disallows guest search. */
export async function searchStorefrontProducts(
  context: StorefrontToolContext,
  { product_id: productId, query, offset = 0, limit = 20 }: z.input<typeof inputSchema>,
  productUrl: ProductSearchToolOptions['productUrl'],
) {
  const { modules, services, locale, countryCode, currencyCode } = context;
  const searchQuery = {
    includeInactive: false,
    queryString: query,
    ...(productId && { productIds: [productId] }),
  };
  if (!(await context.hasPermission('search', searchQuery))) return null;
  if (productId && !(await context.hasPermission('viewProduct', { productId }))) {
    return { totalCount: 0, products: [] };
  }
  const market = { locale, countryCode, currencyCode };
  const { aggregatedFilteredProductIds, searchConfiguration } = await services.filters.searchProducts(
    searchQuery,
    market,
  );
  // A shop's adapters can expand hits during aggregation, even for an exact-ID search.
  const productIds = productId
    ? aggregatedFilteredProductIds.filter((id) => id === productId)
    : aggregatedFilteredProductIds;
  if (!productIds.length) return { totalCount: 0, products: [] };

  const selector = {
    productIds,
    productSelector: {
      $and: [modules.products.search.buildActiveStatusFilter(), searchConfiguration.productSelector],
    },
  };
  const [products, count] = await Promise.all([
    modules.products.search.findFilteredProducts({
      ...selector,
      offset,
      limit,
      sort: searchConfiguration.sortStage,
    }),
    offset === 0 && productIds.length <= limit
      ? undefined
      : modules.products.search.countFilteredProducts(selector),
  ]);
  return {
    totalCount: count ?? products.length,
    products: await productResults(products, context, productUrl),
  };
}

export function createProductSearchTool({
  productUrl,
  ui,
}: ProductSearchToolOptions): StorefrontMcpTool<typeof inputSchema> {
  return {
    name: 'search_products',
    ui,
    build: (context) => ({
      title: 'Search products',
      description:
        'Search the shop’s public catalog. When a shopper asks to see a previously listed product, call this tool with that result’s id as product_id.',
      inputSchema,
      outputSchema,
      annotations: {
        readOnlyHint: true,
        destructiveHint: false,
        idempotentHint: true,
        openWorldHint: false,
      },
      async handler(input) {
        const result = await searchStorefrontProducts(context, input, productUrl);
        if (!result) throw new Error('Anonymous catalog search is unavailable');
        return { structuredContent: result, content: [{ type: 'text', text: JSON.stringify(result) }] };
      },
    }),
  };
}
