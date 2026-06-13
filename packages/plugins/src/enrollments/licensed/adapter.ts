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

      minimumCommitmentEnd: async ({ referenceDate }: { referenceDate: Date }) => {
        const { product } = params;
        const plan = product?.plan;
        if (!plan?.minimumCommitmentPeriods || !plan?.billingInterval) return null;

        const firstPeriodStart = enrollment?.periods?.reduce<Date | null>((acc, p) => {
          if (p.isTrial) return acc;
          const start = new Date(p.start);
          return !acc || start.getTime() < acc.getTime() ? start : acc;
        }, null);

        const startDate = firstPeriodStart || referenceDate;
        const interval = plan.billingInterval.toLowerCase();
        const totalIntervals = (plan.billingIntervalCount || 1) * plan.minimumCommitmentPeriods;
        return addToDate(startDate, { [interval]: totalIntervals });
      },

      terminationDate: async ({ referenceDate }: { referenceDate: Date }) => {
        if (!enrollment?.periods?.length) return referenceDate;
        const { product } = params;
        const plan = product?.plan;
        if (!plan?.billingInterval) return referenceDate;

        const refTime = referenceDate.getTime();
        const currentPeriod = enrollment.periods.find((p) => {
          return new Date(p.start).getTime() <= refTime && new Date(p.end).getTime() >= refTime;
        });

        let terminateAt: Date;
        if (currentPeriod) {
          const interval = plan.billingInterval.toLowerCase();
          terminateAt = addToDate(new Date(currentPeriod.end), {
            [interval]: plan.billingIntervalCount || 1,
          });
        } else {
          const interval = plan.billingInterval.toLowerCase();
          terminateAt = addToDate(referenceDate, { [interval]: plan.billingIntervalCount || 1 });
        }

        if (enrollment.minimumCommitmentEnd) {
          const commitmentEnd = new Date(enrollment.minimumCommitmentEnd);
          if (commitmentEnd.getTime() > terminateAt.getTime()) {
            return commitmentEnd;
          }
        }

        return terminateAt;
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
