import { IEnrollmentAdapter } from '@unchainedshop/types/enrollments.js';
import { EnrollmentDirector, EnrollmentAdapter } from '@unchainedshop/core-enrollments';

export const rangeMatcher = (date = new Date()) => {
  const timestamp = date.getTime();
  return ({ start, end }) => {
    const startTimestamp = new Date(start).getTime();
    const endTimestamp = new Date(end).getTime();
    return startTimestamp <= timestamp && endTimestamp >= timestamp;
  };
};

const LicensedEnrollments: IEnrollmentAdapter = {
  ...EnrollmentAdapter,

  key: 'shop.unchained.enrollments.licensed',
  version: '1.0.0',
  label: 'Simple Licensed Enrollments',

  isActivatedFor: (productPlan) => {
    console.log({ productPlan });
    return productPlan?.usageCalculationType === 'LICENSED';
  },

  actions: (params) => {
    return {
      ...EnrollmentAdapter.actions(params),

      isValidForActivation: async () => {
        const periods = params.enrollment?.periods || [];
        return periods.findIndex(rangeMatcher()) !== -1;
      },

      isOverdue: async () => {
        return false;
      },

      configurationForOrder: async (context) => {
        const { period } = context;
        const beginningOfPeriod = period.start.getTime() <= new Date().getTime();
        if (beginningOfPeriod) {
          return context;
        }
        return null;
      },
    };
  },
};

EnrollmentDirector.registerAdapter(LicensedEnrollments);
