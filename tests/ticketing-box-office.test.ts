import assert from 'node:assert/strict';
import { test } from 'node:test';
import { setupDatabase, createLoggedInGraphqlFetch } from './helpers.js';
import { USER_TOKEN } from './seeds/users.js';
import seedTicketing, { ConcertEventId, GATE_TOKEN, TheaterEventId } from './seeds/ticketing.js';

const BoxOfficeProvider = {
  _id: 'box-office',
  adapterKey: 'shop.unchained.payment.box-office',
  type: 'GENERIC',
  configuration: [],
  created: new Date('2026-01-01T00:00:00.000Z'),
};

const ADD_ITEMS = /* GraphQL */ `
  mutation AddItems($orderId: ID, $items: [OrderItemInput!]!) {
    addMultipleCartProducts(orderId: $orderId, items: $items) {
      _id
      supportedPaymentProviders {
        _id
      }
      payment {
        provider {
          _id
        }
      }
    }
  }
`;

const UPDATE_CART = /* GraphQL */ `
  mutation UpdateCart(
    $orderId: ID
    $paymentProviderId: ID
    $contact: ContactInput
    $billingAddress: AddressInput
  ) {
    updateCart(
      orderId: $orderId
      paymentProviderId: $paymentProviderId
      contact: $contact
      billingAddress: $billingAddress
    ) {
      _id
      payment {
        provider {
          _id
        }
      }
    }
  }
`;

const CHECKOUT = /* GraphQL */ `
  mutation Checkout($orderId: ID) {
    checkoutCart(orderId: $orderId) {
      _id
      status
      contact {
        emailAddress
      }
      payment {
        status
        provider {
          _id
        }
      }
      items {
        tokens {
          _id
          tokenSerialNumber
          attendeeName
          user {
            _id
          }
        }
      }
    }
  }
`;

test.describe('Ticketing: box office', () => {
  let db;
  let customerFetch;
  let staffFetch;

  test.before(async () => {
    [db] = await setupDatabase();
    await seedTicketing(db);
    await db.collection('payment-providers').insertOne({ ...BoxOfficeProvider });
    customerFetch = createLoggedInGraphqlFetch(USER_TOKEN);
    staffFetch = createLoggedInGraphqlFetch(GATE_TOKEN);
  });

  test('customers never get the box office payment provider', async () => {
    const { data, errors } = await customerFetch({
      query: ADD_ITEMS,
      variables: { items: [{ productId: TheaterEventId, quantity: 1 }] },
    });
    assert.ifError(errors?.[0]);
    const cart = data.addMultipleCartProducts;
    assert.ok(cart.supportedPaymentProviders.length > 0);
    assert.ok(!cart.supportedPaymentProviders.some(({ _id }) => _id === BoxOfficeProvider._id));

    // Picking it anyway does not stick: the cart falls back to a supported provider
    const { data: updated } = await customerFetch({
      query: UPDATE_CART,
      variables: { orderId: cart._id, paymentProviderId: BoxOfficeProvider._id },
    });
    assert.notEqual(updated?.updateCart?.payment?.provider?._id, BoxOfficeProvider._id);
  });

  test('staff sell tickets paid at the counter, with attendee names per seat', async () => {
    const { data, errors } = await staffFetch({
      query: ADD_ITEMS,
      variables: {
        items: [
          {
            productId: ConcertEventId,
            quantity: 2,
            configuration: [{ key: 'attendees', value: 'Ada Lovelace, ' }],
          },
        ],
      },
    });
    assert.ifError(errors?.[0]);
    const cart = data.addMultipleCartProducts;
    // Box office first, so it is the default of a staff cart
    assert.equal(cart.supportedPaymentProviders[0]._id, BoxOfficeProvider._id);
    assert.equal(cart.payment.provider._id, BoxOfficeProvider._id);

    const { errors: updateErrors } = await staffFetch({
      query: UPDATE_CART,
      variables: {
        orderId: cart._id,
        paymentProviderId: BoxOfficeProvider._id,
        contact: { emailAddress: 'walk-in@unchained.local', telNumber: null },
        // Like the Box Office page: set on every sale, empty without buyer details
        billingAddress: { firstName: null, lastName: null },
      },
    });
    assert.ifError(updateErrors?.[0]);

    const { data: checkedOut, errors: checkoutErrors } = await staffFetch({
      query: CHECKOUT,
      variables: { orderId: cart._id },
    });
    assert.ifError(checkoutErrors?.[0]);
    const order = checkedOut.checkoutCart;
    assert.equal(order.status, 'CONFIRMED');
    assert.equal(order.payment.status, 'PAID');
    assert.equal(order.payment.provider._id, BoxOfficeProvider._id);
    assert.equal(order.contact.emailAddress, 'walk-in@unchained.local');

    const tickets = order.items
      .flatMap(({ tokens }) => tokens)
      .sort((a, b) => Number(a.tokenSerialNumber) - Number(b.tokenSerialNumber));
    assert.deepEqual(
      tickets.map(({ attendeeName, user }) => ({ attendeeName, userId: user._id })),
      [
        { attendeeName: 'Ada Lovelace', userId: 'gate-staff' },
        { attendeeName: null, userId: 'gate-staff' },
      ],
    );
  });

  test('checkout with the box office provider is refused for customers', async () => {
    // Forced past the provider filter directly in the database: the adapter checks the permission itself
    const { data } = await customerFetch({
      query: ADD_ITEMS,
      variables: { items: [{ productId: TheaterEventId, quantity: 1 }] },
    });
    const orderId = data.addMultipleCartProducts._id;
    const order = await db.collection('orders').findOne({ _id: orderId });
    await db
      .collection('order_payments')
      .updateOne({ _id: order.paymentId }, { $set: { paymentProviderId: BoxOfficeProvider._id } });

    const { data: checkedOut, errors } = await customerFetch({
      query: CHECKOUT,
      variables: { orderId },
    });
    assert.ok(
      errors?.length || checkedOut?.checkoutCart?.payment?.provider?._id !== BoxOfficeProvider._id,
      'a customer order is never paid with the box office provider',
    );
    const payments = await db
      .collection('order_payments')
      .find({ orderId, paymentProviderId: BoxOfficeProvider._id, status: 'PAID' })
      .toArray();
    assert.equal(payments.length, 0);
  });
});
