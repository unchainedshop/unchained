import { Context } from '../../../context.js';
import { ProductNotFoundError, ProductWrongTypeError } from '../../../errors.js';
import { ProductTypes } from '@unchainedshop/core-products';
import { log } from '@unchainedshop/logger';
import { z } from 'zod';
import normalizeMediaUrl from '../../utils/normalizeMediaUrl.js';

export const ProductAssignmentsSchema = {
  productId: z
    .string()
    .min(1)
    .describe('ID of the CONFIGURABLE_PRODUCT whose assignments should be fetched'),
  includeInactive: z
    .boolean()
    .optional()
    .default(false)
    .describe('Whether to include inactive assigned products'),
};

export const ProductAssignmentsZodSchema = z.object(ProductAssignmentsSchema);
export type ProductAssignmentsParams = z.infer<typeof ProductAssignmentsZodSchema>;

export const productAssignmentsHandler = async (context: Context, params: ProductAssignmentsParams) => {
  const { modules, userId, loaders, locale } = context;
  const { productId, includeInactive } = params;

  log('handler productAssignmentsHandler', { userId, params });
  try {
    const product = await modules.products.findProduct({ productId });
    if (!product) throw new ProductNotFoundError({ productId });

    if (product.type !== ProductTypes.ConfigurableProduct) {
      throw new ProductWrongTypeError({
        productId,
        received: product.type,
        required: ProductTypes.ConfigurableProduct,
      });
    }

    const assignments = await modules.products.proxyAssignments(product, { includeInactive });
    const normalizedAssignments = await Promise.all(
      assignments.map(async ({ assignment, ...rest }) => {
        const product = await loaders.productLoader.load({
          productId: assignment.productId,
        });
        const productMedias = await modules.products.media.findProductMedias({ productId: product._id });
        const media = await normalizeMediaUrl(productMedias, context);
        const texts = await loaders.productTextLoader.load({
          productId,
          locale,
        });
        return {
          assignment: {
            ...assignment,
            product: {
              ...product,
              media,
              texts,
            },
          },
          ...rest,
        };
      }),
    );
    return {
      content: [
        {
          type: 'text' as const,
          text: JSON.stringify({ assignments: normalizedAssignments }),
        },
      ],
    };
  } catch (error) {
    return {
      content: [
        {
          type: 'text' as const,
          text: `Error fetching assignments: ${(error as Error).message}`,
        },
      ],
    };
  }
};
