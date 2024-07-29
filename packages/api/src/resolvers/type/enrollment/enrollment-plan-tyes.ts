import { Context } from '@unchainedshop/api';
import { EnrollmentPlan as EnrollmentPlanType } from '@unchainedshop/core-enrollments';
import { Product } from '@unchainedshop/core-products';

type HelperType<T> = (enrollmentPlan: EnrollmentPlanType, _: never, context: Context) => T;

type EnrollmentPlanHelperTypes = {
  product: HelperType<Promise<Product>>;
};

export const EnrollmentPlan: EnrollmentPlanHelperTypes = {
  product: async (plan, _, { loaders }) => {
    const product = await loaders.productLoader.load({
      productId: plan.productId,
    });
    return product;
  },
};
