import { Context } from '@unchainedshop/types/api';
import {
  ModuleInput,
  ModuleMutations,
  Query,
} from '@unchainedshop/types/common';
import { Quotation, QuotationsModule } from '@unchainedshop/types/quotations';
import { Locale } from 'locale';
import { emit, registerEvents } from 'meteor/unchained:events';
import { log } from 'meteor/unchained:logger';
import {
  dbIdToString,
  generateDbFilterById,
  generateDbMutations,
  objectInvert,
} from 'meteor/unchained:utils';
import { QuotationsSchema } from '../db/QuotationsSchema';
import { QuotationDirector } from '../quotations-index';
import { QuotationsCollection } from '../db/QuotationsCollection';
import { QuotationStatus } from '../db/QuotationStatus';
import { quotationsSettings } from '../quotations-settings';

const QUOTATION_EVENTS: string[] = [
  'QUOTATION_REQUEST_CREATE',
  'QUOTATION_REMOVE',
  'QUOTATION_UPDATE',
];

const buildFindSelector = ({ userId }: { userId?: string }) => {
  const selector: Query = userId ? { userId } : {};
  return selector;
};

const isExpired: QuotationsModule['isExpired'] = (
  quotation,
  { referenceDate }
) => {
  const relevantDate = referenceDate ? new Date(referenceDate) : new Date();
  const expiryDate = new Date(quotation.expires);
  const isQuotationExpired = relevantDate.getTime() > expiryDate.getTime();
  return isQuotationExpired;
};

