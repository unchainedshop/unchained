import { SortDirection, type SortOption, normalizePhoneNumber } from '@unchainedshop/utils';
import {
  type Enrollment,
  type EnrollmentPeriod,
  type EnrollmentPlan,
  type EnrollmentTerminationReason,
  EnrollmentStatus,
} from '../db/EnrollmentsCollection.ts';
import { emit, registerEvents } from '@unchainedshop/events';
import {
  generateDbFilterById,
  buildSortOptions,
  mongodb,
  type Address,
  type Contact,
  generateDbObjectId,
  type ModuleInput,
} from '@unchainedshop/mongodb';
import { EnrollmentsCollection } from '../db/EnrollmentsCollection.ts';
import { enrollmentsSettings, type EnrollmentsSettingsOptions } from '../enrollments-settings.ts';
import normalizeContactPhoneMigration from '../migrations/20260625120100-normalize-contact-phone.ts';

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
  'ENROLLMENT_SUSPEND',
  'ENROLLMENT_RESUME',
  'ENROLLMENT_PLAN_CHANGE',
  'ENROLLMENT_TRIAL_ENDING',
];

// Stores the contact's phone number in normalized E.164 format, falling back to the
// original value when it cannot be parsed (it has already passed input validation).
const normalizeContactPhone = <T extends Contact | undefined>(
  contact: T,
  defaultCountry?: string,
): T => {
  if (!contact?.telNumber) return contact;
  return {
    ...contact,
    telNumber: normalizePhoneNumber(contact.telNumber, defaultCountry) || contact.telNumber,
  } as T;
};

export const buildFindSelector = ({ queryString, status, userId }: EnrollmentQuery) => {
  const selector: mongodb.Filter<Enrollment> = {
    deleted: null,
  };
  if (status) selector.status = { $in: status };
  if (userId) selector.userId = userId;

  if (queryString) {
    selector.$text = { $search: queryString };
  }
  return selector;
};

