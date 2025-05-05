import { Context } from '../../../context.js';
import { EnrollmentPlan as EnrollmentPlanType } from '@unchainedshop/core-enrollments';

export const EnrollmentPlan = {
  async product(plan: EnrollmentPlanType, _: never, { loaders }: Context) {
    return loaders.productLoader.load({
      productId: plan.productId,
    });
  },
};
