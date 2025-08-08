import { z } from 'zod';
import { Context } from '../../../context.js';
import { log } from '@unchainedshop/logger';
import {
  AssortmentNotFoundError,
  ProductNotFoundError,
  FilterNotFoundError,
  AssortmentLinkNotFoundError,
} from '../../../errors.js';
import { getNormalizedAssortmentDetails } from '../../utils/getNormalizedAssortmentDetails.js';
import { getNormalizedProductDetails } from '../../utils/getNormalizedProductDetails.js';

const ComponentTypeEnum = z.enum(['PRODUCT', 'FILTER', 'LINK', 'MEDIA'], {
  description:
    'Type of assortment component - PRODUCT for products, FILTER for filters, LINK for links, MEDIA for media files',
});

const ComponentActionEnum = z.enum(['ADD', 'REMOVE'], {
  description: 'Action to perform - ADD to attach component, REMOVE to detach component',
});

export const AssortmentComponentsSchema = {
  action: ComponentActionEnum.describe(
    'Action to perform - ADD (attach component to assortment) or REMOVE (detach component from assortment)',
  ),
  componentType: ComponentTypeEnum.describe(
    'Type of component to manage - PRODUCT, FILTER, LINK (parent-child relationships), or MEDIA',
  ),
  assortmentId: z.string().min(1).describe('ID of the target assortment for all operations'),

  productId: z.string().optional().describe('Product ID - required for ADD PRODUCT operations only'),
  assortmentProductId: z
    .string()
    .optional()
    .describe('Assortment product relationship ID - required for REMOVE PRODUCT operations only'),
  productTags: z
    .array(z.string().min(1).toLowerCase())
    .optional()
    .describe('Lowercase tags for product association - used with ADD PRODUCT only'),

  filterId: z.string().optional().describe('Filter ID - required for ADD FILTER operations only'),
  assortmentFilterId: z
    .string()
    .optional()
    .describe('Assortment filter relationship ID - required for REMOVE FILTER operations only'),
  filterTags: z
    .array(z.string().min(1).toLowerCase())
    .optional()
    .describe('Lowercase tags for filter association - used with ADD FILTER only'),

  assortmentLinkId: z
    .string()
    .optional()
    .describe('Existing assortment link ID - required for REMOVE LINK operations only'),
  parentAssortmentId: z
    .string()
    .optional()
    .describe('Parent assortment ID - required for ADD LINK operations only'),
  childAssortmentId: z
    .string()
    .optional()
    .describe('Child assortment ID - required for ADD LINK operations only'),
  linkTags: z
    .array(z.string().min(1).toLowerCase())
    .optional()
    .describe('Lowercase tags for link association - used with ADD LINK only'),

  mediaId: z.string().optional().describe('Media file ID - required for ADD MEDIA operations only'),
  assortmentMediaId: z
    .string()
    .optional()
    .describe('Assortment media relationship ID - required for REMOVE MEDIA operations only'),
  mediaTags: z
    .array(z.string().min(1).toLowerCase())
    .optional()
    .describe('Lowercase tags for media association - used with ADD MEDIA only'),
};

export const AssortmentComponentsZodSchema = z.object(AssortmentComponentsSchema);
export type AssortmentComponentsParams = z.infer<typeof AssortmentComponentsZodSchema>;

