import { Context } from '@unchainedshop/types/api';
import { DeliveryProvider } from '@unchainedshop/types/delivery';
import { Enrollment } from '@unchainedshop/types/enrollments';

type HelperType<T> = (
  enrollmentDelivery: Enrollment['delivery'],
  _: never,
  context: Context
) => T;

type EnrollmentDeliveryHelperTypes = {
  provider: HelperType<Promise<DeliveryProvider>>;
};

export const EnrollmentDelivery: EnrollmentDeliveryHelperTypes = {
  provider: async ({ deliveryProviderId }, _, { modules }) => {
    return await modules.delivery.findProvider({ deliveryProviderId });
  },
};
