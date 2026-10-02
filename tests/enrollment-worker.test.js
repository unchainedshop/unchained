import assert from 'node:assert';
import test from 'node:test';
import { setTimeout } from 'node:timers/promises';
import { WorkerDirector } from '@unchainedshop/core';
import { setupDatabase, disconnect } from './helpers.js';
import { getTestPlatform } from './setup.js';
import { ActiveEnrollment, SuspendedWithResumeAtEnrollment } from './seeds/enrollments.js';
import { SimpleDeliveryProvider } from './seeds/deliveries.js';
import { SimplePaymentProvider } from './seeds/payments.js';

let db;
let unchainedAPI;

const DAY = 24 * 60 * 60 * 1000;

const generateOrders = () =>
  WorkerDirector.doWork({ type: 'ENROLLMENT_ORDER_GENERATOR', input: {} }, unchainedAPI);

const countEvents = async (type, enrollmentId) => {
  // Events are written asynchronously
  let count = 0;
  for (let attempt = 0; attempt < 20 && count === 0; attempt += 1) {
    count = await db.collection('events').countDocuments({
      type,
      'payload.enrollment._id': enrollmentId,
    });
    if (count === 0) await setTimeout(10);
  }
  return count;
};

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

  test('generates the order of the next period once the current one has ended', async () => {
    const enrollment = workerEnrollment({
      periods: [
        {
          start: new Date(Date.now() - 8 * DAY),
          end: new Date(Date.now() - DAY),
          orderId: 'worker-enrollment-previous-order',
          isTrial: false,
        },
      ],
    });
    await db.collection('enrollments').insertOne(enrollment);

    const result = await generateOrders();
    const storedEnrollment = await db.collection('enrollments').findOne({
      _id: enrollment._id,
    });

    assert.strictEqual(result.success, true);
    assert.strictEqual(storedEnrollment.periods.length, 2);
    assert.ok(storedEnrollment.periods[1].orderId);
    assert.ok(storedEnrollment.periods[1].start.getTime() <= Date.now());
  });

  test('emits the trial-ending event once for a stored trial', async () => {
    const trialPeriod = {
      start: new Date(Date.now() - DAY),
      end: new Date(Date.now() + 2 * DAY),
      isTrial: true,
    };
    const enrollment = workerEnrollment({
      _id: 'worker-trial-enrollment',
      enrollmentNumber: 'WORKER-TRIAL-ENROLLMENT',
      periods: [trialPeriod],
    });
    await db.collection('enrollments').insertOne(enrollment);

    await generateOrders();
    await generateOrders();

    const eventCount = await countEvents('ENROLLMENT_TRIAL_ENDING', enrollment._id);
    const storedEnrollment = await db.collection('enrollments').findOne({
      _id: enrollment._id,
    });

    assert.ok(storedEnrollment.periods[0].trialEndingNotifiedAt);
    assert.strictEqual(eventCount, 1);
  });

  test('resumes a suspended enrollment once its resumeAt date has passed', async () => {
    await generateOrders();

    const storedEnrollment = await db.collection('enrollments').findOne({
      _id: SuspendedWithResumeAtEnrollment._id,
    });

    assert.strictEqual(storedEnrollment.status, 'ACTIVE');
    assert.strictEqual(storedEnrollment.resumeAt, undefined);
    assert.strictEqual(await countEvents('ENROLLMENT_RESUME', SuspendedWithResumeAtEnrollment._id), 1);
  });
});