export async function assortmentComponents(context: Context, params: AssortmentComponentsParams) {
  const {
    action,
    componentType,
    assortmentId,
    productId,
    productTags,
    filterId,
    filterTags,
    assortmentLinkId,
    parentAssortmentId,
    childAssortmentId,
    linkTags,
    mediaId,
    mediaTags,
  } = params;
  const { modules, userId } = context;

  try {
    log('handler assortmentComponents', { userId, action, componentType, params });

    const assortment = await getNormalizedAssortmentDetails({ assortmentId }, context);
    if (!assortment) {
      throw new AssortmentNotFoundError({ assortmentId });
    }

    switch (componentType) {
      case 'PRODUCT': {
        if (!productId) {
          throw new Error('productId is required for PRODUCT operations');
        }

        const product = await getNormalizedProductDetails(productId, context);
        if (!product) {
          throw new ProductNotFoundError({ productId });
        }

        if (action === 'ADD') {
          const assortmentProduct = await modules.assortments.products.create({
            assortmentId,
            productId,
            tags: productTags,
          } as any);

          return {
            content: [
              {
                type: 'text' as const,
                text: JSON.stringify({
                  assortmentProduct: { ...assortmentProduct, assortment, product },
                }),
              },
            ],
          };
        } else {
          const result = await modules.assortments.products.delete(productId);

          return {
            content: [
              {
                type: 'text' as const,
                text: JSON.stringify({
                  removed: result,
                  assortment,
                  product,
                }),
              },
            ],
          };
        }
      }

      case 'FILTER': {
        if (!filterId) {
          throw new Error('filterId is required for FILTER operations');
        }

        const filter = await modules.filters.findFilter({ filterId });
        if (!filter) {
          throw new FilterNotFoundError({ filterId });
        }

        if (action === 'ADD') {
          const assortmentFilter = await modules.assortments.filters.create({
            assortmentId,
            filterId,
            tags: filterTags,
          } as any);

          return {
            content: [
              {
                type: 'text' as const,
                text: JSON.stringify({
                  assortmentFilter: { ...assortmentFilter, assortment, filter },
                }),
              },
            ],
          };
        } else {
          const result = await modules.assortments.filters.delete(filterId);

          return {
            content: [
              {
                type: 'text' as const,
                text: JSON.stringify({
                  removed: result,
                  assortment,
                  filter,
                }),
              },
            ],
          };
        }
      }

      case 'LINK': {
        if (action === 'ADD') {
          if (!parentAssortmentId || !childAssortmentId) {
            throw new Error(
              'parentAssortmentId and childAssortmentId are required for ADD LINK operations',
            );
          }

          const assortmentLink = await modules.assortments.links.create({
            parentAssortmentId,
            childAssortmentId,
            tags: linkTags,
          } as any);

          return {
            content: [
              {
                type: 'text' as const,
                text: JSON.stringify({ assortmentLink }),
              },
            ],
          };
        } else {
          if (!assortmentLinkId) {
            throw new Error('assortmentLinkId is required for REMOVE LINK operations');
          }

          const existing = await modules.assortments.links.findLink({ assortmentLinkId });
          if (!existing) {
            throw new AssortmentLinkNotFoundError({ assortmentLinkId });
          }

          const result = await modules.assortments.links.delete(assortmentLinkId);

          return {
            content: [
              {
                type: 'text' as const,
                text: JSON.stringify({
                  removed: result,
                  assortmentLink: existing,
                }),
              },
            ],
          };
        }
      }

      case 'MEDIA': {
        if (!mediaId) {
          throw new Error('mediaId is required for MEDIA operations');
        }

        if (action === 'ADD') {
          const assortmentMedia = await modules.assortments.media.create({
            assortmentId,
            mediaId,
            tags: mediaTags,
          } as any);

          return {
            content: [
              {
                type: 'text' as const,
                text: JSON.stringify({
                  assortmentMedia: { ...assortmentMedia, assortment },
                }),
              },
            ],
          };
        } else {
          const result = await modules.assortments.media.delete(mediaId);

          return {
            content: [
              {
                type: 'text' as const,
                text: JSON.stringify({
                  removed: result,
                  assortment,
                }),
              },
            ],
          };
        }
      }

      default:
        throw new Error(`Unknown component type: ${componentType}`);
    }
  } catch (error) {
    return {
      content: [
        {
          type: 'text' as const,
          text: `Error ${action.toLowerCase()}ing ${componentType.toLowerCase()}: ${(error as Error).message}`,
        },
      ],
    };
  }
}
