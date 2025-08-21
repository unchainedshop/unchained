import { Context } from '../../../../context.js';
import { Params } from '../schemas.js';

export default async function removeAssortmentProduct(
  context: Context,
  params: Params<'REMOVE_PRODUCT'>,
) {
  const { modules } = context;
  const { assortmentProductId } = params;

  await modules.assortments.products.delete(assortmentProductId);
  return { success: true };
}
