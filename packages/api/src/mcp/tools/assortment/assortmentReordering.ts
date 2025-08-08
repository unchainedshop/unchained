import { z } from 'zod';
import { Context } from '../../../context.js';
import { log } from '@unchainedshop/logger';

const ReorderTypeEnum = z.enum(['PRODUCTS', 'FILTERS', 'LINKS', 'MEDIA'], {
  description:
    'Type of components to reorder - PRODUCTS for assortment products, FILTERS for assortment filters, LINKS for assortment links, MEDIA for assortment media',
});

const ReorderItemSchema = z.object({
  assortmentProductId: z
    .string()
    .optional()
    .describe('ID of assortment product (for PRODUCTS reordering)'),
  assortmentFilterId: z.string().optional().describe('ID of assortment filter (for FILTERS reordering)'),
  assortmentLinkId: z.string().optional().describe('ID of assortment link (for LINKS reordering)'),
  assortmentMediaId: z.string().optional().describe('ID of assortment media (for MEDIA reordering)'),
  sortKey: z
    .number()
    .describe('New sorting key/position - first item becomes primary media for MEDIA type'),
});

export const AssortmentReorderingSchema = {
  reorderType: ReorderTypeEnum.describe('Type of components to reorder'),
  sortKeys: z
    .array(ReorderItemSchema)
    .min(1)
    .describe('Array of items with their new sort keys/positions'),
};

export const AssortmentReorderingZodSchema = z.object(AssortmentReorderingSchema);
export type AssortmentReorderingParams = z.infer<typeof AssortmentReorderingZodSchema>;

export async function assortmentReordering(context: Context, params: AssortmentReorderingParams) {
  const { reorderType, sortKeys } = params;
  const { modules, userId } = context;

  try {
    log('handler assortmentReordering', { userId, reorderType, params });

    switch (reorderType) {
      case 'PRODUCTS': {
        const productSortKeys = sortKeys.map((item) => {
          if (!item.assortmentProductId) {
            throw new Error('assortmentProductId is required for PRODUCTS reordering');
          }
          return {
            assortmentProductId: item.assortmentProductId,
            sortKey: item.sortKey,
          };
        });

        await modules.assortments.products.updateManualOrder({
          sortKeys: productSortKeys,
        } as any);

        return {
          content: [
            {
              type: 'text' as const,
              text: JSON.stringify({
                success: true,
                reorderType: 'products',
                itemsReordered: productSortKeys.length,
              }),
            },
          ],
        };
      }

      case 'FILTERS': {
        const filterSortKeys = sortKeys.map((item) => {
          if (!item.assortmentFilterId) {
            throw new Error('assortmentFilterId is required for FILTERS reordering');
          }
          return {
            assortmentFilterId: item.assortmentFilterId,
            sortKey: item.sortKey,
          };
        });

        await modules.assortments.filters.updateManualOrder({
          sortKeys: filterSortKeys,
        } as any);

        return {
          content: [
            {
              type: 'text' as const,
              text: JSON.stringify({
                success: true,
                reorderType: 'filters',
                itemsReordered: filterSortKeys.length,
              }),
            },
          ],
        };
      }

      case 'LINKS': {
        const linkSortKeys = sortKeys.map((item) => {
          if (!item.assortmentLinkId) {
            throw new Error('assortmentLinkId is required for LINKS reordering');
          }
          return {
            assortmentLinkId: item.assortmentLinkId,
            sortKey: item.sortKey,
          };
        });

        await modules.assortments.links.updateManualOrder({
          sortKeys: linkSortKeys,
        } as any);

        return {
          content: [
            {
              type: 'text' as const,
              text: JSON.stringify({
                success: true,
                reorderType: 'links',
                itemsReordered: linkSortKeys.length,
              }),
            },
          ],
        };
      }

      case 'MEDIA': {
        const mediaSortKeys = sortKeys.map((item) => {
          if (!item.assortmentMediaId) {
            throw new Error('assortmentMediaId is required for MEDIA reordering');
          }
          return {
            assortmentMediaId: item.assortmentMediaId,
            sortKey: item.sortKey,
          };
        });

        const media = await modules.assortments.media.updateManualOrder({
          sortKeys: mediaSortKeys,
        } as any);

        return {
          content: [
            {
              type: 'text' as const,
              text: JSON.stringify({
                success: true,
                reorderType: 'media',
                itemsReordered: mediaSortKeys.length,
                media,
              }),
            },
          ],
        };
      }

      default:
        throw new Error(`Unknown reorder type: ${reorderType}`);
    }
  } catch (error) {
    return {
      content: [
        {
          type: 'text' as const,
          text: `Error reordering ${reorderType.toLowerCase()}: ${(error as Error).message}`,
        },
      ],
    };
  }
}
