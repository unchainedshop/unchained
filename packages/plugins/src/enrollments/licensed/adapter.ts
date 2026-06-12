import { type IEnrollmentAdapter, EnrollmentAdapter } from '@unchainedshop/core';

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
    const { enrollment } = params;
    const baseActions = EnrollmentAdapter.actions(params);
    return {
      ...baseActions,

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

      terminationDate: async ({ referenceDate }: { referenceDate: Date }) => {
        if (!enrollment?.periods?.length) return referenceDate;
        const earliest = new Date(referenceDate);
        earliest.setDate(earliest.getDate() + 30);
        return earliest;
      },

      transformPlanToNewPlan: async ({ plan, referenceDate }) => {
        const latestEnd = enrollment?.periods?.reduce<Date | null>((acc, p) => {
          const end = new Date(p.end);
          return !acc || end.getTime() > acc.getTime() ? end : acc;
        }, null);

        return {
          plan,
          effectiveDate: latestEnd || referenceDate,
        };
      },
    };
  },
};
