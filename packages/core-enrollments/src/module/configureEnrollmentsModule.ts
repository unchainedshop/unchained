import { SortDirection, SortOption } from '@unchainedshop/utils';
import {
  Enrollment,
  EnrollmentPeriod,
  EnrollmentPlan,
  EnrollmentStatus,
} from '../db/EnrollmentsCollection.js';
import { emit, registerEvents } from '@unchainedshop/events';
import {
  generateDbFilterById,
  buildSortOptions,
  mongodb,
  Address,
  Contact,
  generateDbObjectId,
  ModuleInput,
} from '@unchainedshop/mongodb';
import { EnrollmentsCollection } from '../db/EnrollmentsCollection.js';
import { EnrollmentDirector } from '../enrollments-index.js';
import { enrollmentsSettings, EnrollmentsSettingsOptions } from '../enrollments-settings.js';
import { resolveBestCurrency } from '@unchainedshop/utils';

export type EnrollmentQuery = {
  status?: Array<EnrollmentStatus>;
  userId?: string;
  queryString?: string;
};

const ENROLLMENT_EVENTS: string[] = [
  'ENROLLMENT_ADD_PERIOD',
  'ENROLLMENT_CREATE',
  'ENROLLMENT_REMOVE',
  'ENROLLMENT_UPDATE',
];

export const buildFindSelector = ({ queryString, status, userId }: EnrollmentQuery) => {
  const selector: {
    deleted: Date;
    status?: any;
    $text?: { $search: string };
    userId?: string;
  } = {
    deleted: null,
  };
  if (status) selector.status = { $in: status };
  if (userId) selector.userId = userId;

  if (queryString) selector.$text = { $search: queryString };

  return selector;
};

