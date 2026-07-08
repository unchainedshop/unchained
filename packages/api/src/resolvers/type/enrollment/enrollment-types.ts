import type { Context } from '../../../context.ts';
import type { Enrollment as EnrollmentType } from '@unchainedshop/core-enrollments';

export const Enrollment = {
  isExpired: (obj: EnrollmentType, params: { referenceDate?: Date }, { modules }: Context) => {
    return modules.enrollments.isExpired(obj, params);
  },

  plan: ({ quantity, productId, configuration }: EnrollmentType) => {
    return {
      quantity,
      productId,
      configuration,
    };
  },
  expires: ({ expires, periods }) => {
    return expires ?? [...(periods || [])].filter(Boolean)?.pop()?.end;
  },

  requestedTerminationDate(obj: EnrollmentType) {
    return obj.requestedTerminationDate;
  },

  resumeAt(obj: EnrollmentType) {
    return obj.resumeAt;
  },

  contractStartDate(obj: EnrollmentType) {
    return obj.contractStartDate;
  },

  minimumCommitmentEnd(obj: EnrollmentType) {
    return obj.minimumCommitmentEnd;
  },

  cancellationReason(obj: EnrollmentType) {
    return obj.cancellationReason;
  },

  cancellationComment(obj: EnrollmentType) {
    return obj.cancellationComment;
  },

  country: async (obj: EnrollmentType, _: never, { loaders }: Context) =>
    obj.countryCode ? loaders.currencyLoader.load({ isoCode: obj.countryCode }) : null,
  currency: async (obj: EnrollmentType, _: never, { loaders }: Context) =>
    obj.currencyCode ? loaders.currencyLoader.load({ isoCode: obj.currencyCode }) : null,
  user: async (obj: EnrollmentType, _: never, { loaders }: Context) =>
    loaders.userLoader.load({ userId: obj.userId }),
};
