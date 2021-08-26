import { WorkerDirector } from 'meteor/unchained:core-worker';
import WorkerPlugin from 'meteor/unchained:core-worker/workers/base';
import { EnrollmentStatus } from '../db/enrollments/schema';
import { Enrollments } from '../db/enrollments/collections';

class GenerateEnrollmentOrders extends WorkerPlugin {
  static key = 'shop.unchained.worker-plugin.generate-enrollment-orders';

  static label = 'Generates new Orders from Enrollments';

  static version = '1.0';

  static type = 'ENROLLMENT_ORDER_GENERATOR';

  static async doWork(input) {
    const enrollments = Enrollments.find({
      status: { $in: [EnrollmentStatus.ACTIVE, EnrollmentStatus.PAUSED] },
    }).fetch();
    const errors = (
      await Promise.all(
        enrollments.map(async (enrollment) => {
          try {
            const director = enrollment.director();
            const period = await director.nextPeriod(input);
            if (period) {
              const configuration = await director.configurationForOrder({
                ...input,
                period,
              });
              if (configuration) {
                const order = await enrollment.generateOrder(configuration);
                if (order) {
                  await Enrollments.addEnrollmentPeriod({
                    orderId: order._id,
                    enrollmentId: enrollment._id,
                    period,
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
        })
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
  }
}

WorkerDirector.registerPlugin(GenerateEnrollmentOrders);

export default GenerateEnrollmentOrders;
