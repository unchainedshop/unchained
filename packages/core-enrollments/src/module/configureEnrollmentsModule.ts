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
  assertDocumentDBCompatMode,
} from '@unchainedshop/mongodb';
import { EnrollmentsCollection } from '../db/EnrollmentsCollection.js';
import { enrollmentsSettings, EnrollmentsSettingsOptions } from '../enrollments-settings.js';

export interface EnrollmentQuery {
  status?: EnrollmentStatus[];
  userId?: string;
  queryString?: string;
}

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

  if (queryString) {
    assertDocumentDBCompatMode();
    selector.$text = { $search: queryString };
  }
  return selector;
};

export const configureEnrollmentsModule = async ({
  db,
  options: enrollmentOptions = {},
}: ModuleInput<EnrollmentsSettingsOptions>) => {
  registerEvents(ENROLLMENT_EVENTS);

  enrollmentsSettings.configureSettings(enrollmentOptions);

  const Enrollments = await EnrollmentsCollection(db);

  const isExpired = (enrollment: Enrollment, { referenceDate }: { referenceDate?: Date }) => {
    const relevantDate = referenceDate ? new Date(referenceDate) : new Date();
    const expiryDate = new Date(enrollment.expires);
    return relevantDate.getTime() > expiryDate.getTime();
  };

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
      sort?: SortOption[];
    }): Promise<Enrollment[]> => {
      const defaultSortOption: SortOption[] = [{ key: 'created', value: SortDirection.ASC }];
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

    create: async ({
      countryCode,
      currencyCode,
      ...enrollmentData
    }: Omit<Enrollment, 'status' | 'periods' | 'log' | '_id' | 'created'> &
      Pick<Partial<Enrollment>, '_id' | 'created'>): Promise<Enrollment> => {
      const { insertedId: enrollmentId } = await Enrollments.insertOne({
        _id: generateDbObjectId(),
        created: new Date(),
        ...enrollmentData,
        status: EnrollmentStatus.INITIAL,
        periods: [],
        currencyCode,
        countryCode,
        configuration: enrollmentData.configuration || [],
        log: [],
      });

      const enrollment = await Enrollments.findOne({
        _id: enrollmentId,
      });
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
      await emit('ENROLLMENT_REMOVE', { enrollmentId });
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

    updatePlan: async (enrollmentId: string, plan: EnrollmentPlan): Promise<Enrollment> => {
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
      return enrollment;
    },

    updateStatus,
    deleteInactiveUserEnrollments: async (userId: string) => {
      const { deletedCount } = await Enrollments.deleteMany({
        userId,
        status: { $in: [null, EnrollmentStatus.INITIAL, EnrollmentStatus.TERMINATED] },
      });
      return deletedCount;
    },
  };
};

export type EnrollmentsModule = Awaited<ReturnType<typeof configureEnrollmentsModule>>;
