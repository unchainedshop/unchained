import { Context } from './api';
import {
  Address,
  Configuration,
  Contact,
  FindOptions,
  IBaseAdapter,
  IBaseDirector,
  LogFields,
  TimestampFields,
  _ID,
} from './common';
import { Order } from './orders';
import { OrderPosition } from './orders.positions';
import { Product, ProductPlan } from './products';
import { WorkerSchedule } from './worker';

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
  configuration: Configuration;
  productId: string;
  quantity: number;
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

// Queries

export interface EnrollmentQueries {
  findEnrollment: (
    params: { enrollmentId?: string; orderId?: string },
    options?: FindOptions
  ) => Promise<Enrollment>;
  findEnrollments: (params: {
    status?: Array<EnrollmentStatus>;
    userId?: string;
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

type EnrollmentContextParams = (
  enrollment: Enrollment,
  params: { enrollmentContext?: any },
  requestContext: Context
) => Promise<Enrollment>;

export interface EnrollmentProcessing {
  terminateEnrollment: EnrollmentContextParams;
  activateEnrollment: EnrollmentContextParams;
}

// Mutations
export interface EnrollmentData {
  billingAddress: Address;
  configuration?: Configuration;
  contact: Contact;
  countryCode?: string;
  currencyCode?: string;
  delivery: Enrollment['delivery'];
  meta?: any;
  orderIdForFirstPeriod?: string;
  payment: Enrollment['payment'];
  productId: string;
  quantity: number;
  userId: string;
}

export interface EnrollmentMutations {
  addEnrollmentPeriod: (
    enrollmentId: string,
    period: EnrollmentPeriod,
    userId?: string
  ) => Promise<Enrollment>;

  create: (doc: EnrollmentData, requestContext: Context) => Promise<Enrollment>;

  createFromCheckout: (
    order: Order,
    params: {
      items: Array<{
        orderPosition: OrderPosition;
        product: Product;
      }>;
      context: {
        paymentContext?: any;
        deliveryContext?: any;
      };
    },
    requestContext: Context
  ) => Promise<Array<Enrollment>>;

  delete: (enrollmentId: string, userId?: string) => Promise<number>;

  removeEnrollmentPeriodByOrderId: (
    enrollmentId: string,
    orderId: string,
    userId?: string
  ) => Promise<Enrollment>;

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

// Director

type EnrollmentContext = {
  enrollment: Enrollment;
};

export interface EnrollmentAdapterActions {
  configurationForOrder: (params: {
    period: EnrollmentPeriod;
    products: Array<Product>;
    orderContext?: any;
  }) => Promise<any>;
  isOverdue: () => Promise<boolean>;
  isValidForActivation: () => Promise<boolean>;
  nextPeriod: () => Promise<EnrollmentPeriod>;
  shouldTriggerAction: (params: {
    period: EnrollmentPeriod;
    action?: any;
  }) => Promise<boolean>;
}

export type IEnrollmentAdapter = IBaseAdapter & {
  isActivatedFor: (productPlan?: ProductPlan) => boolean;

  transformOrderItemToEnrollmentPlan: (
    orderPosition: OrderPosition,
    requestContext: Context
  ) => Promise<EnrollmentPlan>;

  actions: (params: EnrollmentContext & Context) => EnrollmentAdapterActions;
};

export type IEnrollmentDirector = IBaseDirector<IEnrollmentAdapter> & {
  transformOrderItemToEnrollment: (
    item: { orderPosition: OrderPosition; product: Product },
    doc: Omit<EnrollmentData, 'configuration' | 'productId' | 'quantity'>,
    requestContext: Context
  ) => Promise<EnrollmentData>;

  actions: (
    enrollmentContext: EnrollmentContext,
    requestContext: Context
  ) => Promise<EnrollmentAdapterActions>;
};

/*
 * Settings
 */

export interface EnrollmentsSettingsOptions {
  autoSchedulingSchedule: WorkerSchedule;
  autoSchedulingInput: () => any;
  enrollmentNumberHashFn: (enrollment: Enrollment, index: number) => string;
}
