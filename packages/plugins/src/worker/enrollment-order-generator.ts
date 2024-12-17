import { Enrollment } from '@unchainedshop/core-enrollments';
import { OrderPosition } from '@unchainedshop/core-orders';
import { enrollmentsSettings, EnrollmentStatus } from '@unchainedshop/core-enrollments';
import {
  EnrollmentDirector,
  UnchainedCore,
  WorkerDirector,
  WorkerAdapter,
  IWorkerAdapter,
} from '@unchainedshop/core';

const generateOrder = async (
  enrollment: Enrollment,
  params: {
    orderPositions: Array<OrderPosition>;
  } & { [x: string]: any },
  unchainedAPI: UnchainedCore,
) => {
  if (!enrollment.payment || !enrollment.delivery) return null;

  const { modules, services } = unchainedAPI;
  const { orderPositions, ...configuration } = params;
  let order = await modules.orders.create({
    userId: enrollment.userId,
    currency: enrollment.currencyCode,
    countryCode: enrollment.countryCode,
    contact: enrollment.contact,
    billingAddress: enrollment.billingAddress,
    originEnrollmentId: enrollment._id,
    ...configuration,
  });
  const orderId = order._id;

  if (orderPositions) {
    await Promise.all(
      orderPositions.map((orderPosition) => modules.orders.positions.addProductItem(orderPosition)),
    );
  } else {
    const product = await modules.products.findProduct({
      productId: enrollment.productId,
    });
    await modules.orders.positions.addProductItem({
      quantity: 1,
      productId: product._id,
      originalProductId: product._id,
      orderId: order._id,
    });
  }

  const { paymentProviderId, context: paymentContext } = enrollment.payment;
  if (paymentProviderId) {
    await modules.orders.setPaymentProvider(orderId, paymentProviderId);
  }

  const { deliveryProviderId, context: deliveryContext } = enrollment.delivery;
  if (deliveryProviderId) {
    await modules.orders.setDeliveryProvider(orderId, deliveryProviderId);
  }

  await services.orders.updateCalculation(orderId);

  order = await services.orders.checkoutOrder(order._id, {
    paymentContext,
    deliveryContext,
  });

  return order;
};

const GenerateOrderWorker: IWorkerAdapter<any, any> = {
  ...WorkerAdapter,

  key: 'shop.unchained.worker-plugin.generate-enrollment-orders',
  label: 'Generates new Orders from Enrollments',
  version: '1.0.0',
  type: 'ENROLLMENT_ORDER_GENERATOR',

  doWork: async (input, unchainedAPI) => {
    const { modules } = unchainedAPI;

    const enrollments = await modules.enrollments.findEnrollments({
      status: [EnrollmentStatus.ACTIVE, EnrollmentStatus.PAUSED],
    });

    const errors = (
      await Promise.all(
        enrollments.map(async (enrollment) => {
          try {
            const director = await EnrollmentDirector.actions({ enrollment }, unchainedAPI);
            const period = await director.nextPeriod();
            if (period) {
              if (period.isTrial) {
                await modules.enrollments.addEnrollmentPeriod(enrollment._id, {
                  ...period,
                });
                return null;
              }
              const configuration = await director.configurationForOrder({
                ...input,
                period,
              });
              if (configuration) {
                const order = await generateOrder(enrollment, configuration, unchainedAPI);
                if (order) {
                  await modules.enrollments.addEnrollmentPeriod(enrollment._id, {
                    ...period,
                    orderId: order._id,
                  });
                }
              }
            }
          } catch (e) {
            return {
              name: e.name,
              message: e.message,
              stack: e.stack,
            };
          }
          return null;
        }),
      )
    ).filter(Boolean);

    if (errors.length) {
      return {
        success: false,
        error: {
          name: 'SOME_ENROLLMENTS_COULD_NOT_PROCESS',
          message: 'Some errors have been reported during order generation',
          logs: errors,
        },
        result: {},
      };
    }
    return {
      success: true,
      result: input,
    };
  },
};

WorkerDirector.registerAdapter(GenerateOrderWorker);

export const configureGenerateOrderAutoscheduling = () => {
  if (enrollmentsSettings.autoSchedulingSchedule) {
    WorkerDirector.configureAutoscheduling({
      type: GenerateOrderWorker.type,
      schedule: enrollmentsSettings.autoSchedulingSchedule,
      retries: 5,
    });
  }
};
