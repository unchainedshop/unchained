import {
  IEnrollmentAdapter,
  IEnrollmentDirector,
} from '@unchainedshop/types/enrollments';
import { log } from 'meteor/unchained:logger';
import { BaseDirector } from 'meteor/unchained:utils';

const baseDirector = BaseDirector<IEnrollmentAdapter>('EnrollmentDirector', {
  adapterSortKey: 'orderIndex',
});

export const EnrollmentDirector: IEnrollmentDirector = {
  ...baseDirector,

  actions: (enrollmentContext, requestContext) => {
    const context = { ...enrollmentContext, ...requestContext };

    return {
      interface(discountKey: string) {
        const Adapter = baseDirector.getAdapter(discountKey);
        if (!Adapter) return null;
        const adapter = Adapter.actions({ context });
        return adapter;
      },
    };
  },
};
