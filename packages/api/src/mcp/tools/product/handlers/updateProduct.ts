import { Context } from '../../../../context.js';
import { ProductTypes } from '@unchainedshop/core-products';
import {
  ProductNotFoundError,
  ProductWrongStatusError,
  ProductWrongTypeError,
} from '../../../../errors.js';
import { getNormalizedProductDetails } from '../../../utils/getNormalizedProductDetails.js';
import { Params } from '../schemas.js';

export default async function updateProduct(context: Context, params: Params<'UPDATE'>) {
  const { modules } = context;
  const { productId, product } = params;

  const existingProduct = await modules.products.findProduct({ productId });
  if (!existingProduct) throw new ProductNotFoundError({ productId });

  const updateData: any = {};

  if (product.tags !== undefined) updateData.tags = product.tags;
  if (product.sequence !== undefined) updateData.sequence = product.sequence;
  if (product.meta !== undefined) updateData.meta = product.meta;

  if (product.plan !== undefined) {
    if (existingProduct.type !== ProductTypes.PlanProduct) {
      throw new ProductWrongStatusError({
        received: existingProduct.type,
        required: ProductTypes.PlanProduct,
      });
    }
    updateData.plan = product.plan;
  }

  if (product.warehousing !== undefined) {
    if (existingProduct.type !== ProductTypes.SimpleProduct) {
      throw new ProductWrongTypeError({
        productId,
        received: existingProduct.type,
        required: ProductTypes.SimpleProduct,
      });
    }
    updateData.warehousing = product.warehousing;
  }

  if (product.supply !== undefined) {
    if (existingProduct.type !== ProductTypes.SimpleProduct) {
      throw new ProductWrongTypeError({
        productId,
        received: existingProduct.type,
        required: ProductTypes.SimpleProduct,
      });
    }
    updateData.supply = product.supply;
  }

  if (product.tokenization !== undefined) {
    if (existingProduct.type !== ProductTypes.TokenizedProduct) {
      throw new ProductWrongStatusError({
        received: existingProduct.type,
        required: ProductTypes.TokenizedProduct,
      });
    }
    updateData.tokenization = product.tokenization;
  }

  if (product.commerce !== undefined) {
    updateData.commerce = product.commerce;
  }

  if (Object.keys(updateData).length > 0) {
    await modules.products.update(productId, updateData);
  }

  return { product: await getNormalizedProductDetails(productId, context) };
}
