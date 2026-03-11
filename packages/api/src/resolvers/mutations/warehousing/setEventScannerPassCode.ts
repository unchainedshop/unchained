import { log } from '@unchainedshop/logger';
import { InvalidIdError, ProductNotFoundError } from '../../../errors.ts';
import type { Context } from '../../../context.ts';

export default async function setEventScannerPassCode(
  root: never,
  { productId, passCode }: { productId: string; passCode?: string | null },
  { modules, userId }: Context,
) {
  log(`mutation setEventScannerPassCode ${productId}`, { userId });

  if (!productId) throw new InvalidIdError({ productId });

  const product = await modules.products.findProduct({ productId });
  if (!product) throw new ProductNotFoundError({ productId });

  const existingMeta = (product.meta as Record<string, any>) || {};
  const updatedMeta = { ...existingMeta };

  if (passCode === null || passCode === undefined) {
    delete updatedMeta.scannerPassCode;
  } else {
    updatedMeta.scannerPassCode = passCode;
  }

  await modules.products.update(productId, { meta: updatedMeta });

  return modules.products.findProduct({ productId });
}
