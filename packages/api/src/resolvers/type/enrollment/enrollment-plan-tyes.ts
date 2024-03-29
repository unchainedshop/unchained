import { Context } from '@unchainedshop/types/api.js';
import { EnrollmentPlan as EnrollmentPlanType } from '@unchainedshop/types/enrollments.js';
import { Product } from '@unchainedshop/types/products.js';

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
