import { Context } from '@unchainedshop/types/api';
import { ModuleInput, ModuleMutations, Update } from '@unchainedshop/types/common';
import { Quotation, QuotationsModule, QuotationsSettingsOptions } from '@unchainedshop/types/quotations';
import { emit, registerEvents } from 'meteor/unchained:events';
import { log } from 'meteor/unchained:logger';
import { generateDbFilterById, generateDbMutations } from 'meteor/unchained:utils';
import { QuotationsCollection } from '../db/QuotationsCollection';
import { QuotationsSchema } from '../db/QuotationsSchema';
import { QuotationStatus } from '../db/QuotationStatus';
import { QuotationDirector } from '../quotations-index';
import { quotationsSettings } from '../quotations-settings';

const QUOTATION_EVENTS: string[] = ['QUOTATION_REQUEST_CREATE', 'QUOTATION_REMOVE', 'QUOTATION_UPDATE'];

const buildFindSelector = (query: { userId?: string; queryString?: string } = {}) => {
  const selector: { userId?: string; $text?: any } = {};
  if (query.userId) {
    selector.userId = query.userId;
  }
  if (query.queryString) {
    selector.$text = { $search: query.queryString };
  }

  return selector;
};

const isExpired: QuotationsModule['isExpired'] = (quotation, { referenceDate }) => {
  const relevantDate = referenceDate ? new Date(referenceDate) : new Date();
  const expiryDate = new Date(quotation.expires);
  const isQuotationExpired = relevantDate.getTime() > expiryDate.getTime();
  return isQuotationExpired;
};

