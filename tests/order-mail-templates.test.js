import test from 'node:test';
import assert from 'node:assert';
import { WorkerDirector } from '@unchainedshop/core';
import {
  parser,
  resolveForwardDeliveryTemplate,
  resolveOrderConfirmationTemplate,
} from '@unchainedshop/platform';
import { setupDatabase, createLoggedInGraphqlFetch, disconnect } from './helpers.js';
import { getTestPlatform } from './setup.js';
import { ADMIN_TOKEN } from './seeds/users.js';
import { SimpleProduct } from './seeds/products.js';
import { SendMailDeliveryProvider } from './seeds/deliveries.js';
import { SimplePaymentProvider } from './seeds/payments.js';
import { BaseCurrency } from './seeds/locale-data.js';

const billingAddress = {
  firstName: 'Billing',
  lastName: 'Person',
  addressLine: 'Rechnungsstrasse 1',
  postalCode: '8000',
  city: 'Zürich',
  countryCode: 'CH',
};

const shippingAddress = {
  firstName: 'Shipping',
  lastName: 'Person',
  addressLine: 'Lieferweg 99',
  postalCode: '3000',
  city: 'Bern',
  countryCode: 'CH',
};

// The text between "<label>:" and the next blank line
const addressBlock = (text, label) => text.split(`${label}:\n`)[1]?.split('\n\n')[0];

let orderId;

test.describe('Order mail templates', () => {
  test.before(async () => {
    await setupDatabase();
    // Deliberately different from Intl's default precision for CHF.
    await getTestPlatform().unchainedAPI.modules.currencies.update(BaseCurrency._id, { decimals: 3 });
    const graphqlFetch = createLoggedInGraphqlFetch(ADMIN_TOKEN);

    const { data: { createCart } = {} } = await graphqlFetch({
      query: /* GraphQL */ `
        mutation {
          createCart(orderNumber: "mail-templates") {
            _id
          }
        }
      `,
    });
    orderId = createCart._id;

    const { data: { checkoutCart } = {}, errors } = await graphqlFetch({
      query: /* GraphQL */ `
        mutation Checkout(
          $orderId: ID!
          $productId: ID!
          $billingAddress: AddressInput
          $shippingAddress: AddressInput
          $deliveryProviderId: ID!
          $paymentProviderId: ID!
        ) {
          addCartProduct(orderId: $orderId, productId: $productId) {
            _id
          }
          updateCart(
            orderId: $orderId
            billingAddress: $billingAddress
            contact: { emailAddress: "admin@unchained.local" }
          ) {
            _id
          }
          updateCartDeliveryShipping(
            orderId: $orderId
            deliveryProviderId: $deliveryProviderId
            address: $shippingAddress
          ) {
            _id
          }
          updateCartPaymentInvoice(orderId: $orderId, paymentProviderId: $paymentProviderId) {
            _id
          }
          checkoutCart(orderId: $orderId) {
            _id
            status
          }
        }
      `,
      variables: {
        orderId,
        productId: SimpleProduct._id,
        billingAddress,
        shippingAddress,
        deliveryProviderId: SendMailDeliveryProvider._id,
        paymentProviderId: SimplePaymentProvider._id,
      },
    });
    assert.strictEqual(errors, undefined);
    assert.strictEqual(checkoutCart.status, 'CONFIRMED');
  });

  test.after(async () => {
    await disconnect();
  });

  test('order confirmation and delivery forwarding show the shipping address', async () => {
    const { unchainedAPI } = getTestPlatform();
    const [confirmation] = await resolveOrderConfirmationTemplate(
      { orderId, locale: 'de-CH' },
      unchainedAPI,
    );
    const [forwarding] = await resolveForwardDeliveryTemplate({ orderId, config: [] }, unchainedAPI);

    for (const { input } of [confirmation, forwarding]) {
      const deliveryAddress = addressBlock(input.text, 'Delivery Address');
      const billingAddressText = addressBlock(input.text, 'Billing Address');
      assert.match(deliveryAddress, /Lieferweg 99/);
      assert.doesNotMatch(deliveryAddress, /Rechnungsstrasse 1/);
      assert.match(billingAddressText, /Rechnungsstrasse 1/);
    }
  });

  test('order parsers use supplied decimals and the message worker reads current currency settings', async () => {
    const { unchainedAPI } = getTestPlatform();
    const order = await unchainedAPI.modules.orders.findOrder({ orderId });
    assert.equal(Object.hasOwn(order, 'currencyDecimals'), false);
    await unchainedAPI.modules.currencies.update(BaseCurrency._id, { decimals: 4 });
    const locale = new Intl.Locale('de-DE');
    const options = { locale, decimals: 3 };
    const summary = await parser.getOrderSummaryData(order, options, unchainedAPI);
    const [item] = await parser.getOrderPositionsData(order, options, unchainedAPI);
    assert.equal(item.rawPrices.unitPrice.amount, 10000);
    assert.equal(summary.rawPrices.gross.amount, 10000);
    assert.equal(item.unitPrice, '10,000\u00a0CHF');
    assert.equal(summary.prices.gross, item.unitPrice);
    const text = await parser.transformOrderToText({ order, ...options }, unchainedAPI);
    assert.ok(text.includes(`1x ${item.productTexts.title} ${item.unitPrice}`));
    assert.ok(text.includes(`Order Total ${summary.prices.gross}`));
    const worker = WorkerDirector.getAdapterByType('MESSAGE');
    const work = await worker.doWork(
      { template: 'ORDER_CONFIRMATION', orderId, locale: locale.baseName },
      unchainedAPI,
      'mail-precision-test',
    );
    assert.equal(work.success, true);
    const email = await unchainedAPI.modules.worker.findWork({ workId: work.result.forked[0]._id });
    assert.ok(email.input.text.includes(`1x ${item.productTexts.title} 1,0000\u00a0CHF`));
    assert.ok(email.input.text.includes('Order Total 1,0000\u00a0CHF'));
  });

  test('the order parser honors a custom formatter for positions and totals', async () => {
    const { unchainedAPI } = getTestPlatform();
    const order = await unchainedAPI.modules.orders.findOrder({ orderId });
    const options = {
      locale: new Intl.Locale('de-DE'),
      format: ({ amount, currencyCode }) => `${currencyCode} ${amount} minor units`,
    };
    const [item] = await parser.getOrderPositionsData(order, options, unchainedAPI);
    const summary = await parser.getOrderSummaryData(order, options, unchainedAPI);
    assert.equal(item.unitPrice, 'CHF 10000 minor units');
    assert.equal(summary.prices.gross, 'CHF 10000 minor units');
  });
});
