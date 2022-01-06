import {
  EnrollmentData,
  IEnrollmentAdapter,
  IEnrollmentDirector,
} from '@unchainedshop/types/enrollments';
import { LogLevel } from '@unchainedshop/types/logs';
import { ProductPlan } from '@unchainedshop/types/products';
import { log } from 'meteor/unchained:logger';
import { BaseDirector } from 'meteor/unchained:utils';

const baseDirector = BaseDirector<IEnrollmentAdapter>('EnrollmentDirector', {
  adapterSortKey: 'orderIndex',
});

const findAppropriateAdapters = (productPlan?: ProductPlan) =>
  baseDirector.getAdapters({
    adapterFilter: (Adapter) => {
      const activated = Adapter.isActivatedFor(productPlan);
      if (!activated) {
        log(
          `Enrollment Director -> ${Adapter.key} (${Adapter.version}) skipped`,
          {
            level: LogLevel.Warning,
          }
        );
      }
      return activated;
    },
  });

export const EnrollmentDirector: IEnrollmentDirector = {
  ...baseDirector,

  transformOrderItemToEnrollment: async (item, doc, requestContext) => {
    const product = await requestContext.modules.products.findProduct({
      productId: item.productId,
    });

    const Adapter = findAppropriateAdapters(product.plan)?.[0];
    if (!Adapter) {
      throw new Error('No suitable enrollment plugin available for this item');
    }

    const enrollmentPlan = await Adapter.transformOrderItemToEnrollmentPlan(
      item,
      requestContext
    );

    const enrollmentData: EnrollmentData= {
      ...doc,
      ...enrollmentPlan,
      configuration: [],
    };

    return enrollmentData
  },

  actions: async (enrollmentContext, requestContext) => {
    const context = { ...enrollmentContext, ...requestContext };

    // Resolve adapter
    const product = await context.modules.products.findProduct({
      productId: context.enrollment.productId,
    });

    const Adapter = findAppropriateAdapters(product?.plan)?.[0];

    if (!Adapter) {
      throw new Error(
        'No suitable enrollment plugin available for this plan configuration'
      );
    }
    const adapter = Adapter.actions(context);

    return adapter;
  },
};
