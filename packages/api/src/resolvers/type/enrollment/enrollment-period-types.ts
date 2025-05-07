import { Context } from '../../../context.js';
import { EnrollmentPeriod as EnrollmentPeriodType } from '@unchainedshop/core-enrollments';

export const EnrollmentPeriod = {
  async order(period: EnrollmentPeriodType, _: never, { loaders }: Context) {
    return loaders.orderLoader.load({ orderId: period.orderId });
  },
};
