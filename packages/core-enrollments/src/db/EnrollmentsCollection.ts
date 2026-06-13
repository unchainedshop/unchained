import { mongodb, buildDbIndexes } from '@unchainedshop/mongodb';
import {
  type TimestampFields,
  type LogFields,
  type Address,
  type Contact,
} from '@unchainedshop/mongodb';

export interface EnrollmentPeriod {
  start: Date;
  end: Date;
  orderId?: string;
  isTrial?: boolean;
}

export interface EnrollmentPlan {
  configuration: { key: string; value: string }[] | null;
  productId: string;
  quantity: number;
}

export const EnrollmentStatus = {
  INITIAL: 'INITIAL',
  ACTIVE: 'ACTIVE',
  PAUSED: 'PAUSED',
  SUSPENDED: 'SUSPENDED',
  TERMINATED: 'TERMINATED',
} as const;

export const EnrollmentTerminationReason = {
  USER_REQUESTED: 'USER_REQUESTED',
  PAYMENT_FAILED: 'PAYMENT_FAILED',
  EXPIRED: 'EXPIRED',
  ADMIN_ACTION: 'ADMIN_ACTION',
  OTHER: 'OTHER',
} as const;

export type EnrollmentTerminationReason =
  (typeof EnrollmentTerminationReason)[keyof typeof EnrollmentTerminationReason];

export type EnrollmentStatus = (typeof EnrollmentStatus)[keyof typeof EnrollmentStatus];

export interface EnrollmentOrderPositionTemplate {
  context?: any;
  configuration?: { key: string; value: string }[];
  originalProductId: string;
  productId: string;
  quantity: number;
  quotationId?: string;
}

export type Enrollment = {
  _id: string;
  billingAddress: Address;
  configuration: { key: string; value: string }[] | null;
  contact: Contact;
  context?: any;
  countryCode: string;
  currencyCode: string;
  delivery: {
    deliveryProviderId?: string;
    context?: any;
  };
  enrollmentNumber?: string;
  orderIdForFirstPeriod?: string;
  expires?: Date;
  requestedTerminationDate?: Date;
  resumeAt?: Date;
  cancellationReason?: EnrollmentTerminationReason;
  cancellationComment?: string;
  meta?: any;
  payment?: {
    paymentProviderId: string;
    context?: any;
  };
  periods: EnrollmentPeriod[];
  productId: string;
  quantity?: number;
  status: EnrollmentStatus | null;
  userId: string;
} & LogFields &
  TimestampFields;

export const EnrollmentsCollection = async (db: mongodb.Db) => {
  const Enrollments = db.collection<Enrollment>('enrollments');

  await buildDbIndexes<Enrollment>(Enrollments, [
    {
      index: {
        _id: 'text',
        userId: 'text',
        enrollmentNumber: 'text',
        status: 'text',
        'contact.telNumber': 'text',
        'contact.emailAddress': 'text',
      } as any,
      options: {
        weights: {
          _id: 8,
          userId: 3,
          enrollmentNumber: 6,
          'contact.telNumber': 5,
          'contact.emailAddress': 4,
          status: 1,
        },
        name: 'enrollment_fulltext_search',
      },
    },
  ]);

  await buildDbIndexes<Enrollment>(Enrollments, [
    { index: { 'periods.orderId': 1 } as any },
    { index: { userId: 1, status: 1 } },
    { index: { productId: 1, status: 1 } },
    { index: { status: 1 } },
    { index: { enrollmentNumber: 1 } },
  ]);

  return Enrollments;
};
