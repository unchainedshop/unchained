import { Locale } from 'locale';
import { Context } from './api';
import {
  Address,
  Configuration,
  Contact,
  FindOptions,
  LogFields,
  TimestampFields,
  _ID,
} from './common';
import { Order } from './orders';
import { OrderPosition } from './orders.positions';

export enum EnrollmentStatus {
  INITIAL = 'INITIAL',
  ACTIVE = 'ACTIVE',
  PAUSED = 'PAUSED',
  TERMINATED = 'TERMINATED',
}

export interface EnrollmentPeriod {
  start: Date;
  end: Date;
  orderId?: string;
  isTrial?: boolean;
}

export interface EnrollmentPlan {
  productId: string;
  quantity: number;
  configuration: Configuration;
}

export type Enrollment = {
  _id?: _ID;
  billingAddress: Address;
  configuration: Configuration;
  contact: Contact;
  context?: any;
  countryCode?: string;
  currencyCode?: string;
  delivery: {
    deliveryProviderId?: string;
    context?: any;
  };
  enrollmentNumber?: string;
  expires?: Date;
  meta?: any;
  payment: {
    paymentProviderId?: string;
    context?: any;
  };
  periods: Array<EnrollmentPeriod>;
  productId: string;
  quantity?: number;
  status: string;
  userId: string;
} & LogFields &
  TimestampFields;

type EnrollmentContext = {
  enrollmentContext?: any;
};
type EnrollmentContextParams<P> = (
  enrollment: Enrollment,
  params: P,
  requestContext: Context
) => Promise<Enrollment>;

// Queries

export interface EnrollmentQueries {
  findEnrollment: (
    params: { enrollmentId?: string; orderId?: string },
    options?: FindOptions
  ) => Promise<Enrollment>;
  findEnrollments: (params: {
    limit?: number;
    offset?: number;
  }) => Promise<Array<Enrollment>>;
  count: () => Promise<number>;
}

// Transformations

export interface EnrollmentTransformations {
  normalizedStatus: (enrollment: Enrollment) => string;
  isExpired: (
    enrollment: Enrollment,
    params: { referenceDate?: Date }
  ) => boolean;
}

// Processing

export interface EnrollmentProcessing {
  terminateEnrollment: EnrollmentContextParams<EnrollmentContext>;
  activateEnrollment: EnrollmentContextParams<EnrollmentContext>;
}

// Mutations

export interface EnrollmentMutations {
  addEnrollmentPeriod: (
    enrollmentId: string,
    period: EnrollmentPeriod,
    userId?: string
  ) => Promise<Enrollment>;

  create: (
    doc: {
      billingAddress: Address;
      configuration: Configuration;
      contact: Contact;
      countryCode: string;
      currencyCode: string;
      delivery: Enrollment['delivery'];
      meta?: any;
      orderIdForFirstPeriod: string;
      payment: Enrollment['payment'];
      productId: string;
      quantity: number;
      userId: string;
    },
    requestContext: Context
  ) => Promise<Enrollment>;

  createFromCheckout: (
    order: Order,
    params: {
      orderPositions: Array<OrderPosition>;
      context: {
        paymentContext?: any;
        deliveryContext?: any;
      };
    },
    requestContext: Context
  ) => Promise<Array<Enrollment>>;

  delete: (enrollmentId: string, userId?: string) => Promise<number>;

  updateBillingAddress: (
    enrollmentId: string,
    billingAddress: Address,
    userId?: string
  ) => Promise<Enrollment>;

  updateContact: (
    enrollmentId: string,
    contact: Contact,
    userId?: string
  ) => Promise<Enrollment>;

  updateContext: (
    enrollmentId: string,
    context: any,
    userId?: string
  ) => Promise<Enrollment>;

  updateDelivery: (
    enrollmentId: string,
    delivery: Enrollment['delivery'],
    userId?: string
  ) => Promise<Enrollment>;

  updatePayment: (
    enrollmentId: string,
    payment: Enrollment['payment'],
    userId?: string
  ) => Promise<Enrollment>;

  updatePlan: (
    enrollmentId: string,
    plan: EnrollmentPlan,
    requestContext: Context
  ) => Promise<Enrollment>;

  updateStatus: (
    enrollmentId: string,
    params: { status: EnrollmentStatus; info?: string },
    requestContext: Context
  ) => Promise<Enrollment>;
}

export type EnrollmentsModule = EnrollmentQueries &
  EnrollmentTransformations &
  EnrollmentProcessing &
  EnrollmentMutations;
