import {
  OrderPricingRowCategory,
  OrderPricingSheet,
  ProductPricingRowCategory,
  ProductPricingSheet,
  type UnchainedCore,
} from '@unchainedshop/core';
import { OrderStatus, type Order, type OrderPosition } from '@unchainedshop/core-orders';
import { ProductType, type Product } from '@unchainedshop/core-products';
import { SortDirection } from '@unchainedshop/utils';
import { getTicketEventDetails, getTicketEventStart } from './event-details.ts';
import { findTicketCategoryTitle } from './ticket-details.ts';

type SalesReportAPI = Pick<UnchainedCore, 'modules'>;

export interface TicketSalesReportInput {
  /** Orders placed from this date on (inclusive) */
  from: Date | string;
  /** Orders placed before this date (exclusive) */
  to: Date | string;
  /** Language of the event titles and category names, e.g. 'de' */
  locale?: Intl.Locale | string;
}

/** Amounts are gross in the smallest unit of the currency; discounts are negative. */
export interface TicketSalesReportOrder {
  orderId: string;
  orderNumber?: string;
  ordered: Date;
  emailAddress?: string;
  telNumber?: string;
  billingName?: string;
  paymentProviderId?: string;
  paymentAdapterKey?: string;
  currencyCode: string;
  tickets: number;
  items: number;
  discounts: number;
  delivery: number;
  payment: number;
  total: number;
}

export interface TicketSalesReportPerformance {
  productId: string;
  title?: string;
  startsAt?: Date;
  categoryTitle?: string;
  currencyCode: string;
  tickets: number;
  /** Ticket prices before discounts */
  items: number;
  /** Discounts on the tickets themselves (order discounts are in the order totals) */
  discounts: number;
}

export interface TicketSalesReportPaymentProvider {
  paymentProviderId?: string;
  adapterKey?: string;
  currencyCode: string;
  orders: number;
  tickets: number;
  total: number;
}

export interface TicketSalesReportTotal {
  currencyCode: string;
  orders: number;
  tickets: number;
  items: number;
  discounts: number;
  total: number;
}

export interface TicketSalesReport {
  from: Date;
  to: Date;
  orders: TicketSalesReportOrder[];
  performances: TicketSalesReportPerformance[];
  paymentProviders: TicketSalesReportPaymentProvider[];
  totals: TicketSalesReportTotal[];
}

const isTicketProduct = (product?: Product | null): product is Product =>
  product?.type === ProductType.TOKENIZED_PRODUCT && Boolean(getTicketEventStart(product));

const toLocale = (locale: Intl.Locale | string) =>
  typeof locale === 'string' ? new Intl.Locale(locale) : locale;

const toDate = (value: Date | string, name: string) => {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) throw new Error(`Invalid ${name} date of the sales report`);
  return date;
};

const orderAmounts = (order: Order) => {
  const pricing = OrderPricingSheet({
    calculation: order.calculation,
    currencyCode: order.currencyCode,
  });
  const total = (category?: string) => pricing.total({ category, useNetPrice: false }).amount;
  return {
    items: total(OrderPricingRowCategory.Items),
    discounts: total(OrderPricingRowCategory.Discounts),
    delivery: total(OrderPricingRowCategory.Delivery),
    payment: total(OrderPricingRowCategory.Payment),
    total: total(),
  };
};

const positionAmounts = (position: OrderPosition, currencyCode: string) => {
  const pricing = ProductPricingSheet({
    calculation: position.calculation,
    currencyCode,
    quantity: position.quantity,
  });
  const total = (category: string) => pricing.total({ category, useNetPrice: false }).amount;
  return {
    items: total(ProductPricingRowCategory.Item),
    discounts: total(ProductPricingRowCategory.Discount),
  };
};

const billingName = (order: Order) =>
  [
    [order.billingAddress?.firstName, order.billingAddress?.lastName].filter(Boolean).join(' '),
    order.billingAddress?.company,
  ]
    .filter(Boolean)
    .join(', ') || undefined;

const getOrCreate = <T>(map: Map<string, T>, key: string, create: () => T) => {
  if (!map.has(key)) map.set(key, create());
  return map.get(key)!;
};

/**
 * The ticket sales of a period: the confirmed and fulfilled orders placed in it, with the tickets
 * and revenue per performance and the totals per payment provider and currency. Order totals include
 * everything of the order; tickets are the positions of ticket events.
 */
