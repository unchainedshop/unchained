// CSV files of the ticket sales report, built by the e-mail worker and by the admin plugin from the
// same report data (dates as Date or ISO string). Only imports ./csv.ts, so the plugin bundles it.
import { toCsv } from './csv.ts';

type DateLike = Date | string | null | undefined;

interface SalesReportData {
  orders: {
    orderNumber?: string | null;
    ordered: DateLike;
    emailAddress?: string | null;
    telNumber?: string | null;
    billingName?: string | null;
    paymentAdapterKey?: string | null;
    paymentProviderId?: string | null;
    currencyCode: string;
    tickets: number;
    items: number;
    discounts: number;
    delivery: number;
    payment: number;
    total: number;
  }[];
  performances: {
    productId: string;
    title?: string | null;
    startsAt?: DateLike;
    categoryTitle?: string | null;
    currencyCode: string;
    tickets: number;
    items: number;
    discounts: number;
  }[];
  paymentProviders: {
    paymentProviderId?: string | null;
    adapterKey?: string | null;
    currencyCode: string;
    orders: number;
    tickets: number;
    total: number;
  }[];
}

/** An amount in the smallest unit as a decimal number, e.g. 3550 with 2 decimals → 35.5 */
export const toDecimalAmount = (amount: number, decimals: number) =>
  Number((amount / 10 ** decimals).toFixed(decimals));

const toIso = (value: DateLike) => (value ? new Date(value).toISOString() : null);

/** `decimals` maps currency codes to `Currency.decimals`; missing codes use 2. */
export function buildSalesReportCsv(report: SalesReportData, decimals: Record<string, number>) {
  const amount = (value: number, currencyCode: string) =>
    toDecimalAmount(value, decimals[currencyCode] ?? 2);
  return {
    orders: toCsv([
      [
        'orderNumber',
        'ordered',
        'email',
        'phone',
        'billingName',
        'paymentProvider',
        'currency',
        'tickets',
        'items',
        'discounts',
        'delivery',
        'payment',
        'total',
      ],
      ...report.orders.map((order) => [
        order.orderNumber,
        toIso(order.ordered),
        order.emailAddress,
        order.telNumber,
        order.billingName,
        order.paymentAdapterKey || order.paymentProviderId,
        order.currencyCode,
        order.tickets,
        amount(order.items, order.currencyCode),
        amount(order.discounts, order.currencyCode),
        amount(order.delivery, order.currencyCode),
        amount(order.payment, order.currencyCode),
        amount(order.total, order.currencyCode),
      ]),
    ]),
    performances: toCsv([
      ['productId', 'title', 'startsAt', 'category', 'currency', 'tickets', 'items', 'discounts'],
      ...report.performances.map((performance) => [
        performance.productId,
        performance.title,
        toIso(performance.startsAt),
        performance.categoryTitle,
        performance.currencyCode,
        performance.tickets,
        amount(performance.items, performance.currencyCode),
        amount(performance.discounts, performance.currencyCode),
      ]),
    ]),
    paymentProviders: toCsv([
      ['paymentProviderId', 'adapterKey', 'currency', 'orders', 'tickets', 'total'],
      ...report.paymentProviders.map((provider) => [
        provider.paymentProviderId,
        provider.adapterKey,
        provider.currencyCode,
        provider.orders,
        provider.tickets,
        amount(provider.total, provider.currencyCode),
      ]),
    ]),
  };
}
