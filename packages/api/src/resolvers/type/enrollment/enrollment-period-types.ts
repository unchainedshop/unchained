import { Context } from '../../../context.js';
import { EnrollmentPeriod as EnrollmentPeriodType } from '@unchainedshop/core-enrollments';

export const EnrollmentPeriod = {
  async order(period: EnrollmentPeriodType, _: never, { modules }: Context) {
    // TODO: use order loader
    return modules.orders.findOrder({ orderId: period.orderId });
  },
};
