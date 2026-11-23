import { describe, it } from 'node:test';
import assert from 'node:assert';
import { getOrderPositionsData, getOrderSummaryData } from './index.ts';

const NBSP = '\u00a0';

const order: any = {
  _id: 'order',
  currencyCode: 'JPY',
  deliveryId: 'delivery',
  paymentId: 'payment',
  calculation: [{ category: 'ITEMS', amount: 5900 }],
};

const api: any = {
  modules: {
    currencies: { findCurrency: async ({ isoCode }) => ({ isoCode, decimals: 0 }) },
    orders: {
      deliveries: { findDelivery: async () => ({ deliveryProviderId: 'post', context: {} }) },
      payments: { findOrderPayment: async () => ({ paymentProviderId: 'invoice' }) },
      positions: {
        findOrderPositions: async () => [
          { productId: 'ticket', quantity: 1, calculation: [{ category: 'ITEM', amount: 5900 }] },
        ],
      },
    },
    payment: { paymentProviders: { findProvider: async () => ({ adapterKey: 'invoice' }) } },
    delivery: { findProvider: async () => ({ adapterKey: 'post' }) },
    products: { texts: { findLocalizedText: async () => ({ title: 'Ticket' }) } },
  },
};

describe('order parser', () => {
  it('formats the amounts with the decimals of the order currency', async () => {
    const locale = new Intl.Locale('de-CH');
    const summary = await getOrderSummaryData(order, { locale }, api);
    const [position] = await getOrderPositionsData(order, { locale }, api);
    assert.deepStrictEqual(
      [summary.prices.gross, position.total],
      [`JPY${NBSP}5'900`, `JPY${NBSP}5'900`],
    );
  });

  it('hands the decimals to a custom formatter', async () => {
    const formatted: any[] = [];
    await getOrderPositionsData(
      order,
      { locale: new Intl.Locale('de-CH'), format: (price) => formatted.push(price) && '' },
      api,
    );
    assert.deepStrictEqual(formatted[0], { amount: 5900, currencyCode: 'JPY', decimals: 0 });
  });
});
