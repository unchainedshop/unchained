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

// Queries

export type EnrollmentQuery = {
  status?: Array<EnrollmentStatus>;
  userId?: string;
  queryString?: string;
};

export interface EnrollmentQueries {
  findEnrollment: (
    params: { enrollmentId?: string; orderId?: string },
    options?: mongodb.FindOptions,
  ) => Promise<Enrollment>;
  findEnrollments: (
    params: EnrollmentQuery & {
      limit?: number;
      offset?: number;
      sort?: Array<SortOption>;
    },
  ) => Promise<Array<Enrollment>>;
  openEnrollmentWithProduct(params: { productId: string }): Promise<Enrollment | null>;
  count: (params: EnrollmentQuery) => Promise<number>;
}

// Transformations

export interface EnrollmentTransformations {
  normalizedStatus: (enrollment: Enrollment) => string;
  isExpired: (enrollment: Enrollment, params: { referenceDate?: Date }) => boolean;
}

// Processing

export type EnrollmentContextParams = (enrollment: Enrollment, unchainedAPI) => Promise<Enrollment>;

export interface EnrollmentProcessing {
  terminateEnrollment: EnrollmentContextParams;
  activateEnrollment: EnrollmentContextParams;
}

export interface EnrollmentMutations {
  addEnrollmentPeriod: (enrollmentId: string, period: EnrollmentPeriod) => Promise<Enrollment>;

  create: (doc: Omit<Enrollment, 'status' | 'periods' | 'log'>, unchainedAPI) => Promise<Enrollment>;

  delete: (enrollmentId: string) => Promise<number>;

  removeEnrollmentPeriodByOrderId: (enrollmentId: string, orderId: string) => Promise<Enrollment>;

  updateBillingAddress: (enrollmentId: string, billingAddress: Address) => Promise<Enrollment>;

  updateContact: (enrollmentId: string, contact: Contact) => Promise<Enrollment>;

  updateContext: (enrollmentId: string, context: any) => Promise<Enrollment | null>;

  updateDelivery: (enrollmentId: string, delivery: Enrollment['delivery']) => Promise<Enrollment>;

  updatePayment: (enrollmentId: string, payment: Enrollment['payment']) => Promise<Enrollment>;

  updatePlan: (enrollmentId: string, plan: EnrollmentPlan, unchainedAPI) => Promise<Enrollment>;

  updateStatus: (
    enrollmentId: string,
    params: { status: EnrollmentStatus; info?: string },
    unchainedAPI,
  ) => Promise<Enrollment>;
}

export type EnrollmentsModule = EnrollmentQueries &
  EnrollmentTransformations &
  EnrollmentProcessing &
  EnrollmentMutations;

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
}: ModuleInput<EnrollmentsSettingsOptions>): Promise<EnrollmentsModule> => {
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

  const updateStatus: EnrollmentsModule['updateStatus'] = async (
    enrollmentId,
    { status, info = '' },
  ) => {
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

  const isExpired = (enrollment, { referenceDate }: { referenceDate?: Date }) => {
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

    return updateStatus(enrollment._id, { status, info: 'enrollment processed' }, unchainedAPI);
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

  const updateEnrollmentField = (fieldKey: string) => async (enrollmentId: string, fieldValue: any) => {
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
    openEnrollmentWithProduct: async ({ productId }) => {
      const selector: mongodb.Filter<Enrollment> = { productId };
      selector.status = { $in: [EnrollmentStatus.ACTIVE, EnrollmentStatus.PAUSED] };
      return Enrollments.findOne(selector);
    },

    findEnrollment: async ({ enrollmentId, orderId }, options) => {
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
    }: EnrollmentQuery & { limit?: number; offset?: number; sort?: Array<SortOption> }) => {
      const defaultSortOption: Array<SortOption> = [{ key: 'created', value: SortDirection.ASC }];
      const enrollments = Enrollments.find(buildFindSelector(query), {
        skip: offset,
        limit,
        sort: buildSortOptions(sort || defaultSortOption),
      });

      return enrollments.toArray();
    },

    // Transformations
    normalizedStatus: (enrollment) => {
      return enrollment.status === null
        ? EnrollmentStatus.INITIAL
        : (enrollment.status as EnrollmentStatus);
    },

    isExpired,

    // Processing
    terminateEnrollment: async (enrollment, unchainedAPI) => {
      if (enrollment.status === EnrollmentStatus.TERMINATED) return enrollment;

      let updatedEnrollment = await updateStatus(
        enrollment._id,
        {
          status: EnrollmentStatus.TERMINATED,
          info: 'terminated manually',
        },
        unchainedAPI,
      );

      updatedEnrollment = await processEnrollment(updatedEnrollment, unchainedAPI);

      return sendStatusToCustomer(updatedEnrollment, {}, unchainedAPI);
    },

    activateEnrollment: async (enrollment, unchainedAPI) => {
      if (enrollment.status === EnrollmentStatus.TERMINATED) return enrollment;

      let updatedEnrollment = await updateStatus(
        enrollment._id,
        {
          status: EnrollmentStatus.ACTIVE,
          info: 'activated manually',
        },
        unchainedAPI,
      );

      updatedEnrollment = await processEnrollment(updatedEnrollment, unchainedAPI);

      return sendStatusToCustomer(updatedEnrollment, {}, unchainedAPI);
    },

    // Mutations
    addEnrollmentPeriod: async (enrollmentId, period) => {
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
      { countryCode, currencyCode, orderIdForFirstPeriod, ...enrollmentData },
      unchainedAPI,
    ) => {
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

    delete: async (enrollmentId) => {
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

    removeEnrollmentPeriodByOrderId: async (enrollmentId, orderId) => {
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

    updateBillingAddress: updateEnrollmentField('billingAddress'),
    updateContact: updateEnrollmentField('contact'),
    updateContext: updateEnrollmentField('meta'),
    updateDelivery: updateEnrollmentField('delivery'),
    updatePayment: updateEnrollmentField('payment'),

    updatePlan: async (enrollmentId, plan, unchainedAPI) => {
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
