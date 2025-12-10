import type { Context } from '../../../../context.ts';
import { ProductType } from '@unchainedshop/core-products';
import {
  CountryNotFoundError,
  CurrencyNotFoundError,
  ProductNotFoundError,
  ProductWrongStatusError,
  ProductWrongTypeError,
} from '../../../../errors.ts';
import { getNormalizedProductDetails } from '../../../utils/getNormalizedProductDetails.ts';
import type { Params } from '../schemas.ts';

export default async function updateProduct(context: Context, params: Params<'UPDATE'>) {
  const { modules, loaders } = context;
  const { productId, product } = params;

  const existingProduct = await modules.products.findProduct({ productId });
  if (!existingProduct) throw new ProductNotFoundError({ productId });

  const updateData: any = {};

  if (product.tags !== undefined) updateData.tags = product.tags;
  if (product.sequence !== undefined) updateData.sequence = product.sequence;
  if (product.meta !== undefined) updateData.meta = product.meta;

  if (product.plan !== undefined) {
    if (existingProduct.type !== ProductType.PLAN_PRODUCT) {
      throw new ProductWrongStatusError({
        received: existingProduct.type,
        required: ProductType.PLAN_PRODUCT,
      });
    }
    updateData.plan = product.plan;
  }

  if (product.warehousing !== undefined) {
    if (existingProduct.type !== ProductType.SIMPLE_PRODUCT) {
      throw new ProductWrongTypeError({
        productId,
        received: existingProduct.type,
        required: ProductType.SIMPLE_PRODUCT,
      });
    }
    updateData.warehousing = product.warehousing;
  }

  if (product.supply !== undefined) {
    if (existingProduct.type !== ProductType.SIMPLE_PRODUCT) {
      throw new ProductWrongTypeError({
        productId,
        received: existingProduct.type,
        required: ProductType.SIMPLE_PRODUCT,
      });
    }
    updateData.supply = product.supply;
  }

  if (product.tokenization !== undefined) {
    if (existingProduct.type !== ProductType.TOKENIZED_PRODUCT) {
      throw new ProductWrongStatusError({
        received: existingProduct.type,
        required: ProductType.TOKENIZED_PRODUCT,
      });
    }
    updateData.tokenization = product.tokenization;
  }

  if (product.commerce !== undefined) {
    await Promise.all(
      product.commerce.pricing.map(async ({ countryCode, currencyCode }) => {
        const currency = await loaders.currencyLoader.load({ isoCode: currencyCode });
        if (!currency) throw new CurrencyNotFoundError({ currencyCode });

        const country = await loaders.countryLoader.load({ isoCode: countryCode });
        if (!country) throw new CountryNotFoundError({ countryCode });
      }),
    );
    updateData.commerce = product.commerce;
  }

  if (Object.keys(updateData).length > 0) {
    await modules.products.update(productId, updateData);
  }

  return { product: await getNormalizedProductDetails(productId, context) };
}
