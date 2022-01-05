import {
  ModuleInput,
  ModuleMutations,
  Query,
  Update,
} from '@unchainedshop/types/common';
import {
  Enrollment,
  EnrollmentsModule,
} from '@unchainedshop/types/enrollments';
import { log } from 'meteor/unchained:logger';
import { Locale } from 'locale';
import {
  dbIdToString,
  objectInvert,
  generateDbFilterById,
  generateDbMutations,
} from 'meteor/unchained:utils';
import { EnrollmentsCollection } from '../db/EnrollmentsCollection';
import { EnrollmentStatus } from '../db/EnrollmentStatus';
import { enrollmentsSettings } from '../enrollments-settings';
import { emit, registerEvents } from 'meteor/unchained:events';
import { Context } from '@unchainedshop/types/api';
import { request } from 'http';
import { EnrollmentsSchema } from 'src/db/EnrollmentsSchema';

const ENROLLMENT_EVENTS: string[] = [
  'ENROLLMENT_ADD_PERIOD',
  'ENROLLMENT_CREATE',
  'ENROLLMENT_REMOVE',
  'ENROLLMENT_UPDATE',
];

export const configureEnrollmentsModule = async ({
  db,
}: ModuleInput): Promise<EnrollmentsModule> => {
  registerEvents(ENROLLMENT_EVENTS);

  const Enrollments = await EnrollmentsCollection(db);

  const mutations = generateDbMutations<Enrollment>(
    Enrollments,
    EnrollmentsSchema
  ) as ModuleMutations<Enrollment>;

  const findNewEnrollmentNumber = async (
    enrollment: Enrollment
  ): Promise<string> => {
    let enrollmentNumber: string = null;
    let index = 0;
    while (!enrollmentNumber) {
      const newHashID = enrollmentsSettings.enrollmentNumberHashFn(
        enrollment,
        index
      );
      if (
        (await Enrollments.find(
          { enrollmentNumber: newHashID },
          { limit: 1 }
        ).count()) === 0
      ) {
        enrollmentNumber = newHashID;
      }
      index += 1;
    }
    return enrollmentNumber;
  };

  const findNextStatus = async (
    enrollment: Enrollment,
    requestContext: Context
  ): Promise<EnrollmentStatus> => {
    let status = enrollment.status as EnrollmentStatus;
    const director = this.director();

    if (
      status === EnrollmentStatus.INITIAL ||
      status === EnrollmentStatus.PAUSED
    ) {
      if (await director.isValidForActivation()) {
        status = EnrollmentStatus.ACTIVE;
      }
    } else if (status === EnrollmentStatus.ACTIVE) {
      if (await director.isOverdue()) {
        status = EnrollmentStatus.PAUSED;
      }
    } else if (requestContext.modules.enrollments.isExpired(enrollment, {})) {
      status = EnrollmentStatus.TERMINATED;
    }

    return status;
  };

  const updateStatus: EnrollmentsModule['updateStatus'] = async (
    enrollmentId,
    { status, info = '' },
    requestContext
  ) => {
    const selector = generateDbFilterById(enrollmentId);
    const enrollment = await Enrollments.findOne(selector);

    if (enrollment.status === status) return enrollment;

    const date = new Date();
    const modifier = {
      $set: { status, updated: new Date(), updatedBy: requestContext.userId },
      $push: {
        log: {
          date,
          status,
          info,
        },
      },
    };

    switch (status) {
      case EnrollmentStatus.ACTIVE:
        /* @ts-ignore */
        modifier.$set.enrollmentNumber = await findNewEnrollmentNumber(
          enrollment
        );
        break;
      case EnrollmentStatus.TERMINATED:
        /* @ts-ignore */
        modifier.$set.expires = enrollment.periods?.pop()?.end || new Date();
        break;
      default:
        break;
    }

    log(`New Status: ${status}`, { enrollmentId });

    await Enrollments.updateOne(selector, modifier);

    const updatedEnrollment = await Enrollments.findOne(selector);

    emit('ENROLLMENT_UPDATE', { enrollment, field: 'status' });

    return updatedEnrollment;
  };

  const reactivateEnrollment = async (
    enrollment: Enrollment,
    params: { enrollmentContext?: any; orderIdForFirstPeriod?: string },
    requestContext: Context
  ) => {
    return enrollment;
  };

  const processEnrollment = async (
    enrollment: Enrollment,
    params: { enrollmentContext?: any; orderIdForFirstPeriod?: string },
    requestContext: Context
  ) => {
    const nextStatus = await findNextStatus(enrollment, requestContext);

    if (nextStatus === EnrollmentStatus.ACTIVE) {
      await reactivateEnrollment(enrollment, params, requestContext);
    }

    return await updateStatus(
      dbIdToString(enrollment._id),
      { status: nextStatus, info: 'enrollment processed' },
      requestContext
    );
  };

  const initializeEnrollment = async (
    enrollment: Enrollment,
    params: { orderIdForFirstPeriod?: string; reason: string },
    requestContext: Context
  ) => {
    const { modules, userId } = requestContext;

    const user = await modules.users.findUser({
      userId: enrollment.userId,
    });
    const locale = modules.users.userLocale(user, requestContext);
    const reason = 'new_enrollment';

    const director = EnrollmentDirector.actions({ enrollment }, requestContext);
    const period = await director.nextPeriod({
      orderId: params.orderIdForFirstPeriod,
      reason,
      locale,
    });

    if (period && (params.orderIdForFirstPeriod || period.isTrial)) {
      const intializedEnrollment =
        await modules.enrollments.addEnrollmentPeriod(
          dbIdToString(enrollment._id),
          period,
          userId
        );

      return await processEnrollment(
        intializedEnrollment,
        params,
        requestContext
      );
    }

    return await processEnrollment(enrollment, params, requestContext);
  };

  const sendStatusToCustomer = async (
    enrollment: Enrollment,
    params: { locale?: Locale; reason?: string } = { reason: 'status_change' },
    requestContext: Context
  ) => {
    const { modules, userId } = requestContext;

    let locale = params.locale;
    if (!locale) {
      const user = await modules.users.findUser({
        userId: enrollment.userId,
      });
      locale = modules.users.userLocale(user, requestContext);
    }

    await modules.worker.addWork(
      {
        type: 'MESSAGE',
        retries: 0,
        input: {
          reason: params.reason,
          locale,
          template: 'ENROLLMENT_STATUS',
          enrollmentId: dbIdToString(enrollment._id),
        },
      },
      userId
    );

    return enrollment;
  };

  const updateEnrollmentField =
    (fieldKey: string) =>
    async (enrollmentId: string, fieldValue: any, userId?: string) => {
      log(`Update enrollment field ${fieldKey.toUpperCase()}`, {
        enrollmentId,
        userId,
      });

      await mutations.update(enrollmentId, { [fieldKey]: fieldValue }, userId);

      const selector = generateDbFilterById(enrollmentId);
      const enrollment = await Enrollments.findOne(selector);

      emit('ENROLLMENT_UPDATE', { enrollment, field: fieldKey });

      return enrollment;
    };

  return {
    // Queries
    count: async () => {
      const enrollmentCount = await Enrollments.find({}).count();
      return enrollmentCount;
    },

    findEnrollment: async ({ enrollmentId, orderId }, options) => {
      const selector = enrollmentId
        ? generateDbFilterById(enrollmentId)
        : { 'periods.orderId': orderId };

      return await Enrollments.findOne(selector, options);
    },

    findEnrollments: async ({ limit, offset }) => {
      const enrollments = Enrollments.find(
        {},
        {
          skip: offset,
          limit,
        }
      );

      return await enrollments.toArray();
    },

    // Transformations
    normalizedStatus: (enrollment) => {
      return objectInvert(EnrollmentStatus)[enrollment.status || null];
    },

    isExpired: (enrollment, { referenceDate }) => {
      const relevantDate = referenceDate ? new Date(referenceDate) : new Date();
      const expiryDate = new Date(enrollment.expires);
      const isExpired = relevantDate.getTime() > expiryDate.getTime();
      return isExpired;
    },

    // Processing
    terminateEnrollment: async (
      enrollment,
      { enrollmentContext },
      requestContext
    ) => {
      if (enrollment.status === EnrollmentStatus.TERMINATED) return enrollment;

      const updatedEnrollment = await updateStatus(
        dbIdToString(enrollment._id),
        {
          status: EnrollmentStatus.TERMINATED,
          info: 'terminated manually',
        },
        requestContext
      );

      await processEnrollment(
        updatedEnrollment,
        { enrollmentContext },
        requestContext
      );

      return await sendStatusToCustomer(enrollment, {}, requestContext);
    },

    activateEnrollment: async (
      enrollment,
      { enrollmentContext },
      requestContext
    ) => {
      if (enrollment.status === EnrollmentStatus.TERMINATED) return enrollment;

      const updatedEnrollment = await updateStatus(
        dbIdToString(enrollment._id),
        {
          status: EnrollmentStatus.ACTIVE,
          info: 'activated manually',
        },
        requestContext
      );

      await processEnrollment(
        updatedEnrollment,
        { enrollmentContext },
        requestContext
      );

      return await sendStatusToCustomer(enrollment, {}, requestContext);
    },

    // Mutations
    addEnrollmentPeriod: async (enrollmentId, period, userId) => {
      const { start, end, orderId, isTrial } = period;
      const selector = generateDbFilterById(enrollmentId);
      await Enrollments.updateOne(selector, {
        $push: {
          periods: {
            start,
            end,
            orderId,
            isTrial,
          },
        },
        $set: {
          updated: new Date(),
          updatedBy: userId,
        },
      });
      const enrollment = await Enrollments.findOne(selector);

      emit('ENROLLMENT_ADD_PERIOD', { enrollment });

      return enrollment;
    },

    create: async (
      { countryCode, currencyCode, orderIdForFirstPeriod, ...enrollmentData },
      requestContext
    ) => {
      const { userId, modules, services } = requestContext;

      log('Create Enrollment', { userId });

      const currency =
        currencyCode ||
        (await services.countries.resolveDefaultCurrencyCode({
          isoCode: countryCode,
        }));

      const enrollmentId = await mutations.create(
        {
          ...enrollmentData,
          status: EnrollmentStatus.INITIAL,
          periods: [],
          currencyCode: currency,
          countryCode,
          log: [],
        },
        userId
      );

      const newEnrollment = await Enrollments.findOne(
        generateDbFilterById(enrollmentId)
      );

      const reason = 'new_enrollment';

      const initializedEnrollment = await initializeEnrollment(
        newEnrollment,
        {
          orderIdForFirstPeriod,
          reason,
        },
        requestContext
      );

      const enrollment = await sendStatusToCustomer(
        initializedEnrollment,
        {
          reason,
        },
        requestContext
      );

      emit('ENROLLMENT_CREATE', { enrollment });

      return enrollment;
    },

    createFromCheckout: async (
      order,
      { orderPositions, context },
      requestContext
    ) => {
      const { modules, userId } = requestContext;

      const payment = await modules.orders.payments.findOrderPayment({
        orderPaymentId: order.paymentId,
      });
      const delivery = await modules.orders.deliveries.findDelivery({
        orderDeliveryId: order.deliveryId,
      });

      const template = {
        orderId: order._id,
        userId: order.userId,
        countryCode: order.countryCode,
        currencyCode: order.currency,
        billingAddress: order.billingAddress,
        contact: order.contact,
        payment: {
          paymentProviderId: payment.paymentProviderId,
          context: payment.context,
        },
        delivery: {
          deliveryProviderId: delivery.deliveryProviderId,
          context: delivery.context,
        },
        // TODO: Check with pascal
        meta: order.context,
      };

      const enrollments = await Promise.all(
        orderPositions.map(async (orderPosition) => {
          const enrollmentData =
            await EnrollmentDirector.transformOrderItemToEnrollment(
              orderPosition,
              {
                ...template,
                ...context,
              }
            );

          return await modules.enrollments.create(
            {
              ...enrollmentData,
              orderIdForFirstPeriod: order._id,
            },
            requestContext
          );
        })
      );

      return enrollments
    },

    delete: async (enrollmentId, userId) => {
      const deletedCount = await mutations.delete(enrollmentId, userId);
      emit('ORDER_REMOVE', { enrollmentId });
      return deletedCount;
    },

    updateBillingAddress: updateEnrollmentField('billingAddress'),
    updateContact: updateEnrollmentField('contact'),
    updateContext: updateEnrollmentField('context'),
    updateDelivery: updateEnrollmentField('delivery'),
    updatePayment: updateEnrollmentField('payment'),

    updatePlan: async (enrollmentId, plan, requestContext) => {
      const { modules, userId } = requestContext;

      log(`Update enrollment plan fields`, {
        enrollmentId,
        userId,
      });

      await mutations.update(
        enrollmentId,
        {
          productId: plan.productId,
          quantity: plan.quantity,
          configuration: plan.configuration,
        },
        userId
      );

      const selector = generateDbFilterById(enrollmentId);
      const enrollment = await Enrollments.findOne(selector);

      emit('ENROLLMENT_UPDATE', { enrollment, field: 'plan' });

      const reason = 'updated_plan';
      const initializedEnrollment = await initializeEnrollment(
        enrollment,
        { reason },
        requestContext
      );

      return await sendStatusToCustomer(
        initializedEnrollment,
        { reason },
        requestContext
      );
    },

    updateStatus,
  };
};
