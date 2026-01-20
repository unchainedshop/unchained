import { enrollmentsSettings, EnrollmentStatus } from '@unchainedshop/core-enrollments';
import {
  EnrollmentDirector,
  WorkerDirector,
  WorkerAdapter,
  type IWorkerAdapter,
} from '@unchainedshop/core';

export const GenerateOrderWorker: IWorkerAdapter<never, any> = {
  ...WorkerAdapter,

  key: 'shop.unchained.worker-plugin.generate-enrollment-orders',
  label: 'Generates new Orders from Enrollments',
  version: '1.0.0',
  type: 'ENROLLMENT_ORDER_GENERATOR',

  doWork: async (input, unchainedAPI) => {
    const { modules, services } = unchainedAPI;

    const enrollments = await modules.enrollments.findEnrollments({
      status: [EnrollmentStatus.ACTIVE, EnrollmentStatus.PAUSED],
    });

    const errors = (
      await Promise.all(
        enrollments.map(async (enrollment) => {
          try {
            const product = await unchainedAPI.modules.products.findProduct({
              productId: enrollment.productId,
            });
            const director = await EnrollmentDirector.actions(
              { enrollment, product: product! },
              unchainedAPI,
            );
            const period = await director.nextPeriod();
            if (period) {
              if (period.isTrial) {
                await modules.enrollments.addEnrollmentPeriod(enrollment._id, {
                  ...period,
                });
                return null;
              }
              const configuration = await director.configurationForOrder({
                period,
              });
              if (configuration) {
                const order = await services.enrollments.generateOrderFromEnrollment(
                  enrollment,
                  configuration,
                );
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

export const configureGenerateOrderAutoscheduling = () => {
  if (enrollmentsSettings.autoSchedulingSchedule) {
    WorkerDirector.configureAutoscheduling({
      type: GenerateOrderWorker.type,
      schedule: enrollmentsSettings.autoSchedulingSchedule,
      retries: 5,
    });
  }
};

export default GenerateOrderWorker;
