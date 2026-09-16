import assert from 'node:assert/strict';
import { describe, test, type TestContext } from 'node:test';
import { OrderPricingSheet, type OrderPricingCalculation } from '@unchainedshop/core';
import { PostfinanceCheckout } from './postfinance-checkout/adapter.ts';
import { PostFinanceApiClient } from './postfinance-checkout/api-client.ts';
import { WordlineSaferpay } from './saferpay/adapter.ts';

// Run this same contract suite on the pre-net revision with
// PRICING_CONTRACT_FORMAT=gross. Only fixture storage changes, never expectations.
const calculationFormat = process.env.PRICING_CONTRACT_FORMAT ?? 'net';
assert.ok(['gross', 'net'].includes(calculationFormat), 'Unknown pricing contract format');
const grossFormat = calculationFormat === 'gross';

const fresh = OrderPricingSheet({ currencyCode: 'EUR' });
fresh.addItems({ amount: grossFormat ? 10_000 : 9_285, taxAmount: 715 });
fresh.addDelivery({ amount: grossFormat ? 2_000 : 1_857, taxAmount: 143 });
fresh.addPayment({ amount: grossFormat ? 500 : 464, taxAmount: 36 });
fresh.addDiscount({ amount: grossFormat ? -1_000 : -928.5, taxAmount: -71.5, discountId: 'promo' });

// These persisted fixtures retain original gross rows alongside marked migration
// offsets. Omit those offsets when exercising the original runtime and storage.
const persistedRows = (rows: OrderPricingCalculation[]) =>
  grossFormat ? rows.filter((row) => row.isNetPrice !== true) : rows;

const fixtures: { name: string; amount: number; calculation: OrderPricingCalculation[] }[] = [
  { name: 'fresh taxable order with fees and discount', amount: 11_500, calculation: fresh.calculation },
  {
    name: 'persisted taxable order with fees and discount',
    amount: 11_500,
    calculation: persistedRows([
      { category: 'ITEMS', amount: 10_000 },
      { category: 'ITEMS', amount: -715, isNetPrice: true },
      { category: 'TAXES', baseCategory: 'ITEMS', amount: 715 },
      { category: 'DELIVERY', amount: 2_000 },
      { category: 'DELIVERY', amount: -143, isNetPrice: true },
      { category: 'TAXES', baseCategory: 'DELIVERY', amount: 143 },
      { category: 'PAYMENT', amount: 500 },
      { category: 'PAYMENT', amount: -36, isNetPrice: true },
      { category: 'TAXES', baseCategory: 'PAYMENT', amount: 36 },
      { category: 'DISCOUNTS', amount: -1_000, discountId: 'promo' },
      { category: 'DISCOUNTS', amount: 71.5, discountId: 'promo', isNetPrice: true },
      { category: 'TAXES', baseCategory: 'DISCOUNTS', amount: -71.5, discountId: 'promo' },
    ]),
  },
  {
    name: 'persisted historical half-cent boundary',
    amount: 121,
    // The legacy charged total was 121.49999999999999. Its converted representation
    // needs the final adjustment to preserve the same payment of 121, rather than 122.
    calculation: persistedRows([
      { category: 'ITEMS', amount: 135 },
      { category: 'ITEMS', amount: -9.651810584958213, isNetPrice: true },
      { category: 'TAXES', baseCategory: 'ITEMS', amount: 9.651810584958213 },
      { category: 'DISCOUNTS', amount: -13.5, discountId: 'promo' },
      { category: 'DISCOUNTS', amount: 0.9651810584958209, discountId: 'promo', isNetPrice: true },
      {
        category: 'TAXES',
        baseCategory: 'DISCOUNTS',
        amount: -0.9651810584958209,
        discountId: 'promo',
      },
      { category: 'ROUNDING', amount: -1.4210854715202004e-14, isNetPrice: true },
    ]),
  },
];

const paymentContext = (calculation: OrderPricingCalculation[]) => ({
  order: {
    _id: 'pricing-contract-order',
    userId: 'pricing-contract-user',
    currencyCode: 'EUR',
    calculation,
  },
  orderPayment: {
    _id: 'pricing-contract-payment',
    orderId: 'pricing-contract-order',
    transactionId: '123',
  },
  paymentProvider: { _id: 'pricing-contract-provider' },
});

const configureSaferpay = (t: TestContext) => {
  const environment = {
    SAFERPAY_CUSTOMER_ID: 'test-customer',
    SAFERPAY_API_USER: 'test-user',
    SAFERPAY_API_PASSWORD: 'test-password',
    SAFERPAY_BASE_URL: 'https://payments.example/api',
    ROOT_URL: 'https://shop.example',
    EMAIL_WEBSITE_URL: 'https://shop.example',
  };
  for (const [key, value] of Object.entries(environment)) {
    const original = process.env[key];
    process.env[key] = value;
    t.after(() => {
      if (original === undefined) delete process.env[key];
      else process.env[key] = original;
    });
  }
};

