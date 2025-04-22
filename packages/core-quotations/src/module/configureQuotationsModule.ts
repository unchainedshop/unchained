import { SortDirection, SortOption } from '@unchainedshop/utils';
import { Quotation, QuotationStatus } from '../db/QuotationsCollection.js';
import { emit, registerEvents } from '@unchainedshop/events';
import {
  generateDbFilterById,
  buildSortOptions,
  mongodb,
  generateDbObjectId,
  ModuleInput,
} from '@unchainedshop/mongodb';
import { QuotationsCollection } from '../db/QuotationsCollection.js';
import { quotationsSettings, QuotationsSettingsOptions } from '../quotations-settings.js';

export type QuotationQuery = {
  userId?: string;
  queryString?: string;
};
export interface QuotationData {
  configuration?: Array<{ key: string; value: string }>;
  countryCode?: string;
  productId: string;
  userId: string;
}

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

export const configureQuotationsModule = async ({
  db,
  options: quotationsOptions = {},
}: ModuleInput<QuotationsSettingsOptions>) => {
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

  const updateStatus = async (
    quotationId: string,
    { status, info = '' }: { status: QuotationStatus; info?: string },
  ): Promise<Quotation> => {
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

  const updateQuotationFields =
    (fieldKeys: Array<string>) =>
    async (quotationId: string, values: any): Promise<Quotation> => {
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
    count: async (query: QuotationQuery): Promise<number> => {
      const quotationCount = await Quotations.countDocuments(buildFindSelector(query));
      return quotationCount;
    },
    openQuotationWithProduct: async ({ productId }: { productId: string }): Promise<Quotation> => {
      const selector: mongodb.Filter<Quotation> = { productId };
      selector.status = { $in: [QuotationStatus.REQUESTED, QuotationStatus.PROPOSED] };

      return Quotations.findOne(selector);
    },

    findQuotation: async (
      { quotationId }: { quotationId: string },
      options?: mongodb.FindOptions<Quotation>,
    ): Promise<Quotation> => {
      const selector = generateDbFilterById(quotationId);
      return Quotations.findOne(selector, options);
    },

    findQuotations: async (
      {
        limit,
        offset,
        sort,
        ...query
      }: QuotationQuery & {
        limit?: number;
        offset?: number;
        sort?: Array<SortOption>;
      },
      options?: mongodb.FindOptions<Quotation>,
    ): Promise<Array<Quotation>> => {
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
    normalizedStatus: (quotation: Quotation): QuotationStatus => {
      return quotation.status === null
        ? QuotationStatus.REQUESTED
        : (quotation.status as QuotationStatus);
    },

    isExpired(quotation: Quotation, { referenceDate }: { referenceDate: Date }) {
      const relevantDate = referenceDate ? new Date(referenceDate) : new Date();
      const expiryDate = new Date(quotation.expires);
      const isQuotationExpired = relevantDate.getTime() > expiryDate.getTime();
      return isQuotationExpired;
    },

    isProposalValid(quotation: Quotation): boolean {
      return quotation.status === QuotationStatus.PROPOSED && !this.isExpired(quotation);
    },

    // Mutations
    create: async ({
      countryCode,
      currencyCode,
      ...quotationData
    }: QuotationData & { currencyCode: string }): Promise<Quotation> => {
      const { insertedId: quotationId } = await Quotations.insertOne({
        _id: generateDbObjectId(),
        created: new Date(),
        ...quotationData,
        configuration: quotationData.configuration || [],
        countryCode,
        currencyCode,
        log: [],
        status: QuotationStatus.REQUESTED,
      });

      const quotation = await Quotations.findOne(generateDbFilterById(quotationId), {});

      await emit('QUOTATION_REQUEST_CREATE', { quotation });

      return quotation;
    },
    deleteRequestedUserQuotations: async (userId: string) => {
      const { deletedCount } = await Quotations.deleteMany({
        userId,
        status: { $in: [QuotationStatus.REQUESTED, null] },
      });
      return deletedCount;
    },
    updateContext: updateQuotationFields(['context']),
    updateProposal: updateQuotationFields(['price', 'expires', 'meta']),

    updateStatus,
  };
};

export type QuotationsModule = Awaited<ReturnType<typeof configureQuotationsModule>>;
