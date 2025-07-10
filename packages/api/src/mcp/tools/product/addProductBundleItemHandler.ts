import { z } from 'zod';
import { Context } from '../../../context.js';
import { ProductNotFoundError, ProductWrongTypeError } from '../../../errors.js';
import { log } from '@unchainedshop/logger';
import { getNormalizedProductDetails } from '../../utils/getNormalizedProductDetails.js';
import { ProductTypes } from '@unchainedshop/core-products';

const AddProductBundleItemInputSchema = z.object({
  productId: z.string().min(1),
  quantity: z.number().int().min(1),
});

export const AddProductBundleItemSchema = {
  productId: z.string().min(1).describe('ID of the BUNDLE_PRODUCT to which the item will be added'),
  item: AddProductBundleItemInputSchema,
};

export const AddProductBundleItemZodSchema = z.object(AddProductBundleItemSchema);

export type AddProductBundleItemParams = z.infer<typeof AddProductBundleItemZodSchema>;
export const addProductBundleItemHandler = async (
  context: Context,
  params: AddProductBundleItemParams,
) => {
  const { modules, userId } = context;
  const { productId, item } = params;

  log('handler addProductBundleItemHandler', { userId, params });

  const product = await modules.products.findProduct({ productId });
  if (!product) throw new ProductNotFoundError({ productId });

  if (product.type !== ProductTypes.BundleProduct)
    throw new ProductWrongTypeError({
      productId,
      received: product.type,
      required: ProductTypes.BundleProduct,
    });

  if (!(await modules.products.productExists({ productId: item.productId })))
    throw new ProductNotFoundError({ productId: item.productId });

  await modules.products.bundleItems.addBundleItem(productId, item as any);

  return {
    content: [
      {
        type: 'text' as const,
        text: JSON.stringify({ product: await getNormalizedProductDetails(productId, context) }),
      },
    ],
  };
};