describe('payment plugin pricing contracts', () => {
  for (const fixture of fixtures) {
    test(`Saferpay signs and validates ${fixture.name} in minor units`, async (t) => {
      configureSaferpay(t);
      const context = paymentContext(fixture.calculation);
      const transactionId = Buffer.from('00112233445566778899aabb', 'hex');
      const setToken = t.mock.fn(async () => undefined);
      let gatewayAmount = fixture.amount.toString();
      let gatewayCurrency = 'EUR';
      const requests: { url: string; body: any }[] = [];
      t.mock.method(globalThis, 'fetch', async (url, options) => {
        const body = JSON.parse(options.body);
        requests.push({ url, body });
        if (url === 'https://payments.example/api/Payment/v1/PaymentPage/Initialize') {
          assert.deepEqual(body.Payment.Amount, {
            Value: fixture.amount.toString(),
            CurrencyCode: 'EUR',
          });
          assert.equal(body.Payment.OrderId, context.order._id);
          return Response.json({
            Token: 'test-token',
            RedirectUrl: 'https://payments.example/checkout',
          });
        }
        assert.equal(url, 'https://payments.example/api/Payment/v1/PaymentPage/Assert');
        return Response.json({
          Transaction: {
            Amount: { Value: gatewayAmount, CurrencyCode: gatewayCurrency },
            Status: 'CAPTURED',
          },
        });
      });
      const actions = WordlineSaferpay.actions([{ key: 'terminalId', value: 'test-terminal' }], {
        ...context,
        modules: {
          saferpayTransactions: {
            createTransaction: async () => transactionId,
            setToken,
            findTransactionById: async () => ({ token: 'test-token' }),
          },
        },
      } as any);

      const signed = JSON.parse((await actions.sign())!);
      assert.equal(signed.location, 'https://payments.example/checkout');
      assert.equal(requests.length, 1);
      assert.deepEqual(setToken.mock.calls[0].arguments, [transactionId, 'test-token']);
      const payment = { transactionId: transactionId.toString('hex') };
      assert.ok(await actions.charge(payment));

      gatewayAmount = (fixture.amount + 1).toString();
      await assert.rejects(actions.charge(payment), { name: 'SAFERPAY_WRONG_STATUS_CAPTURED' });
      gatewayAmount = fixture.amount.toString();
      gatewayCurrency = 'USD';
      await assert.rejects(actions.charge(payment), { name: 'SAFERPAY_WRONG_STATUS_CAPTURED' });
    });

    test(`PostFinance signs, validates and refunds ${fixture.name} in major units`, async (t) => {
      const context = paymentContext(fixture.calculation);
      const requests: { method: string; endpoint: string; body: any }[] = [];
      let gatewayAmount = fixture.amount / 100;
      let gatewayCurrency = 'EUR';
      // Intercept the API boundary before credential-dependent signing. No network
      // fallback is allowed, even if developer credentials are present.
      t.mock.method(globalThis, 'fetch', async () => {
        throw new Error('Unexpected network request');
      });
      t.mock.method(PostFinanceApiClient.prototype, 'request', async (method, endpoint, body) => {
        requests.push({ method, endpoint, body });
        if (method === 'POST' && endpoint.startsWith('/transaction/create?')) return { id: 123 };
        if (method === 'GET' && endpoint.startsWith('/transaction-payment-page/payment-page-url?')) {
          return 'https://payments.example/checkout';
        }
        if (method === 'GET' && endpoint.startsWith('/transaction/read?')) {
          return {
            id: 123,
            state: 'FULFILL',
            completedAmount: gatewayAmount,
            currency: gatewayCurrency,
            metaData: { orderPaymentId: context.orderPayment._id },
          };
        }
        assert.equal(method, 'POST');
        assert.ok(endpoint.startsWith('/refund/refund?'));
        return { id: 456 };
      });
      const actions = PostfinanceCheckout.actions([], { ...context, modules: {} } as any);

      const signed = JSON.parse(
        (await actions.sign({
          successUrl: 'https://shop.example/success',
          failedUrl: 'https://shop.example/failed',
        }))!,
      );
      assert.deepEqual(signed, { transactionId: 123, location: 'https://payments.example/checkout' });
      assert.equal(requests[0].body.currency, 'EUR');
      assert.equal(requests[0].body.lineItems.length, 1);
      assert.equal(requests[0].body.lineItems[0].amountIncludingTax, fixture.amount / 100);
      assert.equal(requests[0].body.lineItems[0].quantity, 1);
      assert.ok(await actions.charge({ transactionId: '123' }));

      gatewayAmount = (fixture.amount + 1) / 100;
      await assert.rejects(actions.charge({ transactionId: '123' }), {
        name: 'POSTFINANCE_STATE_FULFILL',
      });
      gatewayAmount = fixture.amount / 100;
      gatewayCurrency = 'USD';
      await assert.rejects(actions.charge({ transactionId: '123' }), {
        name: 'POSTFINANCE_STATE_FULFILL',
      });

      gatewayCurrency = 'EUR';
      assert.equal(await actions.cancel(), true);
      const refund = requests.find(({ endpoint }) => endpoint.startsWith('/refund/refund?'));
      assert.ok(refund);
      assert.equal(refund.body.amount, fixture.amount / 100);
      assert.equal(refund.body.transaction, 123);
    });
  }
});
