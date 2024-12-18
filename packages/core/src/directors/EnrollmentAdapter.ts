import { IBaseAdapter } from '@unchainedshop/utils';
import { log, LogLevel } from '@unchainedshop/logger';
import {
  Enrollment,
  EnrollmentPeriod,
  EnrollmentPlan,
  addToDate,
} from '@unchainedshop/core-enrollments';
import type { Product, ProductPlan } from '@unchainedshop/core-products';
import type { OrderPosition } from '@unchainedshop/core-orders';

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
    return {
      configurationForOrder: async () => {
        throw new Error(`Not implemented on EnrollmentAdapter`);
      },

      isOverdue: async () => false,
      isValidForActivation: async () => false,

      nextPeriod: async () => {
        const { enrollment } = context;
        const product = await (context as any).modules.products.findProduct({
          productId: enrollment.productId,
        });
        const plan = product?.plan;
        const referenceDate = new Date();
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

        return {
          ...periodForReferenceDate(lastEnd, plan.billingIntervalCount, plan.billingInterval),
          isTrial: false,
        };
      },
    };
  },

  // eslint-disable-next-line
  log(message: string, { level = LogLevel.Debug, ...options } = {}) {
    return log(message, { level, ...options });
  },
};
