import { type IEnrollmentAdapter, EnrollmentAdapter } from '@unchainedshop/core';
import { addToDate } from '@unchainedshop/core-enrollments';

export const rangeMatcher = (date = new Date()) => {
  const timestamp = date.getTime();
  return ({ start, end }) => {
    const startTimestamp = new Date(start).getTime();
    const endTimestamp = new Date(end).getTime();
    return startTimestamp <= timestamp && endTimestamp >= timestamp;
  };
};

export const LicensedEnrollments: IEnrollmentAdapter = {
  ...EnrollmentAdapter,

  key: 'shop.unchained.enrollments.licensed',
  version: '1.0.0',
  label: 'Simple Licensed Enrollments',

  isActivatedFor: (productPlan) => {
    return productPlan?.usageCalculationType === 'LICENSED';
  },

  actions: (params) => {
    const { enrollment, product } = params;
    return {
      ...EnrollmentAdapter.actions(params),

      isValidForActivation: async () => {
        const periods = enrollment?.periods || [];
        return periods.findIndex(rangeMatcher()) !== -1;
      },

      isOverdue: async () => {
        return false;
      },

      configurationForOrder: async (context) => {
        const { period } = context;
        const beginningOfPeriod = period.start.getTime() <= new Date().getTime();

        if (!enrollment) throw new Error('Enrollment missing in context');
        if (beginningOfPeriod) {
          return {
            period,
            orderContext: {},
            orderPositionTemplates: [
              {
                quantity: 1,
                productId: enrollment.productId,
                originalProductId: enrollment.productId,
              },
            ],
          };
        }
        return null;
      },

      // Notice period: a termination takes effect one billing interval after the current period ends
      terminationDate: async ({ referenceDate }) => {
        const { billingInterval, billingIntervalCount } = product?.plan || {};
        if (!enrollment?.periods?.length || !billingInterval) return referenceDate;

        const currentPeriod = enrollment.periods.find(rangeMatcher(referenceDate));
        return addToDate(currentPeriod ? new Date(currentPeriod.end) : referenceDate, {
          [billingInterval.toLowerCase()]: billingIntervalCount || 1,
        });
      },

      // Plan changes apply from the next period on
      transformPlanToNewPlan: async ({ plan }) => plan,
    };
  },
};