export const configureQuotationsModule = async ({
  db,
}: ModuleInput): Promise<QuotationsModule> => {
  registerEvents(QUOTATION_EVENTS);

  const Quotations = await QuotationsCollection(db);

  const mutations = generateDbMutations<Quotation>(
    Quotations,
    QuotationsSchema
  ) as ModuleMutations<Quotation>;

  const findNewQuotationNumber = async (
    quotation: Quotation
  ): Promise<string> => {
    let quotationNumber = null;
    let i = 0;
    while (!quotationNumber) {
      const newHashID = quotationsSettings.quotationNumberHashFn(quotation, i);
      if (
        (await Quotations.find(
          { quotationNumber: newHashID },
          { limit: 1 }
        ).count()) === 0
      ) {
        quotationNumber = newHashID;
      }
      i += 1;
    }
    return quotationNumber;
  };

  const findNextStatus = async (
    quotation: Quotation,
    requestContext: Context
  ): Promise<QuotationStatus> => {
    let status = quotation.status as QuotationStatus;
    const director = QuotationDirector.actions({ quotation }, requestContext);

    if (status === QuotationStatus.REQUESTED) {
      if (!(await director.isManualRequestVerificationRequired())) {
        status = QuotationStatus.PROCESSING;
      }
    }
    if (status === QuotationStatus.PROCESSING) {
      if (!(await director.isManualProposalRequired())) {
        status = QuotationStatus.PROPOSED;
      }
    }
    return status;
  };

  const updateStatus: QuotationsModule['updateStatus'] = async (
    quotationId,
    { status, info = '' },
    userId
  ) => {
    const selector = generateDbFilterById(quotationId);
    const quotation = await Quotations.findOne(selector);

    if (quotation.status === status) return quotation;

    const date = new Date();
    const modifier = {
      $set: { status, updated: new Date(), updatedBy: userId },
      $push: {
        log: {
          date,
          status,
          info,
        },
      },
    };

    switch (status) {
      // explicitly use fallthrough here!
      case QuotationStatus.FULLFILLED:
        if (!quotation.fullfilled) {
          /* @ts-ignore */
          modifier.$set.fullfilled = date;
        }
        /* @ts-ignore */
        modifier.$set.expires = date;
      case QuotationStatus.PROCESSING:
        if (!quotation.quotationNumber) {
          /* @ts-ignore */
          modifier.$set.quotationNumber = findNewQuotationNumber(quotation);
        }
        break;
      case QuotationStatus.REJECTED:
        /* @ts-ignore */
        modifier.$set.expires = date;
        /* @ts-ignore */
        modifier.$set.rejected = date;
        break;
      default:
        break;
    }

    log(`New Status: ${status}`, { quotationId });

    await Quotations.updateOne(selector, modifier);

    const updatedQuotation = await Quotations.findOne(selector);

    emit('QUOTATION_UPDATE', { quotation, field: 'status' });

    return updatedQuotation;
  };

  const processQuotation = async (
    quotation: Quotation,
    params: { quotationContext?: any },
    requestContext: Context
  ) => {
    const { modules, userId } = requestContext;

    const nextStatus = await findNextStatus(quotation, requestContext);
    const director = QuotationDirector.actions({ quotation }, requestContext);

    if (
      quotation.status === QuotationStatus.REQUESTED &&
      nextStatus !== QuotationStatus.REQUESTED
    ) {
      await director.submitRequest(params.quotationContext);
    }
    if (nextStatus !== QuotationStatus.PROCESSING) {
      await director.verifyRequest(params.quotationContext);
    }
    if (nextStatus === QuotationStatus.REJECTED) {
      await director.rejectRequest(params.quotationContext);
    }
    if (nextStatus === QuotationStatus.PROPOSED) {
      const proposal = await director.quote();
      return modules.quotations.updateProposal(
        dbIdToString(quotation._id),
        proposal,
        userId
      );
    }

    return await updateStatus(
      dbIdToString(quotation._id),
      { status: nextStatus, info: 'quotation processed' },
      requestContext.userId
    );
  };

  const sendStatusToCustomer = async (
    quotation: Quotation,
    requestContext: Context
  ) => {
    const { modules, userId } = requestContext;

    const user = await modules.users.findUser({
      userId: quotation.userId,
    });
    const locale = modules.users.userLocale(user, requestContext);

    await modules.worker.addWork(
      {
        type: 'MESSAGE',
        retries: 0,
        input: {
          locale,
          template: 'QUOTATION_STATUS',
          quotationId: dbIdToString(quotation._id),
        },
      },
      userId
    );

    return quotation;
  };

  const updateQuotationFields =
    (fieldKeys: Array<string>) =>
    async (quotationId: string, values: any, userId?: string) => {
      log(`Update quotation fields ${fieldKeys.join(', ').toUpperCase()}`, {
        quotationId,
        userId,
      });

      const modifier = {
        $set: fieldKeys.reduce(
          (set, key) => ({ ...set, [key]: values[key] }),
          {}
        ),
      };

      await mutations.update(quotationId, modifier, userId);

      const selector = generateDbFilterById(quotationId);
      const quotation = await Quotations.findOne(selector);

      emit('QUOTATION_UPDATE', { quotation, fields: fieldKeys });

      return quotation;
    };

  return {
    // Queries
    count: async (query) => {
      const quotationCount = await Quotations.find(
        buildFindSelector(query)
      ).count();
      return quotationCount;
    },

    findQuotation: async ({ quotationId }, options) => {
      const selector = generateDbFilterById(quotationId);
      return await Quotations.findOne(selector, options);
    },

    findQuotations: async ({ limit, offset, ...query }, options) => {
      const quotations = Quotations.find(buildFindSelector(query), {
        limit,
        skip: offset,
      });

      return await quotations.toArray();
    },

    // Transformations
    normalizedStatus: (quotation) => {
      return objectInvert(QuotationStatus)[quotation.status || null];
    },

    isExpired,

    isProposalValid: (quotation) => {
      return (
        quotation.status === QuotationStatus.PROPOSED && !isExpired(quotation)
      );
    },

    // Processing
    fullfillQuotation: async (quotationId, info, requestContext) => {
      const selector = generateDbFilterById(quotationId);
      const quotation = await Quotations.findOne(selector);

      if (quotation.status === QuotationStatus.FULLFILLED) return quotation;

      let updatedQuotation = await updateStatus(
        dbIdToString(quotation._id),
        {
          status: QuotationStatus.FULLFILLED,
          info: JSON.stringify(info),
        },
        requestContext.userId
      );

      updatedQuotation = await processQuotation(
        updatedQuotation,
        {},
        requestContext
      );

      return await sendStatusToCustomer(updatedQuotation, requestContext);
    },

    proposeQuotation: async (
      quotation,
      { quotationContext },
      requestContext
    ) => {
      if (quotation.status !== QuotationStatus.PROCESSING) return quotation;

      let updatedQuotation = await updateStatus(
        dbIdToString(quotation._id),
        {
          status: QuotationStatus.PROPOSED,
          info: 'proposed manually',
        },
        requestContext.userId
      );

      updatedQuotation = await processQuotation(
        updatedQuotation,
        { quotationContext },
        requestContext
      );

      return await sendStatusToCustomer(updatedQuotation, requestContext);
    },

    rejectQuotation: async (
      quotation,
      { quotationContext },
      requestContext
    ) => {
      if (quotation.status === QuotationStatus.FULLFILLED) return quotation;

      let updatedQuotation = await updateStatus(
        dbIdToString(quotation._id),
        {
          status: QuotationStatus.REJECTED,
          info: 'rejected manually',
        },
        requestContext.userId
      );

      updatedQuotation = await processQuotation(
        updatedQuotation,
        { quotationContext },
        requestContext
      );

      return await sendStatusToCustomer(updatedQuotation, requestContext);
    },

    verifyQuotation: async (
      quotation,
      { quotationContext },
      requestContext
    ) => {
      if (quotation.status !== QuotationStatus.REQUESTED) return quotation;

      let updatedQuotation = await updateStatus(
        dbIdToString(quotation._id),
        {
          status: QuotationStatus.PROCESSING,
          info: 'verified elligibility manually',
        },
        requestContext.userId
      );

      updatedQuotation = await processQuotation(
        updatedQuotation,
        { quotationContext },
        requestContext
      );

      return await sendStatusToCustomer(updatedQuotation, requestContext);
    },

    transformItemConfiguration: async (
      quotation,
      configuration,
      requestContext
    ) => {
      const director = QuotationDirector.actions({ quotation }, requestContext);
      return await director.transformItemConfiguration(configuration);
    },

    // Mutations
    create: async ({ countryCode, ...quotationData }, requestContext) => {
      const { services, userId } = requestContext;

      log('Create Quotation', { userId });

      const currency = await services.countries.resolveDefaultCurrencyCode({
        isoCode: countryCode,
      });

      const quotationId = await mutations.create(
        {
          ...quotationData,
          configuration: quotationData.configuration || [],
          countryCode,
          currency,
          log: [],
          status: QuotationStatus.REQUESTED,
        },
        userId
      );

      const newQuotation = await Quotations.findOne(
        generateDbFilterById(quotationId)
      );

      let quotation = await processQuotation(newQuotation, {}, requestContext);

      quotation = await sendStatusToCustomer(quotation, requestContext);

      emit('QUOTATION_REQUEST_CREATE', { quotation });

      return quotation;
    },

    updateContext: updateQuotationFields(['context']),
    updateProposal: updateQuotationFields(['price', 'expires', 'meta']),

    updateStatus,
  };
};
