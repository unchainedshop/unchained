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
    const plan = product?.plan;
    const addBillingIntervals = (date: Date, count: number) =>
      addToDate(date, {
        [plan!.billingInterval!.toLowerCase()]: (plan!.billingIntervalCount || 1) * count,
      });

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

      minimumCommitmentEnd: async ({ referenceDate }) => {
        if (!plan?.minimumCommitmentPeriods || !plan?.billingInterval) return null;
        return addBillingIntervals(referenceDate, plan.minimumCommitmentPeriods);
      },

      // Notice period: termination takes effect one billing interval after the current period ends,
      // but never before the minimum commitment ends.
      terminationDate: async ({ referenceDate }) => {
        if (!enrollment?.periods?.length || !plan?.billingInterval) return referenceDate;

        const currentPeriod = enrollment.periods.find(rangeMatcher(referenceDate));
        const terminateAt = addBillingIntervals(
          currentPeriod ? new Date(currentPeriod.end) : referenceDate,
          1,
        );
        const commitmentEnd =
          enrollment.minimumCommitmentEnd && new Date(enrollment.minimumCommitmentEnd);
        return commitmentEnd && commitmentEnd.getTime() > terminateAt.getTime()
          ? commitmentEnd
          : terminateAt;
      },

      transformPlanToNewPlan: async ({ plan: newPlan, referenceDate }) => {
        const latestEnd = enrollment?.periods?.reduce<Date | null>((acc, p) => {
          const end = new Date(p.end);
          return !acc || end.getTime() > acc.getTime() ? end : acc;
        }, null);

        return {
          plan: newPlan,
          effectiveDate: latestEnd || referenceDate,
        };
      },
    };
  },
};
