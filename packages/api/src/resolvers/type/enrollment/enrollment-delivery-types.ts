import { Context } from '../../../context.js';
import { Enrollment } from '@unchainedshop/core-enrollments';

export const EnrollmentDelivery = {
  provider: async ({ deliveryProviderId }: Enrollment['delivery'], _: never, { loaders }: Context) => {
    if (!deliveryProviderId) return null;
    return loaders.deliveryProviderLoader.load({
      deliveryProviderId,
    });
  },
};
