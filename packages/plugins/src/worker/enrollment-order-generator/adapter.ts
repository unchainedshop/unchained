import {
  enrollmentsSettings,
  EnrollmentStatus,
  type Enrollment,
  type EnrollmentsModule,
} from '@unchainedshop/core-enrollments';
import {
  EnrollmentDirector,
  WorkerDirector,
  WorkerAdapter,
  type IWorkerAdapter,
} from '@unchainedshop/core';
import { emit } from '@unchainedshop/events';

const emitTrialEndingOnce = async (enrollment: Enrollment, enrollments: EnrollmentsModule) => {
  const noticeMs = enrollmentsSettings.trialEndingNoticeDays * 24 * 60 * 60 * 1000;
  const trialPeriod = enrollment.periods.find(({ isTrial, trialEndingNotifiedAt, end }) => {
    const remainingMs = new Date(end).getTime() - Date.now();
    return isTrial && !trialEndingNotifiedAt && remainingMs > 0 && remainingMs <= noticeMs;
  });
  if (!trialPeriod) return;

  const notifiedEnrollment = await enrollments.markEnrollmentTrialEndingNotified(
    enrollment._id,
    trialPeriod,
  );
  if (notifiedEnrollment) {
    await emit('ENROLLMENT_TRIAL_ENDING', { enrollment: notifiedEnrollment, trialEnd: trialPeriod.end });
  }
};

export const GenerateOrderWorker: IWorkerAdapter<never, any> = {
  ...WorkerAdapter,

  key: 'shop.unchained.worker-plugin.generate-enrollment-orders',
  label: 'Generates new Orders from Enrollments',
  version: '1.0.0',
  type: 'ENROLLMENT_ORDER_GENERATOR',

  doWork: async (input, unchainedAPI) => {
    const { modules, services } = unchainedAPI;

    const enrollments = await modules.enrollments.findEnrollments({
      status: [EnrollmentStatus.ACTIVE, EnrollmentStatus.PAUSED, EnrollmentStatus.SUSPENDED],
    });

    const errors = (
      await Promise.all(
        enrollments.map(async (unprocessedEnrollment) => {
          try {
            // Applies scheduled terminations, resumes and expiries first
            const enrollment = await services.enrollments.processEnrollment(unprocessedEnrollment);
            if (
              enrollment.status === EnrollmentStatus.TERMINATED ||
              enrollment.status === EnrollmentStatus.SUSPENDED
            ) {
              return null;
            }

            await emitTrialEndingOnce(enrollment, modules.enrollments);

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
