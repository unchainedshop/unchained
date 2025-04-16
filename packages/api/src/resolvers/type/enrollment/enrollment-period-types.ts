import { Context } from '../../../context.js';
import { EnrollmentPeriod as EnrollmentPeriodType } from '@unchainedshop/core-enrollments';
import { Order } from '@unchainedshop/core-orders';

type HelperType<T> = (enrollmentPeriod: EnrollmentPeriodType, _: never, context: Context) => T;

type EnrollmentPeriodHelperTypes = {
  order: HelperType<Promise<Order>>;
};

export const EnrollmentPeriod: EnrollmentPeriodHelperTypes = {
  order: async (period, _, { modules }) => {
    // TODO: use loader
    return modules.orders.findOrder({ orderId: period.orderId });
  },
};
