import { Enrollment } from '@unchainedshop/core-enrollments';
import { OrderPosition } from '@unchainedshop/core-orders';
import { Product } from '@unchainedshop/core-products';
import { IWorkerAdapter } from '@unchainedshop/core-worker';
import {
  EnrollmentDirector,
  enrollmentsSettings,
  EnrollmentStatus,
} from '@unchainedshop/core-enrollments';
import { WorkerAdapter, WorkerDirector } from '@unchainedshop/core-worker';
import { UnchainedCore } from '@unchainedshop/core';

const generateOrder = async (
  enrollment: Enrollment,
  params: {
    orderProducts: Array<{ orderPosition: OrderPosition; product: Product }>;
  } & { [x: string]: any },
  unchainedAPI: UnchainedCore,
) => {
  if (!enrollment.payment || !enrollment.delivery) return null;

  const { modules } = unchainedAPI;
  const { orderProducts, ...configuration } = params;
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

  if (orderProducts) {
    await Promise.all(
      orderProducts.map(({ orderPosition, product }) =>
        modules.orders.positions.addProductItem(orderPosition, { order, product }, unchainedAPI),
      ),
    );
  } else {
    const product = await modules.products.findProduct({
      productId: enrollment.productId,
    });
    await modules.orders.positions.addProductItem(
      { quantity: 1 },
      {
        order,
        product,
      },
      unchainedAPI,
    );
  }

  const { paymentProviderId, context: paymentContext } = enrollment.payment;
  if (paymentProviderId) {
    await modules.orders.setPaymentProvider(orderId, paymentProviderId, unchainedAPI);
  }

  const { deliveryProviderId, context: deliveryContext } = enrollment.delivery;
  if (deliveryProviderId) {
    await modules.orders.setDeliveryProvider(orderId, deliveryProviderId, unchainedAPI);
  }

  await modules.orders.updateCalculation(orderId, unchainedAPI);

  order = await modules.orders.checkout(
    order._id,
    {
      paymentContext,
      deliveryContext,
    },
    unchainedAPI,
  );

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
