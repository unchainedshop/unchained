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
      start: new Date('2010/01/01').getTime(),
      end: new Date('2010/01/03').getTime(),
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
  countryId: 'ch',
  currencyId: 'chf',
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

export default async function seedEnrollment(db) {
  await db.collection('enrollments').findOrInsertOne(ActiveEnrollment);
  await db.collection('enrollments').findOrInsertOne(InitialEnrollment);
  await db.collection('enrollments').findOrInsertOne(InitialEnrollmentWithWrongPlan);
  await db.collection('enrollments').findOrInsertOne(expiredEnrollment);
  await db.collection('enrollments').findOrInsertOne(TerminatedEnrollment);
}
