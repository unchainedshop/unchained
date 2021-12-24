import { log } from 'meteor/unchained:logger';
import { ProductTypes } from 'meteor/unchained:core-products';
import {
  ProductNotFoundError,
  InvalidIdError,
  ProductWrongTypeError,
} from '../../../errors';
import { Context, Root } from '@unchainedshop/types/api';
import {
  ProductAssignment,
  ProductConfiguration,
} from '@unchainedshop/types/products';

export default async function removeProductAssignment(
  root: Root,
  params: { proxyId: string; vectors: Array<ProductConfiguration> },
  { modules, userId }: Context
) {
  const { proxyId, vectors } = params;
  log(`mutation removeProductAssignment ${proxyId}`, { userId });

  if (!proxyId) throw new InvalidIdError({ proxyId });

  const product = await modules.products.findProduct({ productId: proxyId });
  if (!product) throw new ProductNotFoundError({ proxyId });

  if (product.type !== ProductTypes.ConfigurableProduct)
    throw new ProductWrongTypeError({
      productId: proxyId,
      received: product.type,
      required: ProductTypes.ConfigurableProduct,
    });

  await modules.products.assignments.removeAssignment(
    proxyId,
    { vectors },
    userId
  );

  return await modules.products.findProduct({ productId: proxyId });
}
