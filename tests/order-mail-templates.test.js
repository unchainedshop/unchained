import test from 'node:test';
import assert from 'node:assert';
import {
  resolveForwardDeliveryTemplate,
  resolveOrderConfirmationTemplate,
} from '@unchainedshop/platform';
import { setupDatabase, createLoggedInGraphqlFetch, disconnect } from './helpers.js';
import { getTestPlatform } from './setup.js';
import { ADMIN_TOKEN } from './seeds/users.js';
import { SimpleProduct } from './seeds/products.js';
import { SendMailDeliveryProvider } from './seeds/deliveries.js';
import { SimplePaymentProvider } from './seeds/payments.js';

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
});
