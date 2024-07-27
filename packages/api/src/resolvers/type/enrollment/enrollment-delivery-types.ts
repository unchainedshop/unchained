import { Context } from '@unchainedshop/api';
import { DeliveryProvider } from '@unchainedshop/core-delivery';
import { Enrollment } from '@unchainedshop/core-enrollments';

type HelperType<T> = (enrollmentDelivery: Enrollment['delivery'], _: never, context: Context) => T;

type EnrollmentDeliveryHelperTypes = {
  provider: HelperType<Promise<DeliveryProvider>>;
};

export const EnrollmentDelivery: EnrollmentDeliveryHelperTypes = {
  provider: async ({ deliveryProviderId }, _, { modules }) => {
    return modules.delivery.findProvider({ deliveryProviderId });
  },
};
