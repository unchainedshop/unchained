import { EnrollmentData, IEnrollmentAdapter, IEnrollmentDirector } from '../types.js';
import type { ProductPlan } from '@unchainedshop/core-products';
import { log, LogLevel } from '@unchainedshop/logger';
import { BaseDirector } from '@unchainedshop/utils';

const baseDirector = BaseDirector<IEnrollmentAdapter>('EnrollmentDirector', {
  adapterSortKey: 'orderIndex',
});

const findAppropriateAdapters = (productPlan?: ProductPlan) =>
  baseDirector.getAdapters({
    adapterFilter: (Adapter: IEnrollmentAdapter) => {
      const activated = Adapter.isActivatedFor(productPlan);
      if (!activated) {
        log(`Enrollment Director -> ${Adapter.key} (${Adapter.version}) skipped`, {
          level: LogLevel.Warning,
        });
      }
      return activated;
    },
  });

export const EnrollmentDirector: IEnrollmentDirector = {
  ...baseDirector,

  transformOrderItemToEnrollment: async ({ orderPosition, product }, doc, unchainedAPI) => {
    const Adapter = findAppropriateAdapters(product.plan)?.[0];
    if (!Adapter) {
      throw new Error('No suitable enrollment plugin available for this item');
    }

    const enrollmentPlan = await Adapter.transformOrderItemToEnrollmentPlan(orderPosition, unchainedAPI);

    const enrollmentData: EnrollmentData = {
      ...doc,
      ...enrollmentPlan,
      configuration: [],
    };

    return enrollmentData;
  },

  actions: async (enrollmentContext, unchainedAPI) => {
    const context = { ...enrollmentContext, ...unchainedAPI };

    // Resolve adapter
    const product = await context.modules.products.findProduct({
      productId: context.enrollment.productId,
    });

    const Adapter = findAppropriateAdapters(product?.plan)?.[0];

    if (!Adapter) {
      throw new Error('No suitable enrollment plugin available for this plan configuration');
    }
    const adapter = Adapter.actions(context);

    return adapter;
  },
};
