import { BaseDirector, type IBaseDirector } from '@unchainedshop/utils';
import type {
  EnrollmentAdapterActions,
  EnrollmentContext,
  IEnrollmentAdapter,
} from './EnrollmentAdapter.ts';
import type { OrderPosition } from '@unchainedshop/core-orders';
import type { Product, ProductPlan } from '@unchainedshop/core-products';
import type { Enrollment } from '@unchainedshop/core-enrollments';
import { createLogger } from '@unchainedshop/logger';
import type { Modules } from '../modules.ts';

const logger = createLogger('unchained:core');

export type IEnrollmentDirector = IBaseDirector<IEnrollmentAdapter> & {
  transformOrderItemToEnrollment: (
    item: { orderPosition: OrderPosition; product: Product },
    doc: Omit<
      Enrollment,
      'configuration' | 'productId' | 'quantity' | 'status' | 'periods' | 'log' | '_id' | 'created'
    >,
    unchainedAPI,
  ) => Promise<
    Omit<Enrollment, 'status' | 'periods' | 'log' | '_id' | 'created'> &
      Pick<Partial<Enrollment>, '_id' | 'created'>
  >;

  actions: (
    enrollmentContext: EnrollmentContext,
    unchainedAPI: { modules: Modules },
  ) => Promise<EnrollmentAdapterActions>;
};

const baseDirector = BaseDirector<IEnrollmentAdapter>('EnrollmentDirector', {
  adapterSortKey: 'orderIndex',
});

const findAppropriateAdapters = (productPlan?: ProductPlan | null) =>
  baseDirector.getAdapters({
    adapterFilter: (Adapter: IEnrollmentAdapter) => {
      const activated = Adapter.isActivatedFor(productPlan ?? undefined);
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

    const Adapter = findAppropriateAdapters(enrollmentContext.product.plan)?.[0];

    if (!Adapter) {
      throw new Error('No suitable enrollment plugin available for this plan configuration');
    }
    const adapter = Adapter.actions(context);

    return adapter;
  },
};
