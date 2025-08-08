import { z } from 'zod';
import { Context } from '../../../context.js';
import { log } from '@unchainedshop/logger';
import { getNormalizedProductDetails } from '../../utils/getNormalizedProductDetails.js';
import { getNormalizedAssortmentDetails } from '../../utils/getNormalizedAssortmentDetails.js';
import normalizeMediaUrl from '../../utils/normalizeMediaUrl.js';

const GetterTypeEnum = z.enum(['PRODUCTS', 'FILTERS', 'LINKS', 'MEDIA'], {
  description:
    'Type of assortment component to retrieve - PRODUCTS for products, FILTERS for filters, LINKS for parent/child links, MEDIA for media assets',
});

export const AssortmentGettersSchema = {
  getterType: GetterTypeEnum.describe('Type of component to retrieve'),
  assortmentId: z
    .string()
    .min(1)
    .optional()
    .describe('ID of the assortment (optional for some operations)'),
  limit: z
    .number()
    .int()
    .min(1)
    .max(100)
    .default(10)
    .describe('Number of media items to return (MEDIA only)'),
  offset: z.number().int().min(0).default(0).describe('Pagination offset (MEDIA only)'),
  tags: z.array(z.string().min(1)).optional().describe('Filter media by lowercase tags (MEDIA only)'),
};

export const AssortmentGettersZodSchema = z.object(AssortmentGettersSchema);
export type AssortmentGettersParams = z.infer<typeof AssortmentGettersZodSchema>;

export async function assortmentGetters(context: Context, params: AssortmentGettersParams) {
  const { getterType, assortmentId, limit, offset, tags } = params;
  const { modules, loaders, userId } = context;

  try {
    log('handler assortmentGetters', { userId, getterType, params });

    switch (getterType) {
      case 'PRODUCTS': {
        const assortmentProducts = await modules.assortments.products.findAssortmentProducts(
          { assortmentId },
          { sort: { sortKey: 1 } },
        );

        const normalizedAssortmentProducts = await Promise.all(
          assortmentProducts.map(async ({ productId }) =>
            getNormalizedProductDetails(productId, context),
          ),
        );

        return {
          content: [
            {
              type: 'text' as const,
              text: JSON.stringify({ products: normalizedAssortmentProducts }),
            },
          ],
        };
      }

      case 'FILTERS': {
        const assortmentFilters = await modules.assortments.filters.findFilters(
          { assortmentId },
          { sort: { sortKey: 1 } },
        );

        return {
          content: [
            {
              type: 'text' as const,
              text: JSON.stringify({ filters: assortmentFilters }),
            },
          ],
        };
      }

      case 'LINKS': {
        const assortmentLinks = await loaders.assortmentLinksLoader.load({
          assortmentId,
        });

        const normalizedAssortmentLinks = await Promise.all(
          assortmentLinks.map(async ({ parentAssortmentId, childAssortmentId, ...rest }) => {
            const parent =
              parentAssortmentId === assortmentId
                ? null
                : await getNormalizedAssortmentDetails({ assortmentId: parentAssortmentId }, context);
            const child =
              childAssortmentId === assortmentId
                ? null
                : await getNormalizedAssortmentDetails({ assortmentId: childAssortmentId }, context);

            return {
              ...rest,
              parent,
              child,
            };
          }),
        );

        return {
          content: [
            {
              type: 'text' as const,
              text: JSON.stringify({ links: normalizedAssortmentLinks }),
            },
          ],
        };
      }

      case 'MEDIA': {
        if (!assortmentId) {
          throw new Error('assortmentId is required for MEDIA operations');
        }

        let media = [];
        if (offset || tags) {
          media = await modules.assortments.media.findAssortmentMedias({
            assortmentId,
            limit,
            offset,
            tags,
          });
        } else {
          media = (await loaders.assortmentMediasLoader.load({ assortmentId })).slice(
            offset,
            offset + limit,
          );
        }

        return {
          content: [
            {
              type: 'text' as const,
              text: JSON.stringify({ media: await normalizeMediaUrl(media, context) }),
            },
          ],
        };
      }

      default:
        throw new Error(`Unknown getter type: ${getterType}`);
    }
  } catch (error) {
    return {
      content: [
        {
          type: 'text' as const,
          text: `Error getting assortment ${getterType.toLowerCase()}: ${(error as Error).message}`,
        },
      ],
    };
  }
}