export const configureQuotationsModule = async ({
  db,
  options: quotationsOptions = {},
}: ModuleInput<QuotationsSettingsOptions>): Promise<QuotationsModule> => {
  registerEvents(QUOTATION_EVENTS);

  quotationsSettings.configureSettings(quotationsOptions);

  const Quotations = await QuotationsCollection(db);

  const mutations = generateDbMutations<Quotation>(
    Quotations,
    QuotationsSchema,
  ) as ModuleMutations<Quotation>;

  const findNewQuotationNumber = async (quotation: Quotation, index = 0) => {
    // let quotationNumber = null;
    // let i = 0;
    // while (!quotationNumber) {
    const newHashID = quotationsSettings.quotationNumberHashFn(quotation, index);
    if ((await Quotations.countDocuments({ quotationNumber: newHashID }, { limit: 1 })) === 0) {
      return newHashID;
    }
    return findNewQuotationNumber(quotation, index + 1);
    // }
    // return quotationNumber;
  };

  const findNextStatus = async (
    quotation: Quotation,
    requestContext: Context,
  ): Promise<QuotationStatus> => {
    let status = quotation.status as QuotationStatus;
    const director = await QuotationDirector.actions({ quotation }, requestContext);

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
    userId,
  ) => {
    const selector = generateDbFilterById(quotationId);
    const quotation = await Quotations.findOne(selector, {});

    if (quotation.status === status) return quotation;

    const date = new Date();
    const $set: Partial<Quotation> = {
      status,
      updated: new Date(),
      updatedBy: userId,
    };

    switch (status) {
      // explicitly use fallthrough here!
      case QuotationStatus.FULLFILLED:
        if (!quotation.fullfilled) {
          $set.fullfilled = date;
        }
        $set.expires = date;
      case QuotationStatus.PROCESSING: // eslint-disable-line no-fallthrough
        if (!quotation.quotationNumber) {
          $set.quotationNumber = findNewQuotationNumber(quotation);
        }
        break;
      case QuotationStatus.REJECTED:
        $set.expires = date;
        $set.rejected = date;
        break;
      default:
        break;
    }

    const modifier: Update<Quotation> = {
      $set,
      $push: {
        log: {
          date,
          status,
          info,
        },
      },
    };

    log(`New Status: ${status}`, { quotationId });

    await Quotations.updateOne(selector, modifier);

    const updatedQuotation = await Quotations.findOne(selector, {});

    emit('QUOTATION_UPDATE', { quotation, field: 'status' });

    return updatedQuotation;
  };

  const processQuotation = async (
    initialQuotation: Quotation,
    params: { quotationContext?: any },
    requestContext: Context,
  ) => {
    const { modules, userId } = requestContext;

    const quotationId = initialQuotation._id;
    let quotation = initialQuotation;
    let nextStatus = await findNextStatus(quotation, requestContext);
    const director = await QuotationDirector.actions({ quotation }, requestContext);

    if (quotation.status === QuotationStatus.REQUESTED && nextStatus !== QuotationStatus.REQUESTED) {
      await director.submitRequest(params.quotationContext);
    }

    quotation = await modules.quotations.findQuotation({ quotationId });
    nextStatus = await findNextStatus(quotation, requestContext);
    if (nextStatus !== QuotationStatus.PROCESSING) {
      await director.verifyRequest(params.quotationContext);
    }

    quotation = await modules.quotations.findQuotation({ quotationId });
    nextStatus = await findNextStatus(quotation, requestContext);
    if (nextStatus === QuotationStatus.REJECTED) {
      await director.rejectRequest(params.quotationContext);
    }

    quotation = await modules.quotations.findQuotation({ quotationId });
    nextStatus = await findNextStatus(quotation, requestContext);
    if (nextStatus === QuotationStatus.PROPOSED) {
      const proposal = await director.quote();
      quotation = await modules.quotations.updateProposal(quotation._id, proposal, userId);
      nextStatus = await findNextStatus(quotation, requestContext);
    }

    return updateStatus(
      quotation._id,
      { status: nextStatus, info: 'quotation processed' },
      requestContext.userId,
    );
  };

  const sendStatusToCustomer = async (quotation: Quotation, requestContext: Context) => {
    const { modules, userId } = requestContext;

    const user = await modules.users.findUserById(quotation.userId);
    const locale = modules.users.userLocale(user, requestContext);

    await modules.worker.addWork(
      {
        type: 'MESSAGE',
        retries: 0,
        input: {
          locale,
          template: 'QUOTATION_STATUS',
          quotationId: quotation._id,
        },
      },
      userId,
    );

    return quotation;
  };

  const updateQuotationFields =
    (fieldKeys: Array<string>) => async (quotationId: string, values: any, userId?: string) => {
      log(`Update quotation fields ${fieldKeys.join(', ').toUpperCase()}`, {
        quotationId,
        userId,
      });

      const modifier = {
        $set: fieldKeys.reduce((set, key) => ({ ...set, [key]: values[key] }), {}),
      };

      await mutations.update(quotationId, modifier, userId);

      const selector = generateDbFilterById(quotationId);
      const quotation = await Quotations.findOne(selector, {});

      emit('QUOTATION_UPDATE', { quotation, fields: fieldKeys });

      return quotation;
    };

  return {
    // Queries
    count: async (query) => {
      const quotationCount = await Quotations.countDocuments(buildFindSelector(query));
      return quotationCount;
    },

    findQuotation: async ({ quotationId }, options) => {
      const selector = generateDbFilterById(quotationId);
      return Quotations.findOne(selector, options);
    },

    findQuotations: async ({ limit, offset, ...query }, options) => {
      const quotations = Quotations.find(buildFindSelector(query), {
        limit,
        skip: offset,
        ...options,
      });

      return quotations.toArray();
    },

    // Transformations
    normalizedStatus: (quotation) => {
      return quotation.status === null
        ? QuotationStatus.REQUESTED
        : (quotation.status as QuotationStatus);
    },

    isExpired,

    isProposalValid: (quotation) => {
      return quotation.status === QuotationStatus.PROPOSED && !isExpired(quotation);
    },

    // Processing
    fullfillQuotation: async (quotationId, info, requestContext) => {
      const selector = generateDbFilterById(quotationId);
      const quotation = await Quotations.findOne(selector, {});

      if (quotation.status === QuotationStatus.FULLFILLED) return quotation;

      let updatedQuotation = await updateStatus(
        quotation._id,
        {
          status: QuotationStatus.FULLFILLED,
          info: JSON.stringify(info),
        },
        requestContext.userId,
      );

      updatedQuotation = await processQuotation(updatedQuotation, {}, requestContext);

      return sendStatusToCustomer(updatedQuotation, requestContext);
    },

    proposeQuotation: async (quotation, { quotationContext }, requestContext) => {
      if (quotation.status !== QuotationStatus.PROCESSING) return quotation;

      let updatedQuotation = await updateStatus(
        quotation._id,
        {
          status: QuotationStatus.PROPOSED,
          info: 'proposed manually',
        },
        requestContext.userId,
      );

      updatedQuotation = await processQuotation(updatedQuotation, { quotationContext }, requestContext);

      return sendStatusToCustomer(updatedQuotation, requestContext);
    },

    rejectQuotation: async (quotation, { quotationContext }, requestContext) => {
      if (quotation.status === QuotationStatus.FULLFILLED) return quotation;

      let updatedQuotation = await updateStatus(
        quotation._id,
        {
          status: QuotationStatus.REJECTED,
          info: 'rejected manually',
        },
        requestContext.userId,
      );

      updatedQuotation = await processQuotation(updatedQuotation, { quotationContext }, requestContext);

      return sendStatusToCustomer(updatedQuotation, requestContext);
    },

    verifyQuotation: async (quotation, { quotationContext }, requestContext) => {
      if (quotation.status !== QuotationStatus.REQUESTED) return quotation;

      let updatedQuotation = await updateStatus(
        quotation._id,
        {
          status: QuotationStatus.PROCESSING,
          info: 'verified elligibility manually',
        },
        requestContext.userId,
      );

      updatedQuotation = await processQuotation(updatedQuotation, { quotationContext }, requestContext);

      return sendStatusToCustomer(updatedQuotation, requestContext);
    },

    transformItemConfiguration: async (quotation, configuration, requestContext) => {
      const director = await QuotationDirector.actions({ quotation }, requestContext);
      return director.transformItemConfiguration(configuration);
    },

    // Mutations
    create: async ({ countryCode, ...quotationData }, requestContext) => {
      const { services, userId } = requestContext;

      log('Create Quotation', { userId });

      const currency = await services.countries.resolveDefaultCurrencyCode(
        {
          isoCode: countryCode,
        },
        requestContext,
      );

      const quotationId = await mutations.create(
        {
          ...quotationData,
          configuration: quotationData.configuration || [],
          countryCode,
          currency,
          log: [],
          status: QuotationStatus.REQUESTED,
        },
        userId,
      );

      const newQuotation = await Quotations.findOne(generateDbFilterById(quotationId), {});

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
