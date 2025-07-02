import { z } from 'zod';
import { Context } from '../../../context.js';
import { log } from '@unchainedshop/logger';

export const SearchAssortmentProductSchema = {
    assortmentId: z.string().min(1).describe('ID of the assortment to search in'),
    queryString: z.string().optional().describe('Search query string'),
    filterQuery: z
        .array(z.object({ key: z.string(), value: z.string().optional() }))
        .optional()
        .describe('Filter conditions'),
    includeInactive: z.boolean().optional().default(true),
    ignoreChildAssortments: z.boolean().optional().default(false),
    limit: z.number().int().min(1).max(100).default(20).describe('Pagination limit'),
    offset: z.number().int().min(0).default(0).describe('Pagination offset'),
};

export const SearchAssortmentProductZodSchema = z.object(SearchAssortmentProductSchema);

export type SearchAssortmentProductParams = z.infer<typeof SearchAssortmentProductZodSchema>;

export async function searchAssortmentProductHandler(
    context: Context,
    params: SearchAssortmentProductParams,
) {
    const { userId, modules, services, locale } = context;
    const { assortmentId, limit, offset, ...query } = params;

    try {
        log('handler searchAssortmentProduct', { userId, params });

        const productIds = await modules.assortments.findProductIds({
            assortmentId,
            ignoreChildAssortments: query.ignoreChildAssortments,
        });

        const filterIds = await modules.assortments.filters.findFilterIds({
            assortmentId,
        });
        const result = await services.filters.searchProducts(
            { ...query, productIds, filterIds } as any,
            {
                locale: locale,
            },
        );
        const productsCount = await modules.products.search.countFilteredProducts({
            productSelector: result.searchConfiguration.productSelector,
            productIds: result.aggregatedTotalProductIds,
        });
        const products = await modules.products.search.findFilteredProducts({
            limit,
            offset,
            productIds: result.aggregatedFilteredProductIds,
            productSelector: result.searchConfiguration.productSelector,
            sort: result.searchConfiguration.sortStage,
        });

        const relevantProductIds = await modules.products.findProductIds({
            productSelector: result.searchConfiguration.productSelector,
            productIds: result.totalProductIds,
            includeDrafts: result.searchConfiguration.searchQuery.includeInactive,
        });
        const filters = await services.filters.loadFilters(result.searchConfiguration.searchQuery, {
            productIds: relevantProductIds,
            forceLiveCollection: result.searchConfiguration.forceLiveCollection,
        });
        const filteredProductsCount = await modules.products.search.countFilteredProducts({
            productSelector: result.searchConfiguration.productSelector,
            productIds: result.aggregatedFilteredProductIds,
        });

        return {
            content: [
                {
                    type: 'text' as const,
                    text: JSON.stringify({ productsCount, products, filters, filteredProductsCount }),
                },
            ],
        };
    } catch (error) {
        return {
            content: [
                {
                    type: 'text' as const,
                    text: `Error searching products: ${(error as Error).message}`,
                },
            ],
        };
    }
}
