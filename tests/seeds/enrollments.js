import { SimpleOrder } from './orders.js';
import { PlanProduct } from './products.js';

export const ActiveEnrollment = {
  _id: 'activeenrollment',
  status: 'ACTIVE',
  created: new Date(),
  expires: new Date('2030/09/10').getTime(),
  enrollmentNumber: 'RANDOME-initial',
  userId: 'admin',
  productId: PlanProduct._id,
  periods: [
    {
      orderId: SimpleOrder._id,
      start: new Date(),
      end: new Date('2030/09/10').getTime(),
      isTrial: false,
    },
  ],
  countryCode: 'ch',
  currencyCode: 'CHF',
  quantity: 2,
};

export const InitialEnrollment = {
  _id: 'initialenrollment',
  status: 'INITIAL',
  created: new Date(),
  expires: new Date().getTime(),
  periods: [
    {
      orderId: SimpleOrder._id,
      start: new Date(),
      end: 1603399340999,
      isTrial: false,
    },
  ],
  enrollmentNumber: 'enrollment',
  userId: 'admin',
  countryCode: 'ch',
  currencyCode: 'CHF',
  quantity: 1,
  productId: PlanProduct._id,
};

export const expiredEnrollment = {
  _id: 'expiredenrollment',
  status: 'TERMINATED',
  created: new Date(),
  expires: new Date('2010/01/03'),
  periods: [
    {
      orderId: SimpleOrder._id,
      start: new Date('2010/01/01').getTime(),
      end: new Date('2010/01/03').getTime(),
      isTrial: false,
    },
  ],
  enrollmentNumber: 'RANDOME-Initial2',
  userId: 'user',
  countryCode: 'ch',
  currencyCode: 'CHF',
  quantity: 1,
  productId: PlanProduct._id,
};

export const InitialEnrollmentWithWrongPlan = {
  _id: 'initialenrollment-wrong-plan',
  status: 'INITIAL',
  created: new Date(),
  expires: new Date().getTime(),
  periods: [
    {
      orderId: SimpleOrder._id,
      start: new Date(),
      end: 1603399340999,
      isTrial: false,
    },
  ],
  enrollmentNumber: 'RANDOME-wrong',
  userId: 'user',
  countryCode: 'ch',
  currencyCode: 'CHF',
  quantity: 1,
  productId: 'simpleproduct',
};

export const TerminatedEnrollment = {
  ...ActiveEnrollment,
  _id: 'terminatedenrollment',
  status: 'TERMINATED',
  enrollmentNumber: 'RANDOME-terminated',
};

export const AllEnrollmentIds = [
  ActiveEnrollment._id,
  InitialEnrollment._id,
  expiredEnrollment._id,
  InitialEnrollmentWithWrongPlan._id,
  TerminatedEnrollment._id,
];

// All enrollments for seeding
const allEnrollments = [
  ActiveEnrollment,
  InitialEnrollment,
  expiredEnrollment,
  InitialEnrollmentWithWrongPlan,
  TerminatedEnrollment,
];

export default async function seedEnrollment(db) {
  await db.collection('enrollments').findOrInsertOne(ActiveEnrollment);
  await db.collection('enrollments').findOrInsertOne(InitialEnrollment);
  await db.collection('enrollments').findOrInsertOne(InitialEnrollmentWithWrongPlan);
  await db.collection('enrollments').findOrInsertOne(expiredEnrollment);
  await db.collection('enrollments').findOrInsertOne(TerminatedEnrollment);
}

/**
 * Seed enrollments into the Drizzle database.
 * This directly inserts into the database WITHOUT using the module to avoid emitting events.
 * FTS index is automatically populated by SQLite triggers.
 */
export async function seedEnrollmentsToDrizzle(db) {
  const { enrollments } = await import('@unchainedshop/core-enrollments');

  // Delete all existing enrollments (FTS is cleaned by trigger)
  await db.delete(enrollments);

  // Insert all enrollments directly (FTS is populated by trigger)
  for (const enrollment of allEnrollments) {
    // Convert log dates to ISO strings for JSON storage
    const logWithStringDates = enrollment.log
      ? enrollment.log.map((entry) => ({
          ...entry,
          date: entry.date instanceof Date ? entry.date.toISOString() : entry.date,
        }))
      : null;

    await db.insert(enrollments).values({
      _id: enrollment._id,
      userId: enrollment.userId,
      productId: enrollment.productId,
      quantity: enrollment.quantity,
      countryCode: enrollment.countryCode,
      currencyCode: enrollment.currencyCode,
      enrollmentNumber: enrollment.enrollmentNumber,
      status: enrollment.status,
      orderIdForFirstPeriod: enrollment.orderIdForFirstPeriod || null,
      expires: enrollment.expires ? new Date(enrollment.expires) : null,
      configuration: enrollment.configuration || null,
      context: enrollment.context || null,
      meta: enrollment.meta || null,
      billingAddress: enrollment.billingAddress || null,
      contact: enrollment.contact || null,
      delivery: enrollment.delivery || null,
      payment: enrollment.payment || null,
      periods: enrollment.periods || null,
      log: logWithStringDates,
      created: enrollment.created,
      updated: null,
      deleted: null,
    });
  }
}
