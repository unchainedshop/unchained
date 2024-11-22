import { SortDirection, SortOption } from '@unchainedshop/utils';
import { Quotation, QuotationItemConfiguration, QuotationProposal } from '../types.js';
import { emit, registerEvents } from '@unchainedshop/events';
import {
  generateDbFilterById,
  buildSortOptions,
  mongodb,
  generateDbObjectId,
  ModuleInput,
} from '@unchainedshop/mongodb';
import { QuotationsCollection } from '../db/QuotationsCollection.js';
import { QuotationStatus } from '../db/QuotationStatus.js';
import { QuotationDirector } from '../quotations-index.js';
import { quotationsSettings, QuotationsSettingsOptions } from '../quotations-settings.js';
import { resolveBestCurrency } from '@unchainedshop/utils';

export type QuotationQuery = {
  userId?: string;
  queryString?: string;
};
export interface QuotationQueries {
  findQuotation: (query: { quotationId: string }, options?: mongodb.FindOptions) => Promise<Quotation>;
  findQuotations: (
    query: QuotationQuery & {
      limit?: number;
      offset?: number;
      sort?: Array<SortOption>;
    },
    options?: mongodb.FindOptions,
  ) => Promise<Array<Quotation>>;
  count: (query: QuotationQuery) => Promise<number>;
  openQuotationWithProduct: (param: { productId: string }) => Promise<Quotation | null>;
}

// Transformations

export interface QuotationTransformations {
  isExpired: (quotation: Quotation, params?: { referenceDate: Date }) => boolean;
  isProposalValid: (quotation: Quotation) => boolean;
  normalizedStatus: (quotation: Quotation) => string;
}

// Processing

export type QuotationContextParams = (
  quotation: Quotation,
  params: { quotationContext?: any },
  unchainedAPI,
) => Promise<Quotation>;

// Mutations
export interface QuotationData {
  configuration?: Array<{ key: string; value: string }>;
  countryCode?: string;
  productId: string;
  userId: string;
}
export interface QuotationMutations {
  create: (doc: QuotationData, unchainedAPI) => Promise<Quotation>;

  updateContext: (quotationId: string, context: any) => Promise<Quotation | null>;

  updateProposal: (quotationId: string, proposal: QuotationProposal) => Promise<Quotation>;

  updateStatus: (
    quotationId: string,
    params: { status: QuotationStatus; info?: string },
  ) => Promise<Quotation>;
}

export interface QuotationProcessing {
  fullfillQuotation: (quotationId: string, info: any, unchainedAPI) => Promise<Quotation>;
  proposeQuotation: QuotationContextParams;
  rejectQuotation: QuotationContextParams;
  verifyQuotation: QuotationContextParams;
  transformItemConfiguration: (
    quotation: Quotation,
    configuration: QuotationItemConfiguration,
    unchainedAPI,
  ) => Promise<QuotationItemConfiguration>;
}

export type QuotationsModule = QuotationQueries &
  QuotationTransformations &
  QuotationProcessing &
  QuotationMutations;

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

  const findNewQuotationNumber = async (quotation: Quotation, index = 0) => {
    const newHashID = quotationsSettings.quotationNumberHashFn(quotation, index);
    if ((await Quotations.countDocuments({ quotationNumber: newHashID }, { limit: 1 })) === 0) {
      return newHashID;
    }
    return findNewQuotationNumber(quotation, index + 1);
  };

  const findNextStatus = async (quotation: Quotation, unchainedAPI): Promise<QuotationStatus> => {
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

    const updatedQuotation = await Quotations.findOneAndUpdate(selector, modifier, {
      returnDocument: 'after',
    });

    await emit('QUOTATION_UPDATE', { quotation, field: 'status' });

    return updatedQuotation;
  };

  const processQuotation = async (
    initialQuotation: Quotation,
    params: { quotationContext?: any },
    unchainedAPI,
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

  const sendStatusToCustomer = async (quotation: Quotation, unchainedAPI) => {
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
      const quotation = await Quotations.findOneAndUpdate(generateDbFilterById(quotationId), {
        $set: {
          updated: new Date(),
          ...fieldKeys.reduce((set, key) => ({ ...set, [key]: values[key] }), {}),
        },
      });

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
      const { modules } = unchainedAPI;

      const countryObject = await modules.countries.findCountry({ isoCode: countryCode });
      const currencies = await modules.currencies.findCurrencies({ includeInactive: false });
      const currency = resolveBestCurrency(countryObject.defaultCurrencyCode, currencies);

      const { insertedId: quotationId } = await Quotations.insertOne({
        _id: generateDbObjectId(),
        created: new Date(),
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
