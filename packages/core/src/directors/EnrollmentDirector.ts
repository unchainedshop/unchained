import { BaseDirector, IBaseDirector } from '@unchainedshop/utils';
import { EnrollmentAdapterActions, EnrollmentContext, IEnrollmentAdapter } from './EnrollmentAdapter.js';
import type { OrderPosition } from '@unchainedshop/core-orders';
import type { Product, ProductPlan } from '@unchainedshop/core-products';
import { Enrollment } from '@unchainedshop/core-enrollments';
import { createLogger } from '@unchainedshop/logger';

const logger = createLogger('unchained:core');

export type IEnrollmentDirector = IBaseDirector<IEnrollmentAdapter> & {
  transformOrderItemToEnrollment: (
    item: { orderPosition: OrderPosition; product: Product },
    doc: Omit<Enrollment, 'configuration' | 'productId' | 'quantity' | 'status' | 'periods' | 'log'>,
    unchainedAPI,
  ) => Promise<Omit<Enrollment, 'status' | 'periods' | 'log'>>;

  actions: (enrollmentContext: EnrollmentContext, unchainedAPI) => Promise<EnrollmentAdapterActions>;
};

const baseDirector = BaseDirector<IEnrollmentAdapter>('EnrollmentDirector', {
  adapterSortKey: 'orderIndex',
});

const findAppropriateAdapters = (productPlan?: ProductPlan) =>
  baseDirector.getAdapters({
    adapterFilter: (Adapter: IEnrollmentAdapter) => {
      const activated = Adapter.isActivatedFor(productPlan);
      if (!activated) {
        logger.warn(`Enrollment Director -> ${Adapter.key} (${Adapter.version}) skipped`);
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

    return {
      ...doc,
      ...enrollmentPlan,
      configuration: [],
    };
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
