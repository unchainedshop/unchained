import test from 'node:test';
import assert from 'node:assert';
import {
  setupDatabase,
  createLoggedInGraphqlFetch,
  disconnect,
  runWorkToCompletion,
} from './helpers.js';
import { ADMIN_TOKEN, User } from './seeds/users.js';
import { PlanProduct } from './seeds/products.js';
import { SimplePaymentProvider } from './seeds/payments.js';
import { SimpleDeliveryProvider } from './seeds/deliveries.js';

const WEEK = 7 * 24 * 60 * 60 * 1000;

let db;
let graphqlFetchAsAdmin;

test.describe('Worker: ENROLLMENT_ORDER_GENERATOR', () => {
  test.before(async () => {
    [db] = await setupDatabase();
    graphqlFetchAsAdmin = createLoggedInGraphqlFetch(ADMIN_TOKEN);
  });

  test.after(async () => {
    await disconnect();
  });

  test('generated orders reference their enrollment and do not enroll the customer again', async () => {
    await db.collection('enrollments').insertOne({
      _id: 'generator-enrollment',
      status: 'ACTIVE',
      created: new Date(),
      enrollmentNumber: 'GENERATOR',
      userId: User._id,
      productId: PlanProduct._id,
      quantity: 1,
      configuration: null,
      countryCode: 'CH',
      currencyCode: 'CHF',
      contact: { emailAddress: 'user@unchained.local' },
      billingAddress: {
        firstName: 'Hallo',
        lastName: 'Velo',
        addressLine: 'Strasse 1',
        postalCode: '8000',
        city: 'Zürich',
        countryCode: 'CH',
      },
      payment: { paymentProviderId: SimplePaymentProvider._id },
      delivery: { deliveryProviderId: SimpleDeliveryProvider._id },
      // The last period is over, so the generator starts the next one right away
      periods: [
        { start: new Date(Date.now() - 2 * WEEK), end: new Date(Date.now() - WEEK), isTrial: false },
      ],
      log: [],
    });

    assert.strictEqual(
      await runWorkToCompletion(graphqlFetchAsAdmin, 'ENROLLMENT_ORDER_GENERATOR'),
      'SUCCESS',
    );

    const enrollment = await db.collection('enrollments').findOne({ _id: 'generator-enrollment' });
    const { orderId } = enrollment.periods.find((period) => period.orderId) || {};
    assert.ok(orderId, 'the generator placed an order for the new period');

    const order = await db.collection('orders').findOne({ _id: orderId });
    assert.strictEqual(order.status, 'CONFIRMED');
    assert.strictEqual(order.originEnrollmentId, 'generator-enrollment');

    // Checking out the generated order must not create another enrollment for its plan item
    const enrollmentsOfOrder = await db
      .collection('enrollments')
      .find({ 'periods.orderId': orderId })
      .toArray();
    assert.deepStrictEqual(
      enrollmentsOfOrder.map(({ _id }) => _id),
      ['generator-enrollment'],
    );
  });
});
