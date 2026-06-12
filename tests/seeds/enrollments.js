import { SimpleOrder } from './orders.js';
import { PlanProduct } from './products.js';

export const ActiveEnrollment = {
  _id: 'activeenrollment',
  status: 'ACTIVE',
  created: new Date(),
  expires: new Date('2030/09/10'),
  enrollmentNumber: 'RANDOME-initial',
  userId: 'admin',
  productId: PlanProduct._id,
  periods: [
    {
      orderId: SimpleOrder._id,
      start: new Date(),
      end: new Date('2030/09/10'),
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
  expires: new Date('2030/09/10'),
  periods: [
    {
      orderId: SimpleOrder._id,
      start: new Date(),
      end: new Date(1603399340999),
      isTrial: false,
    },
  ],
  enrollmentNumber: 'enrollment',
  userId: 'admin',
  countryId: 'ch',
  currencyId: 'chf',
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
      start: new Date('2010/01/01'),
      end: new Date('2010/01/03'),
      isTrial: false,
    },
  ],
  enrollmentNumber: 'RANDOME-Initial2',
  userId: 'user',
  countryId: 'ch',
  currencyId: 'chf',
  quantity: 1,
  productId: PlanProduct._id,
};

export const InitialEnrollmentWithWrongPlan = {
  _id: 'initialenrollment-wrong-plan',
  status: 'INITIAL',
  created: new Date(),
  expires: new Date('2030/09/10'),
  periods: [
    {
      orderId: SimpleOrder._id,
      start: new Date(),
      end: new Date(1603399340999),
      isTrial: false,
    },
  ],
  enrollmentNumber: 'RANDOME-wrong',
  userId: 'user',
  countryId: 'ch',
  currencyId: 'chf',
  quantity: 1,
  productId: 'simpleproduct',
};

export const SuspendedEnrollment = {
  _id: 'suspendedenrollment',
  status: 'SUSPENDED',
  created: new Date(),
  expires: new Date('2030/09/10'),
  enrollmentNumber: 'RANDOM-suspended',
  userId: 'admin',
  productId: PlanProduct._id,
  periods: [
    {
      orderId: SimpleOrder._id,
      start: new Date(),
      end: new Date('2030/09/10'),
      isTrial: false,
    },
  ],
  countryCode: 'ch',
  currencyCode: 'CHF',
  quantity: 1,
};

export const ScheduledTerminationEnrollment = {
  _id: 'scheduledterminationenrollment',
  status: 'ACTIVE',
  created: new Date(),
  requestedTerminationDate: new Date('2025/01/01'),
  enrollmentNumber: 'RANDOM-scheduled',
  userId: 'admin',
  productId: PlanProduct._id,
  periods: [
    {
      orderId: SimpleOrder._id,
      start: new Date('2024/01/01'),
      end: new Date('2025/01/01'),
      isTrial: false,
    },
  ],
  countryCode: 'ch',
  currencyCode: 'CHF',
  quantity: 1,
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
  SuspendedEnrollment._id,
  ScheduledTerminationEnrollment._id,
  TerminatedEnrollment._id,
];

export default async function seedEnrollment(db) {
  await db.collection('enrollments').findOrInsertOne(ActiveEnrollment);
  await db.collection('enrollments').findOrInsertOne(InitialEnrollment);
  await db.collection('enrollments').findOrInsertOne(InitialEnrollmentWithWrongPlan);
  await db.collection('enrollments').findOrInsertOne(expiredEnrollment);
  await db.collection('enrollments').findOrInsertOne(SuspendedEnrollment);
  await db.collection('enrollments').findOrInsertOne(ScheduledTerminationEnrollment);
  await db.collection('enrollments').findOrInsertOne(TerminatedEnrollment);
}
