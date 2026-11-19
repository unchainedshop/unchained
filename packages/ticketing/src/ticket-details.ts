import { ProductPricingRowCategory, ProductPricingSheet, type UnchainedCore } from '@unchainedshop/core';
import type { Order, OrderPosition } from '@unchainedshop/core-orders';
import type { Product } from '@unchainedshop/core-products';
import type { TokenSurrogate } from '@unchainedshop/core-warehousing';
import type { Price } from '@unchainedshop/utils';
import {
  TicketEventProperty,
  TicketStatus,
  getTicketEventDetails,
  getTicketStatus,
  isTicketEventCancelled,
} from './event-details.ts';
import { buildTicketScanPayload } from './scan-payload.ts';

type TicketDetailsAPI = Pick<UnchainedCore, 'modules'>;

const toLocale = (locale: Intl.Locale | string) =>
  typeof locale === 'string' ? new Intl.Locale(locale) : locale;

/**
 * The name of the ticket category of an event: the text of the option of the production's
 * `category` variation. Events outside of a production, and categories without a text, return the
 * stored category value.
 */
export async function findTicketCategoryTitle(
  product: Product,
  { modules }: TicketDetailsAPI,
  {
    locale,
    getProxy = () => modules.products.firstActiveProductProxy(product._id),
  }: { locale: Intl.Locale | string; getProxy?: () => Promise<Product | null> },
): Promise<string | undefined> {
  const { category } = getTicketEventDetails(product);
  if (!category) return undefined;
  const production = await getProxy();
  if (!production) return category;
  const variation = await modules.products.variations.findProductVariationByKey({
    productId: production._id,
    key: TicketEventProperty.CATEGORY,
  });
  if (!variation) return category;
  const text = await modules.products.variations.texts.findLocalizedVariationText({
    productVariationId: variation._id,
    productVariationOptionValue: category,
    locale: toLocale(locale),
  });
  return text?.title || category;
}

async function findTicketPosition(token: TokenSurrogate, { modules }: TicketDetailsAPI) {
  if (token.orderPositionId) {
    return modules.orders.positions.findOrderPosition({ itemId: token.orderPositionId });
  }
  const orderId = token.meta?.orderId;
  if (typeof orderId !== 'string') return null;
  const positions = (await modules.orders.positions.findOrderPositions({ orderId })).filter(
    ({ productId }) => productId === token.productId,
  );
  return positions.length === 1 ? positions[0] : null;
}

/** The order and order position a ticket was bought with; null without them. */
export async function findTicketPurchase(
  token: TokenSurrogate,
  unchainedAPI: TicketDetailsAPI,
): Promise<{ order: Order; position: OrderPosition } | null> {
  const position = await findTicketPosition(token, unchainedAPI);
  if (!position) return null;
  const order = await unchainedAPI.modules.orders.findOrder({ orderId: position.orderId });
  return order ? { order, position } : null;
}

/** The price of one ticket as it was ordered, before order discounts; null without its order. */
export async function findTicketPrice(
  token: TokenSurrogate,
  unchainedAPI: TicketDetailsAPI,
): Promise<Price | null> {
  const purchase = await findTicketPurchase(token, unchainedAPI);
  if (!purchase?.position.quantity) return null;
  const { order, position } = purchase;
  const pricing = ProductPricingSheet({
    calculation: position.calculation,
    currencyCode: order.currencyCode,
    quantity: position.quantity,
  });
  if (!pricing.isValid()) return null;
  const { amount } = pricing.total({ category: ProductPricingRowCategory.Item, useNetPrice: false });
  return { amount: Math.round(amount / position.quantity), currencyCode: order.currencyCode };
}

export interface TicketDetailsOptions {
  /** Language of the texts, e.g. 'de' */
  locale: Intl.Locale | string;
  /** Where the QR code points to, e.g. the ticket page of the storefront: https://shop.example.com/tickets */
  scanBaseUrl: string;
}

/**
 * Everything a ticket shows (PDF, Apple Wallet, Google Wallet, e-mail), with the QR payload the
 * Gate Control scanner reads. Rendering stays with the project.
 */
export async function getTicketDetails(
  token: TokenSurrogate,
  unchainedAPI: TicketDetailsAPI,
  { locale, scanBaseUrl }: TicketDetailsOptions,
) {
  const { modules } = unchainedAPI;
  const product = await modules.products.findProduct({ productId: token.productId });
  if (!product) throw new Error(`Event ${token.productId} of ticket ${token._id} not found`);
  const texts = await modules.products.texts.findLocalizedText({
    productId: product._id,
    locale: toLocale(locale),
  });
  const accessKey = await modules.warehousing.buildAccessKeyFromToken(token);
  const attendeeName = token.meta?.attendeeName;

  return {
    token,
    product,
    title: texts?.title || product._id,
    subtitle: texts?.subtitle || undefined,
    description: texts?.description || undefined,
    // startsAt, endsAt, doorsOpenAt, location, category (only valid values)
    event: getTicketEventDetails(product),
    categoryTitle: await findTicketCategoryTitle(product, unchainedAPI, { locale }),
    price: await findTicketPrice(token, unchainedAPI),
    // VALID, REDEEMED or CANCELLED; a cancelled event cancels all its tickets
    status: isTicketEventCancelled(product) ? TicketStatus.CANCELLED : getTicketStatus(token),
    attendeeName:
      typeof attendeeName === 'string' && attendeeName.trim() ? attendeeName.trim() : undefined,
    serialNumber: token.tokenSerialNumber,
    accessKey,
    scanPayload: buildTicketScanPayload({ tokenId: token._id, accessKey }, { baseUrl: scanBaseUrl }),
  };
}

export type TicketDetails = Awaited<ReturnType<typeof getTicketDetails>>;
