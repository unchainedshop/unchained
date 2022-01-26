import { log, LogLevel } from 'meteor/unchained:logger';
import moment from 'moment';

import { IEnrollmentAdapter } from '@unchainedshop/types/enrollments';

const periodForReferenceDate = (referenceDate: Date, intervalCount = 1, interval = 'WEEK') => {
  const start = moment(referenceDate).startOf(interval === 'HOUR' ? 'minute' : 'hour');
  return {
    start: start.toDate(),
    /* @ts-ignore */
    end: start.add(intervalCount, interval).toDate(),
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
        const product = await context.modules.products.findProduct({
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

      shouldTriggerAction: async () => {
        throw new Error(`Not implemented on EnrollmentAdapter`);
      },
    };
  },

  // eslint-disable-next-line
  log(message: string, { level = LogLevel.Debug, ...options } = {}) {
    return log(message, { level, ...options });
  },
};
