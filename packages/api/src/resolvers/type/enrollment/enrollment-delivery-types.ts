import { Context } from '../../../context.js';
import { DeliveryProvider } from '@unchainedshop/core-delivery';
import { Enrollment } from '@unchainedshop/core-enrollments';

type HelperType<T> = (enrollmentDelivery: Enrollment['delivery'], _: never, context: Context) => T;

type EnrollmentDeliveryHelperTypes = {
  provider: HelperType<Promise<DeliveryProvider>>;
};

export const EnrollmentDelivery: EnrollmentDeliveryHelperTypes = {
  provider: async ({ deliveryProviderId }, _, { modules }) => {
    // TODO: use loader
    return modules.delivery.findProvider({ deliveryProviderId });
  },
};