export const configureEnrollmentsModule = async ({
  db,
  options: enrollmentOptions = {},
}: ModuleInput<EnrollmentsSettingsOptions>) => {
  registerEvents(ENROLLMENT_EVENTS);

  enrollmentsSettings.configureSettings(enrollmentOptions);

  const Enrollments = await EnrollmentsCollection(db);

  const findNewEnrollmentNumber = async (enrollment: Enrollment, index = 0): Promise<string> => {
    const newHashID = enrollmentsSettings.enrollmentNumberHashFn(enrollment, index);
    if ((await Enrollments.countDocuments({ enrollmentNumber: newHashID }, { limit: 1 })) === 0) {
      return newHashID;
    }
    return findNewEnrollmentNumber(enrollment, index + 1);
  };

  const updateStatus = async (
    enrollmentId: string,
    { status, info = '' }: { status: EnrollmentStatus; info?: string },
  ): Promise<Enrollment> => {
    const selector = generateDbFilterById(enrollmentId);
    const enrollment = await Enrollments.findOne(selector, {});

    if (enrollment.status === status) return enrollment;

    const date = new Date();
    const modifier: {
      $set: Partial<Enrollment>;
      $push: { log: Enrollment['log'][0] };
    } = {
      $set: { status, updated: new Date() },
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
        modifier.$set.enrollmentNumber = await findNewEnrollmentNumber(enrollment);
        break;
      case EnrollmentStatus.TERMINATED:
        modifier.$set.expires = enrollment.periods?.pop()?.end || new Date();
        break;
      default:
        break;
    }

    const updatedEnrollment = await Enrollments.findOneAndUpdate(selector, modifier, {
      returnDocument: 'after',
    });

    await emit('ENROLLMENT_UPDATE', { enrollment, field: 'status' });

    return updatedEnrollment;
  };

  const reactivateEnrollment = async (enrollment: Enrollment) => {
    return enrollment;
  };
  const isExpired = (enrollment: Enrollment, { referenceDate }: { referenceDate?: Date }) => {
    const relevantDate = referenceDate ? new Date(referenceDate) : new Date();
    const expiryDate = new Date(enrollment.expires);
    return relevantDate.getTime() > expiryDate.getTime();
  };

  const findNextStatus = async (enrollment: Enrollment, unchainedAPI): Promise<EnrollmentStatus> => {
    let status = enrollment.status;
    const director = await EnrollmentDirector.actions({ enrollment }, unchainedAPI);

    if (status === EnrollmentStatus.INITIAL || status === EnrollmentStatus.PAUSED) {
      if (await director.isValidForActivation()) {
        status = EnrollmentStatus.ACTIVE;
      }
    } else if (status === EnrollmentStatus.ACTIVE) {
      if (await director.isOverdue()) {
        status = EnrollmentStatus.PAUSED;
      }
    } else if (isExpired(enrollment, {})) {
      status = EnrollmentStatus.TERMINATED;
    }

    return status;
  };

  const processEnrollment = async (enrollment: Enrollment, unchainedAPI) => {
    let status = await findNextStatus(enrollment, unchainedAPI);

    if (status === EnrollmentStatus.ACTIVE) {
      const nextEnrollment = await reactivateEnrollment(enrollment);
      status = await findNextStatus(nextEnrollment, unchainedAPI);
    }

    return updateStatus(enrollment._id, { status, info: 'enrollment processed' });
  };

  const initializeEnrollment = async (
    enrollment: Enrollment,
    params: { orderIdForFirstPeriod?: string; reason: string },
    unchainedAPI,
  ) => {
    const { modules } = unchainedAPI;

    const director = await EnrollmentDirector.actions({ enrollment }, unchainedAPI);
    const period = await director.nextPeriod();

    if (period && (params.orderIdForFirstPeriod || period.isTrial)) {
      const intializedEnrollment = await modules.enrollments.addEnrollmentPeriod(enrollment._id, {
        ...period,
        orderId: params.orderIdForFirstPeriod,
      });

      return processEnrollment(intializedEnrollment, unchainedAPI);
    }

    return processEnrollment(enrollment, unchainedAPI);
  };

  const sendStatusToCustomer = async (
    enrollment: Enrollment,
    params: { locale?: Intl.Locale; reason?: string },
    unchainedAPI,
  ) => {
    const { modules } = unchainedAPI;

    let { locale } = params;
    if (!locale) {
      const user = await modules.users.findUserById(enrollment.userId);
      locale = modules.users.userLocale(user);
    }

    await modules.worker.addWork({
      type: 'MESSAGE',
      retries: 0,
      input: {
        reason: params.reason || 'status_change',
        locale,
        template: 'ENROLLMENT_STATUS',
        enrollmentId: enrollment._id,
      },
    });

    return enrollment;
  };

  const updateEnrollmentField =
    <T>(fieldKey: string) =>
    async (enrollmentId: string, fieldValue: T) => {
      const enrollment = await Enrollments.findOneAndUpdate(
        generateDbFilterById(enrollmentId),
        {
          $set: {
            updated: new Date(),
            [fieldKey]: fieldValue,
          },
        },
        { returnDocument: 'after' },
      );
      await emit('ENROLLMENT_UPDATE', { enrollment, field: fieldKey });
      return enrollment;
    };

  return {
    // Queries
    count: async (query: EnrollmentQuery) => {
      const enrollmentCount = await Enrollments.countDocuments(buildFindSelector(query));
      return enrollmentCount;
    },
    openEnrollmentWithProduct: async ({ productId }: { productId: string }): Promise<Enrollment> => {
      const selector: mongodb.Filter<Enrollment> = { productId };
      selector.status = { $in: [EnrollmentStatus.ACTIVE, EnrollmentStatus.PAUSED] };
      return Enrollments.findOne(selector);
    },

    findEnrollment: async (
      { enrollmentId, orderId }: { enrollmentId?: string; orderId?: string },
      options?: mongodb.FindOptions,
    ): Promise<Enrollment> => {
      const selector = enrollmentId
        ? generateDbFilterById(enrollmentId)
        : { 'periods.orderId': orderId };

      return Enrollments.findOne(selector, options);
    },

    findEnrollments: async ({
      limit,
      offset,
      sort,
      ...query
    }: EnrollmentQuery & {
      limit?: number;
      offset?: number;
      sort?: Array<SortOption>;
    }): Promise<Array<Enrollment>> => {
      const defaultSortOption: Array<SortOption> = [{ key: 'created', value: SortDirection.ASC }];
      const enrollments = Enrollments.find(buildFindSelector(query), {
        skip: offset,
        limit,
        sort: buildSortOptions(sort || defaultSortOption),
      });

      return enrollments.toArray();
    },

    // Transformations
    normalizedStatus: (enrollment: Enrollment): EnrollmentStatus => {
      return enrollment.status === null
        ? EnrollmentStatus.INITIAL
        : (enrollment.status as EnrollmentStatus);
    },

    isExpired,

    // Processing
    terminateEnrollment: async (enrollment: Enrollment, unchainedAPI) => {
      if (enrollment.status === EnrollmentStatus.TERMINATED) return enrollment;

      let updatedEnrollment = await updateStatus(enrollment._id, {
        status: EnrollmentStatus.TERMINATED,
        info: 'terminated manually',
      });

      updatedEnrollment = await processEnrollment(updatedEnrollment, unchainedAPI);

      return sendStatusToCustomer(updatedEnrollment, {}, unchainedAPI);
    },

    activateEnrollment: async (enrollment: Enrollment, unchainedAPI) => {
      if (enrollment.status === EnrollmentStatus.TERMINATED) return enrollment;

      let updatedEnrollment = await updateStatus(enrollment._id, {
        status: EnrollmentStatus.ACTIVE,
        info: 'activated manually',
      });

      updatedEnrollment = await processEnrollment(updatedEnrollment, unchainedAPI);

      return sendStatusToCustomer(updatedEnrollment, {}, unchainedAPI);
    },

    // Mutations
    addEnrollmentPeriod: async (enrollmentId: string, period: EnrollmentPeriod): Promise<Enrollment> => {
      const { start, end, orderId, isTrial } = period;
      const selector = generateDbFilterById(enrollmentId);
      const enrollment = await Enrollments.findOneAndUpdate(
        selector,
        {
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
          },
        },
        {
          returnDocument: 'after',
        },
      );

      await emit('ENROLLMENT_ADD_PERIOD', { enrollment });

      return enrollment;
    },

    create: async (
      {
        countryCode,
        currencyCode,
        orderIdForFirstPeriod,
        ...enrollmentData
      }: Omit<Enrollment, 'status' | 'periods' | 'log'>,
      unchainedAPI,
    ): Promise<Enrollment> => {
      const { modules } = unchainedAPI;

      const countryObject = await modules.countries.findCountry({ isoCode: countryCode });
      const currencies = await modules.currencies.findCurrencies({ includeInactive: false });
      const currency =
        currencyCode || resolveBestCurrency(countryObject.defaultCurrencyCode, currencies);

      const { insertedId: enrollmentId } = await Enrollments.insertOne({
        _id: generateDbObjectId(),
        created: new Date(),
        ...enrollmentData,
        status: EnrollmentStatus.INITIAL,
        periods: [],
        currencyCode: currency,
        countryCode,
        configuration: enrollmentData.configuration || [],
        log: [],
      });

      const newEnrollment = await Enrollments.findOne(generateDbFilterById(enrollmentId), {});

      const reason = 'new_enrollment';

      const initializedEnrollment = await initializeEnrollment(
        newEnrollment,
        {
          orderIdForFirstPeriod,
          reason,
        },
        unchainedAPI,
      );

      const enrollment = await sendStatusToCustomer(
        initializedEnrollment,
        {
          reason,
        },
        unchainedAPI,
      );

      await emit('ENROLLMENT_CREATE', { enrollment });

      return enrollment;
    },

    delete: async (enrollmentId: string) => {
      const { modifiedCount: deletedCount } = await Enrollments.updateOne(
        generateDbFilterById(enrollmentId),
        {
          $set: {
            deleted: new Date(),
          },
        },
      );
      await emit('ORDER_REMOVE', { enrollmentId });
      return deletedCount;
    },

    removeEnrollmentPeriodByOrderId: async (
      enrollmentId: string,
      orderId: string,
    ): Promise<Enrollment> => {
      const selector = generateDbFilterById(enrollmentId);
      return Enrollments.findOneAndUpdate(
        selector,
        {
          $set: {
            updated: new Date(),
          },
          $pull: {
            periods: { orderId: { $in: [orderId, undefined, null] } },
          },
        },
        { returnDocument: 'after' },
      );
    },

    updateBillingAddress: updateEnrollmentField<Address>('billingAddress'),
    updateContact: updateEnrollmentField<Contact>('contact'),
    updateContext: updateEnrollmentField<any>('meta'),
    updateDelivery: updateEnrollmentField<Enrollment['delivery']>('delivery'),
    updatePayment: updateEnrollmentField<Enrollment['payment']>('payment'),

    updatePlan: async (
      enrollmentId: string,
      plan: EnrollmentPlan,
      unchainedAPI,
    ): Promise<Enrollment> => {
      const enrollment = await Enrollments.findOneAndUpdate(
        generateDbFilterById(enrollmentId),
        {
          $set: {
            updated: new Date(),
            productId: plan.productId,
            quantity: plan.quantity,
            configuration: plan.configuration,
          },
        },
        { returnDocument: 'after' },
      );

      await emit('ENROLLMENT_UPDATE', { enrollment, field: 'plan' });

      const reason = 'updated_plan';
      const initializedEnrollment = await initializeEnrollment(enrollment, { reason }, unchainedAPI);

      return sendStatusToCustomer(initializedEnrollment, { reason }, unchainedAPI);
    },

    updateStatus,
  };
};

export type EnrollmentsModule = Awaited<ReturnType<typeof configureEnrollmentsModule>>;
