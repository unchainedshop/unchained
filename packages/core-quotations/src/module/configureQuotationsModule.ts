import { SortDirection, SortOption } from '@unchainedshop/types/api.js';
import { ModuleInput, ModuleMutations, UnchainedCore } from '@unchainedshop/types/core.js';
import {
  Quotation,
  QuotationQuery,
  QuotationsModule,
  QuotationsSettingsOptions,
} from '@unchainedshop/types/quotations.js';
import { emit, registerEvents } from '@unchainedshop/events';
import { log } from '@unchainedshop/logger';
import {
  generateDbFilterById,
  generateDbMutations,
  buildSortOptions,
  mongodb,
} from '@unchainedshop/mongodb';
import { QuotationsCollection } from '../db/QuotationsCollection.js';
import { QuotationsSchema } from '../db/QuotationsSchema.js';
import { QuotationStatus } from '../db/QuotationStatus.js';
import { QuotationDirector } from '../quotations-index.js';
import { quotationsSettings } from '../quotations-settings.js';

const QUOTATION_EVENTS: string[] = ['QUOTATION_REQUEST_CREATE', 'QUOTATION_REMOVE', 'QUOTATION_UPDATE'];

export const buildFindSelector = (query: QuotationQuery = {}) => {
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
    const newHashID = quotationsSettings.quotationNumberHashFn(quotation, index);
    if ((await Quotations.countDocuments({ quotationNumber: newHashID }, { limit: 1 })) === 0) {
      return newHashID;
    }
    return findNewQuotationNumber(quotation, index + 1);
  };

  const findNextStatus = async (
    quotation: Quotation,
    unchainedAPI: UnchainedCore,
  ): Promise<QuotationStatus> => {
    let status = quotation.status as QuotationStatus;
    const director = await QuotationDirector.actions({ quotation }, unchainedAPI);

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

  const updateStatus: QuotationsModule['updateStatus'] = async (quotationId, { status, info = '' }) => {
    const selector = generateDbFilterById(quotationId);
    const quotation = await Quotations.findOne(selector, {});

    if (quotation.status === status) return quotation;

    const date = new Date();
    const $set: Partial<Quotation> = {
      status,
      updated: new Date(),
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
          $set.quotationNumber = await findNewQuotationNumber(quotation);
        }
        break;
      case QuotationStatus.REJECTED:
        $set.expires = date;
        $set.rejected = date;
        break;
      default:
        break;
    }

    const modifier: mongodb.UpdateFilter<Quotation> = {
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

    await emit('QUOTATION_UPDATE', { quotation, field: 'status' });

    return updatedQuotation;
  };

  const processQuotation = async (
    initialQuotation: Quotation,
    params: { quotationContext?: any },
    unchainedAPI: UnchainedCore,
  ) => {
    const { modules } = unchainedAPI;

    const quotationId = initialQuotation._id;
    let quotation = initialQuotation;
    let nextStatus = await findNextStatus(quotation, unchainedAPI);
    const director = await QuotationDirector.actions({ quotation }, unchainedAPI);

    if (quotation.status === QuotationStatus.REQUESTED && nextStatus !== QuotationStatus.REQUESTED) {
      await director.submitRequest(params.quotationContext);
    }

    quotation = await modules.quotations.findQuotation({ quotationId });
    nextStatus = await findNextStatus(quotation, unchainedAPI);
    if (nextStatus !== QuotationStatus.PROCESSING) {
      await director.verifyRequest(params.quotationContext);
    }

    quotation = await modules.quotations.findQuotation({ quotationId });
    nextStatus = await findNextStatus(quotation, unchainedAPI);
    if (nextStatus === QuotationStatus.REJECTED) {
      await director.rejectRequest(params.quotationContext);
    }

    quotation = await modules.quotations.findQuotation({ quotationId });
    nextStatus = await findNextStatus(quotation, unchainedAPI);
    if (nextStatus === QuotationStatus.PROPOSED) {
      const proposal = await director.quote();
      quotation = await modules.quotations.updateProposal(quotation._id, proposal);
      nextStatus = await findNextStatus(quotation, unchainedAPI);
    }

    return updateStatus(quotation._id, { status: nextStatus, info: 'quotation processed' });
  };

  const sendStatusToCustomer = async (quotation: Quotation, unchainedAPI: UnchainedCore) => {
    const { modules } = unchainedAPI;

    const user = await modules.users.findUserById(quotation.userId);
    const locale = modules.users.userLocale(user);

    await modules.worker.addWork({
      type: 'MESSAGE',
      retries: 0,
      input: {
        locale,
        template: 'QUOTATION_STATUS',
        quotationId: quotation._id,
      },
    });

    return quotation;
  };

  const updateQuotationFields =
    (fieldKeys: Array<string>) => async (quotationId: string, values: any) => {
      log(`Update quotation fields ${fieldKeys.join(', ').toUpperCase()}`, {
        quotationId,
      });

      const modifier = {
        $set: fieldKeys.reduce((set, key) => ({ ...set, [key]: values[key] }), {}),
      };

      await mutations.update(quotationId, modifier);

      const selector = generateDbFilterById(quotationId);
      const quotation = await Quotations.findOne(selector, {});

      await emit('QUOTATION_UPDATE', { quotation, fields: fieldKeys });

      return quotation;
    };

  return {
    // Queries
    count: async (query) => {
      const quotationCount = await Quotations.countDocuments(buildFindSelector(query));
      return quotationCount;
    },
    openQuotationWithProduct: async ({ productId }) => {
      const selector: mongodb.Filter<Quotation> = { productId };
      selector.status = { $in: [QuotationStatus.REQUESTED, QuotationStatus.PROPOSED] };

      return Quotations.findOne(selector);
    },

    findQuotation: async ({ quotationId }, options) => {
      const selector = generateDbFilterById(quotationId);
      return Quotations.findOne(selector, options);
    },

    findQuotations: async ({ limit, offset, sort, ...query }, options) => {
      const defaultSortOption: Array<SortOption> = [{ key: 'created', value: SortDirection.ASC }];
      const quotations = Quotations.find(buildFindSelector(query), {
        limit,
        skip: offset,
        sort: buildSortOptions(sort || defaultSortOption),
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
    fullfillQuotation: async (quotationId, info, unchainedAPI) => {
      const selector = generateDbFilterById(quotationId);
      const quotation = await Quotations.findOne(selector, {});

      if (quotation.status === QuotationStatus.FULLFILLED) return quotation;

      let updatedQuotation = await updateStatus(quotation._id, {
        status: QuotationStatus.FULLFILLED,
        info: JSON.stringify(info),
      });

      updatedQuotation = await processQuotation(updatedQuotation, {}, unchainedAPI);

      return sendStatusToCustomer(updatedQuotation, unchainedAPI);
    },

    proposeQuotation: async (quotation, { quotationContext }, unchainedAPI) => {
      if (quotation.status !== QuotationStatus.PROCESSING) return quotation;

      let updatedQuotation = await updateStatus(quotation._id, {
        status: QuotationStatus.PROPOSED,
        info: 'proposed manually',
      });

      updatedQuotation = await processQuotation(updatedQuotation, { quotationContext }, unchainedAPI);

      return sendStatusToCustomer(updatedQuotation, unchainedAPI);
    },

    rejectQuotation: async (quotation, { quotationContext }, unchainedAPI) => {
      if (quotation.status === QuotationStatus.FULLFILLED) return quotation;

      let updatedQuotation = await updateStatus(quotation._id, {
        status: QuotationStatus.REJECTED,
        info: 'rejected manually',
      });

      updatedQuotation = await processQuotation(updatedQuotation, { quotationContext }, unchainedAPI);

      return sendStatusToCustomer(updatedQuotation, unchainedAPI);
    },

    verifyQuotation: async (quotation, { quotationContext }, unchainedAPI) => {
      if (quotation.status !== QuotationStatus.REQUESTED) return quotation;

      let updatedQuotation = await updateStatus(quotation._id, {
        status: QuotationStatus.PROCESSING,
        info: 'verified elligibility manually',
      });

      updatedQuotation = await processQuotation(updatedQuotation, { quotationContext }, unchainedAPI);

      return sendStatusToCustomer(updatedQuotation, unchainedAPI);
    },

    transformItemConfiguration: async (quotation, configuration, unchainedAPI) => {
      const director = await QuotationDirector.actions({ quotation }, unchainedAPI);
      return director.transformItemConfiguration(configuration);
    },

    // Mutations
    create: async ({ countryCode, ...quotationData }, unchainedAPI) => {
      const { services } = unchainedAPI;

      const currency = await services.countries.resolveDefaultCurrencyCode(
        {
          isoCode: countryCode,
        },
        unchainedAPI,
      );

      const quotationId = await mutations.create({
        ...quotationData,
        configuration: quotationData.configuration || [],
        countryCode,
        currency,
        log: [],
        status: QuotationStatus.REQUESTED,
      });

      const newQuotation = await Quotations.findOne(generateDbFilterById(quotationId), {});

      let quotation = await processQuotation(newQuotation, {}, unchainedAPI);

      quotation = await sendStatusToCustomer(quotation, unchainedAPI);

      await emit('QUOTATION_REQUEST_CREATE', { quotation });

      return quotation;
    },

    updateContext: updateQuotationFields(['context']),
    updateProposal: updateQuotationFields(['price', 'expires', 'meta']),

    updateStatus,
  };
};
