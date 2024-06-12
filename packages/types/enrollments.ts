import type { FindOptions } from 'mongodb';
import { SortOption } from './api.js';
import {
  Address,
  Configuration,
  Contact,
  IBaseAdapter,
  IBaseDirector,
  LogFields,
  TimestampFields,
} from './common.js';
import { UnchainedCore } from './core.js';
import { Order } from './orders.js';
import { OrderPosition } from './orders.positions.js';
import { Product, ProductPlan } from './products.js';
import { WorkerSchedule } from './worker.js';

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

export type EnrollmentQuery = {
  status?: Array<EnrollmentStatus>;
  userId?: string;
  queryString?: string;
};

export type Enrollment = {
  _id?: string;
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
    options?: FindOptions,
  ) => Promise<Enrollment>;
  findEnrollments: (
    params: EnrollmentQuery & {
      limit?: number;
      offset?: number;
      sort?: Array<SortOption>;
    },
  ) => Promise<Array<Enrollment>>;
  openEnrollmentWithProduct(params: { productId: string }): Promise<Enrollment | null>;
  count: (params: EnrollmentQuery) => Promise<number>;
}

// Transformations

export interface EnrollmentTransformations {
  normalizedStatus: (enrollment: Enrollment) => string;
  isExpired: (enrollment: Enrollment, params: { referenceDate?: Date }) => boolean;
}

// Processing

export type EnrollmentContextParams = (
  enrollment: Enrollment,
  unchainedAPI: UnchainedCore,
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
  addEnrollmentPeriod: (enrollmentId: string, period: EnrollmentPeriod) => Promise<Enrollment>;

  create: (doc: EnrollmentData, unchainedAPI: UnchainedCore) => Promise<Enrollment>;

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
    unchainedAPI: UnchainedCore,
  ) => Promise<void>;

  delete: (enrollmentId: string) => Promise<number>;

  removeEnrollmentPeriodByOrderId: (enrollmentId: string, orderId: string) => Promise<Enrollment>;

  updateBillingAddress: (enrollmentId: string, billingAddress: Address) => Promise<Enrollment>;

  updateContact: (enrollmentId: string, contact: Contact) => Promise<Enrollment>;

  updateContext: (enrollmentId: string, context: any) => Promise<Enrollment | null>;

  updateDelivery: (enrollmentId: string, delivery: Enrollment['delivery']) => Promise<Enrollment>;

  updatePayment: (enrollmentId: string, payment: Enrollment['payment']) => Promise<Enrollment>;

  updatePlan: (
    enrollmentId: string,
    plan: EnrollmentPlan,
    unchainedAPI: UnchainedCore,
  ) => Promise<Enrollment>;

  updateStatus: (
    enrollmentId: string,
    params: { status: EnrollmentStatus; info?: string },
    unchainedAPI: UnchainedCore,
  ) => Promise<Enrollment>;
}

export type EnrollmentsModule = EnrollmentQueries &
  EnrollmentTransformations &
  EnrollmentProcessing &
  EnrollmentMutations;

// Director

export type EnrollmentContext = {
  enrollment: Enrollment;
};

export interface EnrollmentAdapterActions {
  configurationForOrder: (params: {
    period: EnrollmentPeriod;
    products: Array<Product>;
  }) => Promise<any>;
  isOverdue: () => Promise<boolean>;
  isValidForActivation: () => Promise<boolean>;
  nextPeriod: () => Promise<EnrollmentPeriod>;
}

export type IEnrollmentAdapter = IBaseAdapter & {
  isActivatedFor: (productPlan?: ProductPlan) => boolean;

  transformOrderItemToEnrollmentPlan: (
    orderPosition: OrderPosition,
    unchainedAPI: UnchainedCore,
  ) => Promise<EnrollmentPlan>;

  actions: (params: EnrollmentContext & UnchainedCore) => EnrollmentAdapterActions;
};

export type IEnrollmentDirector = IBaseDirector<IEnrollmentAdapter> & {
  transformOrderItemToEnrollment: (
    item: { orderPosition: OrderPosition; product: Product },
    doc: Omit<EnrollmentData, 'configuration' | 'productId' | 'quantity'>,
    unchainedAPI: UnchainedCore,
  ) => Promise<EnrollmentData>;

  actions: (
    enrollmentContext: EnrollmentContext,
    unchainedAPI: UnchainedCore,
  ) => Promise<EnrollmentAdapterActions>;
};

/*
 * Settings
 */
export interface EnrollmentsSettingsOptions {
  autoSchedulingSchedule?: WorkerSchedule;
  enrollmentNumberHashFn?: (enrollment: Enrollment, index: number) => string;
}
