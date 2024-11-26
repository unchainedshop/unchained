import { IBaseAdapter, IBaseDirector } from '@unchainedshop/utils';
import { TimestampFields, LogFields, Address, Contact } from '@unchainedshop/mongodb';
import type { Product, ProductPlan } from '@unchainedshop/core-products';
import type { OrderPosition } from '@unchainedshop/core-orders';

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
  configuration: Array<{ key: string; value: string }>;
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
  configuration: Array<{ key: string; value: string }>;
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
    unchainedAPI,
  ) => Promise<EnrollmentPlan>;

  actions: (params: EnrollmentContext) => EnrollmentAdapterActions;
};

export interface EnrollmentData {
  billingAddress: Address;
  configuration?: Array<{ key: string; value: string }>;
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

export type IEnrollmentDirector = IBaseDirector<IEnrollmentAdapter> & {
  transformOrderItemToEnrollment: (
    item: { orderPosition: OrderPosition; product: Product },
    doc: Omit<EnrollmentData, 'configuration' | 'productId' | 'quantity'>,
    unchainedAPI,
  ) => Promise<EnrollmentData>;

  actions: (enrollmentContext: EnrollmentContext, unchainedAPI) => Promise<EnrollmentAdapterActions>;
};