export const configureEnrollmentsModule = async ({
  db,
  migrationRepository,
  options: enrollmentOptions = {},
}: ModuleInput<EnrollmentsSettingsOptions>) => {
  normalizeContactPhoneMigration(migrationRepository);

  registerEvents(ENROLLMENT_EVENTS);

  enrollmentsSettings.configureSettings(enrollmentOptions);

  const Enrollments = await EnrollmentsCollection(db);

  const isExpired = (enrollment: Enrollment, { referenceDate }: { referenceDate?: Date }) => {
    const relevantDate = referenceDate ? new Date(referenceDate) : new Date();
    if (!enrollment.expires) return false;
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
  ) => {
    const selector = generateDbFilterById(enrollmentId);
    const enrollment = await Enrollments.findOne(selector, {});

    if (!enrollment) return null;
    if (enrollment.status === status) return enrollment;

    const date = new Date();
    const modifier: {
      $set: Partial<Enrollment>;
      $unset?: { resumeAt: 1 };
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
        // A resumed enrollment keeps its number
        modifier.$set.enrollmentNumber =
          enrollment.enrollmentNumber || (await findNewEnrollmentNumber(enrollment));
        break;
      case EnrollmentStatus.TERMINATED: {
        const periodEnds = (enrollment.periods || []).map(({ end }) => new Date(end).getTime());
        modifier.$set.expires =
          enrollment.expires || (periodEnds.length ? new Date(Math.max(...periodEnds)) : date);
        break;
      }
      default:
        break;
    }

    // A scheduled resume only applies while the enrollment is suspended
    if (enrollment.status === EnrollmentStatus.SUSPENDED) modifier.$unset = { resumeAt: 1 };

    const updatedEnrollment = await Enrollments.findOneAndUpdate(selector, modifier, {
      returnDocument: 'after',
    });

    await emit('ENROLLMENT_UPDATE', { enrollment, field: 'status' });
    if (status === EnrollmentStatus.SUSPENDED) {
      await emit('ENROLLMENT_SUSPEND', { enrollment: updatedEnrollment });
    } else if (enrollment.status === EnrollmentStatus.SUSPENDED && status === EnrollmentStatus.ACTIVE) {
      await emit('ENROLLMENT_RESUME', { enrollment: updatedEnrollment });
    }

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
    openEnrollmentWithProduct: async ({ productId }: { productId: string }) => {
      const selector: mongodb.Filter<Enrollment> = { productId };
      selector.status = {
        $in: [EnrollmentStatus.ACTIVE, EnrollmentStatus.PAUSED, EnrollmentStatus.SUSPENDED],
      };
      return Enrollments.findOne(selector);
    },

    findEnrollment: async (
      params: { enrollmentId: string } | { orderId: string },
      options?: mongodb.FindOptions,
    ) => {
      if ('enrollmentId' in params) {
        return Enrollments.findOne(generateDbFilterById(params.enrollmentId), options);
      }
      return Enrollments.findOne({ 'periods.orderId': params.orderId, deleted: null }, options);
    },

    findEnrollmentsByOrderIds: async (
      { orderIds }: { orderIds: string[] },
      options?: mongodb.FindOptions,
    ): Promise<Enrollment[]> => {
      if (!orderIds?.length) return [];
      return Enrollments.find(
        { 'periods.orderId': { $in: orderIds }, deleted: null },
        options,
      ).toArray();
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
    addEnrollmentPeriod: async (enrollmentId: string, period: EnrollmentPeriod) => {
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

      if (!enrollment) return null;
      await emit('ENROLLMENT_ADD_PERIOD', { enrollment });
      return enrollment;
    },

    // Returns null when the period was already marked, so concurrent workers notify only once
    markEnrollmentTrialEndingNotified: async (
      enrollmentId: string,
      { start, end }: EnrollmentPeriod,
    ) => {
      const enrollment = await Enrollments.findOneAndUpdate(
        {
          ...generateDbFilterById(enrollmentId),
          periods: { $elemMatch: { start, end, trialEndingNotifiedAt: null } },
        },
        { $set: { 'periods.$.trialEndingNotifiedAt': new Date(), updated: new Date() } },
        { returnDocument: 'after' },
      );
      if (!enrollment) return null;
      await emit('ENROLLMENT_UPDATE', { enrollment, field: 'periods' });
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
        contact: normalizeContactPhone(
          enrollmentData.contact,
          enrollmentData.billingAddress?.countryCode || countryCode,
        ),
        configuration: enrollmentData.configuration || [],
        log: [],
      });

      const enrollment = (await Enrollments.findOne({
        _id: enrollmentId,
      })) as Enrollment;
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

    removeEnrollmentPeriodByOrderId: async (enrollmentId: string, orderId: string) => {
      const selector = generateDbFilterById(enrollmentId);
      return Enrollments.findOneAndUpdate(
        selector,
        {
          $set: {
            updated: new Date(),
          },
          $pull: {
            periods: { orderId: { $in: [orderId, undefined] } },
          },
        },
        { returnDocument: 'after' },
      );
    },

    updateBillingAddress: updateEnrollmentField<Address>('billingAddress'),
    updateContact: async (enrollmentId: string, contact: Contact) => {
      const existing = await Enrollments.findOne(generateDbFilterById(enrollmentId), {
        projection: { billingAddress: true, countryCode: true },
      });
      const defaultCountry = existing?.billingAddress?.countryCode || existing?.countryCode;
      return updateEnrollmentField<Contact>('contact')(
        enrollmentId,
        normalizeContactPhone(contact, defaultCountry),
      );
    },
    updateContext: updateEnrollmentField<any>('meta'),
    updateDelivery: updateEnrollmentField<Enrollment['delivery']>('delivery'),
    updatePayment: updateEnrollmentField<Enrollment['payment']>('payment'),
    updateExpiry: updateEnrollmentField<Date | null>('expires'),
    updateResumeAt: updateEnrollmentField<Date>('resumeAt'),

    updateCommitment: async (
      enrollmentId: string,
      {
        contractStartDate,
        minimumCommitmentEnd,
      }: { contractStartDate: Date; minimumCommitmentEnd: Date },
    ) => {
      const enrollment = await Enrollments.findOneAndUpdate(
        generateDbFilterById(enrollmentId),
        { $set: { updated: new Date(), contractStartDate, minimumCommitmentEnd } },
        { returnDocument: 'after' },
      );
      await emit('ENROLLMENT_UPDATE', { enrollment, field: 'commitment' });
      return enrollment;
    },

    updateCancellation: async (
      enrollmentId: string,
      params: { reason?: EnrollmentTerminationReason; comment?: string },
    ) => {
      const enrollment = await Enrollments.findOneAndUpdate(
        generateDbFilterById(enrollmentId),
        {
          $set: {
            updated: new Date(),
            ...(params.reason && { cancellationReason: params.reason }),
            ...(params.comment !== undefined && { cancellationComment: params.comment }),
          },
        },
        { returnDocument: 'after' },
      );
      await emit('ENROLLMENT_UPDATE', { enrollment, field: 'cancellation' });
      return enrollment;
    },

    updatePlan: async (enrollmentId: string, plan: EnrollmentPlan) => {
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
      if (!enrollment) return null;
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
