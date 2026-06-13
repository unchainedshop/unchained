import { BaseAdapter, type IBaseAdapter } from '@unchainedshop/utils';
import {
  type Enrollment,
  type EnrollmentOrderPositionTemplate,
  type EnrollmentPeriod,
  type EnrollmentPlan,
  addToDate,
} from '@unchainedshop/core-enrollments';
import type { Product, ProductPlan } from '@unchainedshop/core-products';
import type { OrderPosition } from '@unchainedshop/core-orders';
import type { Modules } from '../modules.ts';

export interface EnrollmentContext {
  enrollment: Enrollment;
  product: Product;
}

export interface EnrollmentAdapterActions {
  configurationForOrder: (params: { period: EnrollmentPeriod }) => Promise<{
    orderContext?: Record<string, any>;
    orderPositionTemplates: EnrollmentOrderPositionTemplate[];
  } | null>;
  isOverdue: () => Promise<boolean>;
  isValidForActivation: () => Promise<boolean>;
  nextPeriod: (params?: { referenceDate?: Date }) => Promise<EnrollmentPeriod | null>;
  terminationDate: (params: { referenceDate: Date }) => Promise<Date | null>;
  expiryDate: () => Promise<Date | null>;
  initialPeriods: (params: { referenceDate: Date }) => Promise<EnrollmentPeriod[]>;
  transformPlanToNewPlan: (params: {
    plan: EnrollmentPlan;
    referenceDate: Date;
  }) => Promise<{ plan: EnrollmentPlan; effectiveDate: Date } | null>;
}

export type IEnrollmentAdapter = IBaseAdapter & {
  isActivatedFor: (productPlan?: ProductPlan) => boolean;

  transformOrderItemToEnrollmentPlan: (
    orderPosition: OrderPosition,
    unchainedAPI,
  ) => Promise<EnrollmentPlan>;

  actions: (params: EnrollmentContext & { modules: Modules }) => EnrollmentAdapterActions;
};
export const periodForReferenceDate = (referenceDate: Date, intervalCount = 1, interval = 'WEEKS') => {
  const lowerCaseInterval = interval.toLowerCase();

  const start = new Date(referenceDate);
  if (lowerCaseInterval === 'hours') {
    start.setMinutes(0, 0, 0);
  } else {
    start.setSeconds(0, 0);
  }

  return {
    start,
    end: addToDate(start, {
      [lowerCaseInterval]: intervalCount,
    }),
  };
};

export const EnrollmentAdapter: Omit<IEnrollmentAdapter, 'key' | 'label' | 'version'> = {
  ...BaseAdapter,
  adapterType: Symbol.for('unchained:adapter:enrollment'),
  isActivatedFor: () => {
    return false;
  },

  transformOrderItemToEnrollmentPlan: async (item) => {
    return {
      configuration: item.configuration,
      productId: item.productId,
      quantity: item.quantity,
    };
  },

  actions: (context) => {
    const baseActions: EnrollmentAdapterActions = {
      configurationForOrder: async () => {
        throw new Error(`Not implemented on EnrollmentAdapter`);
      },

      isOverdue: async () => false,
      isValidForActivation: async () => false,

      nextPeriod: async (params?: { referenceDate?: Date }) => {
        const { enrollment, product } = context;

        const plan = product?.plan;
        const referenceDate = params?.referenceDate || new Date();
        if (!plan) return null;

        if (plan.trialIntervalCount && !enrollment?.periods?.length) {
          return {
            ...periodForReferenceDate(referenceDate, plan.trialIntervalCount, plan.trialInterval),
            isTrial: true,
          };
        }

        const lastEnd = enrollment?.periods?.reduce((acc, item) => {
          if (!acc) return item.end;
          const endDate = new Date(item.end);
          if (acc.getTime() < endDate.getTime()) {
            return endDate;
          }
          return acc;
        }, referenceDate);

        const period = {
          ...periodForReferenceDate(lastEnd, plan.billingIntervalCount, plan.billingInterval),
          isTrial: false,
        };

        if (enrollment?.expires) {
          if (period.start.getTime() >= new Date(enrollment.expires).getTime()) {
            return null;
          }
        }

        return period;
      },

      terminationDate: async ({ referenceDate }: { referenceDate: Date }) => referenceDate,

      expiryDate: async () => null,

      initialPeriods: async ({ referenceDate }: { referenceDate: Date }) => {
        const period = await baseActions.nextPeriod({ referenceDate });
        return period ? [period] : [];
      },

      transformPlanToNewPlan: async () => null,
    };
    return baseActions;
  },
};
