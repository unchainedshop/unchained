import { z } from 'zod';
import { SortDirection } from '@unchainedshop/utils';
import { Context } from '../../context.js';
import { ProductText } from '@unchainedshop/core-products';

/**
 * Zod schema for the list_products tool (as raw object for MCP)
 */
export const ListProductsSchema = {
  // Search & Filter
  queryString: z.string().optional().describe('Text search across product fields'),
  tags: z.array(z.string()).optional().describe('Filter by product tags'),
  productIds: z.array(z.string()).optional().describe('Filter by specific product IDs'),
  filterQuery: z
    .array(
      z.object({
        key: z.string().describe('Filter key'),
        value: z.string().optional().describe('Filter value'),
      }),
    )
    .optional()
    .describe('Key-value filter pairs'),
  assortmentId: z.string().optional().describe('Filter by assortment'),
  includeInactive: z.boolean().default(false).describe('Include inactive products'),

  // Pagination
  limit: z.number().min(1).max(100).default(20).describe('Results per page'),
  offset: z.number().min(0).default(0).describe('Skip results for pagination'),

  // Sorting
  sort: z
    .array(
      z.object({
        key: z.string().describe('Sort field'),
        value: z.enum(['ASC', 'DESC']).describe('Sort direction'),
      }),
    )
    .optional()
    .describe('Sort options'),
};

/**
 * Zod object schema for type inference
 */
export const ListProductsZodSchema = z.object(ListProductsSchema);

/**
 * Interface for the list_products tool parameters
 */
export type ListProductsParams = z.infer<typeof ListProductsZodSchema>;

/**
 * Implementation of the list_products tool
 */
export async function listProductsHandler(context: Context, params: ListProductsParams) {
  const {
    queryString,
    tags,
    productIds,
    filterQuery,
    assortmentId,
    includeInactive = false,
    limit = 20,
    offset = 0,
    sort,
  } = params;

  try {
    let filteredProductIds = productIds;

    // If assortmentId is provided, get product IDs from assortment
    if (assortmentId) {
      const assortmentProductIds = await context.modules.assortments.products.findProductIds({
        assortmentId,
      });

      if (filteredProductIds) {
        // Intersection of both sets
        filteredProductIds = filteredProductIds.filter((id) => assortmentProductIds.includes(id));
      } else {
        filteredProductIds = assortmentProductIds;
      }
    }

    const searchResult = await context.services.filters.searchProducts(
      {
        queryString,
        productIds: filteredProductIds,
        includeInactive,
        filterQuery: filterQuery?.filter((f) => f.key) as { key: string; value?: string }[],
      },
      {
        locale: context.locale,
      },
    );

    const products = await context.modules.products.findProducts({
      productIds: searchResult.aggregatedFilteredProductIds,
      tags,
      limit,
      offset,
      sort: sort?.filter((s) => s.key) as { key: string; value: SortDirection }[],
    });

    const productTexts = await context.loaders.productTextLoader.loadMany(
      searchResult.aggregatedFilteredProductIds.map((productId) => ({
        productId,
        locale: context.locale,
      })),
    );

    // iterate all products and add texts
    products.forEach((product) => {
      const texts = productTexts.filter((text) => (text as ProductText).productId === product._id);
      (product as any).texts = texts;
    });

    return {
      content: [
        {
          type: 'text' as const,
          text: JSON.stringify({
            products,
            total: searchResult.aggregatedTotalProductIds.length,
            filtered: searchResult.aggregatedFilteredProductIds.length,
          }),
        },
      ],
    };
  } catch (error) {
    return {
      content: [{ type: 'text' as const, text: `Error listing products: ${(error as Error).message}` }],
    };
  }
}