export async function buildTicketSalesReport(
  unchainedAPI: SalesReportAPI,
  { from: fromInput, to: toInput, locale = 'en' }: TicketSalesReportInput,
): Promise<TicketSalesReport> {
  const { modules } = unchainedAPI;
  const from = toDate(fromInput, 'from');
  const to = toDate(toInput, 'to');

  const orders = (
    await modules.orders.findOrders({
      status: [OrderStatus.CONFIRMED, OrderStatus.FULFILLED],
      dateRange: { start: from.toISOString(), end: to.toISOString() },
      sort: [{ key: 'ordered', value: SortDirection.ASC }],
    })
  ).filter(({ ordered }) => ordered && ordered >= from && ordered < to);

  const payments = await modules.orders.payments.findOrderPayments({
    orderPaymentIds: orders.map(({ paymentId }) => paymentId).filter(Boolean) as string[],
  });
  const providerIdOfPayment = new Map(
    payments.map((payment) => [payment._id, payment.paymentProviderId]),
  );
  const providers = await modules.payment.paymentProviders.findProviders({
    paymentProviderIds: [...new Set(payments.map(({ paymentProviderId }) => paymentProviderId))],
    includeDeleted: true,
  });
  const adapterKeyOfProvider = new Map(providers.map((provider) => [provider._id, provider.adapterKey]));

  const positions = await modules.orders.positions.findOrderPositions({
    orderIds: orders.map(({ _id }) => _id),
  });
  const products = await modules.products.findProducts({
    productIds: [...new Set(positions.map(({ productId }) => productId))],
    includeDrafts: true,
    includeDeleted: true,
  });
  const ticketProducts = new Map(
    products.filter(isTicketProduct).map((product) => [product._id, product] as const),
  );
  const positionsOfOrder = new Map<string, OrderPosition[]>();
  for (const position of positions) {
    if (!ticketProducts.has(position.productId)) continue;
    getOrCreate(positionsOfOrder, position.orderId, () => []).push(position);
  }

  const reportOrders: TicketSalesReportOrder[] = [];
  const performances = new Map<string, TicketSalesReportPerformance>();
  const paymentProviders = new Map<string, TicketSalesReportPaymentProvider>();
  const totals = new Map<string, TicketSalesReportTotal>();

  for (const order of orders) {
    const { currencyCode } = order;
    const ticketPositions = positionsOfOrder.get(order._id) || [];
    const tickets = ticketPositions.reduce((sum, { quantity }) => sum + quantity, 0);
    const amounts = orderAmounts(order);
    const paymentProviderId = order.paymentId ? providerIdOfPayment.get(order.paymentId) : undefined;
    const paymentAdapterKey = paymentProviderId
      ? adapterKeyOfProvider.get(paymentProviderId)
      : undefined;

    reportOrders.push({
      orderId: order._id,
      orderNumber: order.orderNumber,
      ordered: order.ordered!,
      emailAddress: order.contact?.emailAddress,
      telNumber: order.contact?.telNumber,
      billingName: billingName(order),
      paymentProviderId,
      paymentAdapterKey,
      currencyCode,
      tickets,
      ...amounts,
    });

    for (const position of ticketPositions) {
      const performance = getOrCreate(performances, `${position.productId}:${currencyCode}`, () => ({
        productId: position.productId,
        currencyCode,
        tickets: 0,
        items: 0,
        discounts: 0,
      }));
      const { items, discounts } = positionAmounts(position, currencyCode);
      performance.tickets += position.quantity;
      performance.items += items;
      performance.discounts += discounts;
    }

    const provider = getOrCreate(paymentProviders, `${paymentProviderId}:${currencyCode}`, () => ({
      paymentProviderId,
      adapterKey: paymentAdapterKey,
      currencyCode,
      orders: 0,
      tickets: 0,
      total: 0,
    }));
    provider.orders += 1;
    provider.tickets += tickets;
    provider.total += amounts.total;

    const total = getOrCreate(totals, currencyCode, () => ({
      currencyCode,
      orders: 0,
      tickets: 0,
      items: 0,
      discounts: 0,
      total: 0,
    }));
    total.orders += 1;
    total.tickets += tickets;
    total.items += amounts.items;
    total.discounts += amounts.discounts;
    total.total += amounts.total;
  }

  for (const performance of performances.values()) {
    const product = ticketProducts.get(performance.productId)!;
    const texts = await modules.products.texts.findLocalizedText({
      productId: product._id,
      locale: toLocale(locale),
    });
    performance.title = texts?.title || undefined;
    performance.startsAt = getTicketEventDetails(product).startsAt;
    performance.categoryTitle = await findTicketCategoryTitle(product, unchainedAPI, { locale });
  }

  return {
    from,
    to,
    orders: reportOrders,
    performances: [...performances.values()].sort(
      (a, b) =>
        (a.startsAt?.getTime() ?? 0) - (b.startsAt?.getTime() ?? 0) ||
        String(a.title).localeCompare(String(b.title)) ||
        String(a.categoryTitle).localeCompare(String(b.categoryTitle)),
    ),
    paymentProviders: [...paymentProviders.values()],
    totals: [...totals.values()],
  };
}
