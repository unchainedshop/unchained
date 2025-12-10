import type { Context } from '../../../context.ts';
import type { EnrollmentPlan as EnrollmentPlanType } from '@unchainedshop/core-enrollments';

export const EnrollmentPlan = {
  async product(plan: EnrollmentPlanType, _: never, { loaders }: Context) {
    return loaders.productLoader.load({
      productId: plan.productId,
    });
  },
};
