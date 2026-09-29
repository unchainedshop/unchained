import { log } from '@unchainedshop/logger';
import type { Context } from '../../../context.ts';
import {
  type ProductContractStandard,
  type ProductTokenization,
  ProductType,
} from '@unchainedshop/core-products';
import { ProductNotFoundError, InvalidIdError, ProductWrongStatusError } from '../../../errors.ts';

export interface ProductTokenizationInput {
  contractAddress?: string | null;
  contractStandard: ProductContractStandard;
  tokenId?: string | null;
  supply: number;
  ercMetadataProperties?: Record<string, any> | null;
}

const KEPT_WHEN_OMITTED = ['contractAddress', 'tokenId', 'ercMetadataProperties'] as const;

/**
 * Partial update of a product's tokenization: an omitted optional field keeps the stored value,
 * null clears it and a value replaces it (ercMetadataProperties as a whole, no deep merge).
 * Clients like the admin Token tab never send ercMetadataProperties, and replacing the whole
 * subdocument used to wipe the event slot stored there.
 */
export function mergeTokenizationInput(
  stored: Partial<ProductTokenization> | null | undefined,
  input: ProductTokenizationInput,
): ProductTokenization {
  const merged: Record<string, unknown> = { ...input };
  for (const key of KEPT_WHEN_OMITTED) {
    const value = input[key] === undefined ? stored?.[key] : input[key];
    // The driver would store an undefined field as null, so cleared fields are left out
    if (value == null) delete merged[key];
    else merged[key] = value;
  }
  return merged as unknown as ProductTokenization;
}

export default async function updateProductTokenization(
  root: never,
  { tokenization, productId }: { tokenization: ProductTokenizationInput; productId: string },
  { modules, userId }: Context,
) {
  log(`mutation updateProductTokenization ${productId}`, { userId });

  if (!productId) throw new InvalidIdError({ productId });

  const product = await modules.products.findProduct({ productId });
  if (!product) throw new ProductNotFoundError({ productId });

  if (product?.type !== ProductType.TOKENIZED_PRODUCT)
    throw new ProductWrongStatusError({
      received: product?.type,
      required: ProductType.TOKENIZED_PRODUCT,
    });

  await modules.products.update(productId, {
    tokenization: mergeTokenizationInput(product.tokenization, tokenization),
  });

  return modules.products.findProduct({ productId });
}
