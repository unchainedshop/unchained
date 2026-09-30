import { ProductType, type Product } from '@unchainedshop/core-products';

/**
 * A ticket production is a CONFIGURABLE_PRODUCT with this tag. Its variants are the performances:
 * one TOKENIZED_PRODUCT per start (variation `slot`) and ticket category (variation `category`).
 */
export const TICKET_PRODUCTION_TAG = 'ticket-production';

export const isTicketProduction = (product?: Pick<Product, 'type' | 'tags'> | null): boolean =>
  product?.type === ProductType.CONFIGURABLE_PRODUCT &&
  Boolean(product.tags?.includes(TICKET_PRODUCTION_TAG));
