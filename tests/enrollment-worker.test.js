import assert from 'node:assert';
import test from 'node:test';
import { setTimeout } from 'node:timers/promises';
import { GenerateOrderWorker } from '@unchainedshop/plugins/worker/enrollment-order-generator';
import { setupDatabase, disconnect } from './helpers.js';
import { getTestPlatform } from './setup.js';
import { ActiveEnrollment } from './seeds/enrollments.js';
import { SimpleDeliveryProvider } from './seeds/deliveries.js';
import { SimplePaymentProvider } from './seeds/payments.js';

let db;
let unchainedAPI;

const workerEnrollment = (overrides) => ({
  ...ActiveEnrollment,
  _id: 'worker-enrollment',
  enrollmentNumber: 'WORKER-ENROLLMENT',
  billingAddress: {
    firstName: 'Worker',
    lastName: 'Enrollment',
    addressLine: 'Test street 1',
    postalCode: '8000',
    city: 'Zurich',
    countryCode: 'CH',
  },
  contact: {
    emailAddress: 'worker-enrollment@example.com',
  },
  delivery: {
    deliveryProviderId: SimpleDeliveryProvider._id,
  },
  payment: {
    paymentProviderId: SimplePaymentProvider._id,
  },
  configuration: [],
  ...overrides,
});

test.describe('Enrollment order generator', () => {
  test.before(async () => {
    [db] = await setupDatabase();
    ({ unchainedAPI } = getTestPlatform());
  });

  test.after(async () => {
    await disconnect();
  });

  test('links an order to an existing due unbilled period', async () => {
    const period = {
      start: new Date(Date.now() - 60 * 60 * 1000),
      end: new Date(Date.now() + 24 * 60 * 60 * 1000),
      isTrial: false,
    };
    const enrollment = workerEnrollment({ periods: [period] });
    await db.collection('enrollments').insertOne(enrollment);

    const result = await GenerateOrderWorker.doWork({}, unchainedAPI);
    const storedEnrollment = await db.collection('enrollments').findOne({
      _id: enrollment._id,
    });

    assert.strictEqual(result.success, true);
    assert.strictEqual(storedEnrollment.periods.length, 1);
    assert.ok(storedEnrollment.periods[0].orderId);
  });

  test('emits the trial-ending event once for a stored trial', async () => {
    const trialPeriod = {
      start: new Date(Date.now() - 24 * 60 * 60 * 1000),
      end: new Date(Date.now() + 2 * 24 * 60 * 60 * 1000),
      isTrial: true,
    };
    const enrollment = workerEnrollment({
      _id: 'worker-trial-enrollment',
      enrollmentNumber: 'WORKER-TRIAL-ENROLLMENT',
      periods: [trialPeriod],
    });
    await db.collection('enrollments').insertOne(enrollment);

    await GenerateOrderWorker.doWork({}, unchainedAPI);
    await GenerateOrderWorker.doWork({}, unchainedAPI);

    let eventCount = 0;
    for (let attempt = 0; attempt < 20 && eventCount === 0; attempt += 1) {
      eventCount = await db.collection('events').countDocuments({
        type: 'ENROLLMENT_TRIAL_ENDING',
        'payload.enrollment._id': enrollment._id,
      });
      if (eventCount === 0) await setTimeout(10);
    }
    const storedEnrollment = await db.collection('enrollments').findOne({
      _id: enrollment._id,
    });

    assert.ok(storedEnrollment.periods[0].trialEndingNotifiedAt);
    assert.strictEqual(eventCount, 1);
  });
});
