import { describe, it, mock, afterEach } from 'node:test';
import assert from 'node:assert';
import checkoutNodeJssdk from '@paypal/checkout-server-sdk';
import { PaymentDirector } from '@unchainedshop/core';
import './paypal-checkout.ts';

const paypalOrder = (status: string, customId?: string) => ({
  id: 'PAYPAL-ORDER',
  status,
  purchase_units: [
    {
      custom_id: customId,
      payments: {
        captures: [
          { id: 'CAPTURE', status: 'COMPLETED', amount: { value: '100.00', currency_code: 'CHF' } },
        ],
      },
    },
  ],
});

const charge = (result: any) => {
  const requests: string[] = [];
  mock.method(checkoutNodeJssdk.core.PayPalHttpClient.prototype, 'execute', async (request: any) => {
    requests.push(request.constructor.name);
    return { result };
  });
  const context = {
    order: {
      _id: 'order',
      currencyCode: 'CHF',
      calculation: [{ category: 'ITEMS', amount: 10000 }],
    },
    orderPayment: { _id: 'order-payment' },
  };
  const action = PaymentDirector.getAdapter('shop.unchained.payment.paypal')!
    .actions([], context as any)
    .charge({ orderID: 'PAYPAL-ORDER' });
  return { action, requests };
};

describe('PayPal Checkout charge', () => {
  afterEach(() => mock.restoreAll());

  it('pays with a PayPal order bound to the order payment', async () => {
    const { action } = charge(paypalOrder('COMPLETED', 'order-payment'));
    assert.deepStrictEqual(await action, { transactionId: 'PAYPAL-ORDER' });
  });

  it('refuses a PayPal order bound to another order payment', async () => {
    const { action } = charge(paypalOrder('COMPLETED', 'other-order-payment'));
    await assert.rejects(action, /another order payment/);
  });

  it('refuses a PayPal order without a binding', async () => {
    const { action } = charge(paypalOrder('COMPLETED'));
    await assert.rejects(action, /another order payment/);
  });

  it('does not capture an approved PayPal order of another order payment', async () => {
    const { action, requests } = charge(paypalOrder('APPROVED', 'other-order-payment'));
    await assert.rejects(action, /another order payment/);
    assert.deepStrictEqual(requests, ['OrdersGetRequest']);
  });
});
