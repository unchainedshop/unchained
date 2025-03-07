import { mongodb, buildDbIndexes, isDocumentDBCompatModeEnabled } from '@unchainedshop/mongodb';
import { TimestampFields, LogFields, Address, Contact } from '@unchainedshop/mongodb';

export interface EnrollmentPeriod {
  start: Date;
  end: Date;
  orderId?: string;
  isTrial?: boolean;
}

export interface EnrollmentPlan {
  configuration: Array<{ key: string; value: string }>;
  productId: string;
  quantity: number;
}

export enum EnrollmentStatus {
  INITIAL = 'INITIAL',
  ACTIVE = 'ACTIVE',
  PAUSED = 'PAUSED',
  TERMINATED = 'TERMINATED',
}

export type Enrollment = {
  _id?: string;
  billingAddress: Address;
  configuration?: Array<{ key: string; value: string }>;
  contact: Contact;
  context?: any;
  countryCode?: string;
  currencyCode?: string;
  delivery: {
    deliveryProviderId?: string;
    context?: any;
  };
  enrollmentNumber?: string;
  orderIdForFirstPeriod?: string;
  expires?: Date;
  meta?: any;
  payment: {
    paymentProviderId?: string;
    context?: any;
  };
  periods: Array<EnrollmentPeriod>;
  productId: string;
  quantity?: number;
  status: EnrollmentStatus;
  userId: string;
} & LogFields &
  TimestampFields;

export const EnrollmentsCollection = async (db: mongodb.Db) => {
  const Enrollments = db.collection<Enrollment>('enrollments');

  // Enrollment Indexes
  await buildDbIndexes<Enrollment>(Enrollments, [
    { index: { userId: 1 } },
    { index: { productId: 1 } },
    { index: { status: 1 } },
    { index: { enrollmentNumber: 1 } },
    !isDocumentDBCompatModeEnabled() && {
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

  return Enrollments;
};
