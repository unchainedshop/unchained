import {
  enrollmentsSettings,
  EnrollmentStatus,
  type Enrollment,
  type EnrollmentPeriod,
  type EnrollmentsModule,
} from '@unchainedshop/core-enrollments';
import {
  EnrollmentDirector,
  WorkerDirector,
  WorkerAdapter,
  type IWorkerAdapter,
} from '@unchainedshop/core';
import { emit } from '@unchainedshop/events';

const TRIAL_ENDING_DAYS = 3;
const TRIAL_ENDING_WINDOW_MS = TRIAL_ENDING_DAYS * 24 * 60 * 60 * 1000;

const findDueUnbilledPeriod = (enrollment: Enrollment, referenceDate: Date): EnrollmentPeriod | null => {
  return (
    enrollment.periods
      ?.filter(
        (period) =>
          !period.isTrial &&
          !period.orderId &&
          new Date(period.start).getTime() <= referenceDate.getTime(),
      )
      .sort((left, right) => new Date(left.start).getTime() - new Date(right.start).getTime())[0] || null
  );
};

const emitTrialEndingIfNeeded = async (
  enrollment: Enrollment,
  enrollments: EnrollmentsModule,
  referenceDate: Date,
) => {
  const trialPeriod = enrollment.periods?.find((period) => {
    if (!period.isTrial || period.trialEndingNotifiedAt) return false;
    if (new Date(period.start).getTime() > referenceDate.getTime()) return false;
    const remaining = new Date(period.end).getTime() - referenceDate.getTime();
    return remaining > 0 && remaining <= TRIAL_ENDING_WINDOW_MS;
  });
  if (!trialPeriod) return;

  const claimedEnrollment = await enrollments.markEnrollmentTrialEndingNotified(
    enrollment._id,
    trialPeriod,
  );
  if (claimedEnrollment) {
    await emit('ENROLLMENT_TRIAL_ENDING', {
      enrollment: claimedEnrollment,
      trialEnd: trialPeriod.end,
    });
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
        enrollments.map(async (enrollment) => {
          try {
            const processedEnrollment = await services.enrollments.processEnrollment(enrollment);

            if (processedEnrollment.status === EnrollmentStatus.TERMINATED) {
              return null;
            }

            if (processedEnrollment.status === EnrollmentStatus.SUSPENDED) {
              return null;
            }

            const referenceDate = new Date();
            await emitTrialEndingIfNeeded(processedEnrollment, modules.enrollments, referenceDate);

            const product = await modules.products.findProduct({
              productId: processedEnrollment.productId,
            });
            const director = await EnrollmentDirector.actions(
              { enrollment: processedEnrollment, product: product! },
              unchainedAPI,
            );
            const unbilledPeriod = findDueUnbilledPeriod(processedEnrollment, referenceDate);
            const period = unbilledPeriod || (await director.nextPeriod());

            if (period) {
              if (
                processedEnrollment.expires &&
                period.start.getTime() >= new Date(processedEnrollment.expires).getTime()
              ) {
                return null;
              }

              if (period.isTrial) {
                const updatedEnrollment = await modules.enrollments.addEnrollmentPeriod(
                  processedEnrollment._id,
                  {
                    ...period,
                  },
                );
                if (updatedEnrollment) {
                  await emitTrialEndingIfNeeded(updatedEnrollment, modules.enrollments, referenceDate);
                }
                return null;
              }
              const configuration = await director.configurationForOrder({
                period,
              });
              if (configuration) {
                const order = await services.enrollments.generateOrderFromEnrollment(
                  processedEnrollment,
                  configuration,
                );
                if (order) {
                  if (unbilledPeriod) {
                    await modules.enrollments.linkEnrollmentPeriodOrder(
                      processedEnrollment._id,
                      period,
                      order._id,
                    );
                  } else {
                    await modules.enrollments.addEnrollmentPeriod(processedEnrollment._id, {
                      ...period,
                      orderId: order._id,
                    });
                  }
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
