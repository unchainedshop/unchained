/**
 * Search Index Worker
 *
 * Event-driven indexing worker that updates search indices via SearchDirector.
 * Uses sliding window debounce with work coalescing to batch updates efficiently.
 *
 * The worker adapter auto-registers at module load time.
 * Event subscriptions are set up by calling initializeSearchIndexing() in setupWorkqueue.
 */

import {
  WorkerAdapter,
  WorkerDirector,
  SearchDirector,
  SearchEntityType,
  type IWorkerAdapter,
  type Modules,
  type Services,
  type ModuleOptions,
} from '@unchainedshop/core';
import type { BulkImporter } from '@unchainedshop/core';
import { subscribe } from '@unchainedshop/events';
import { createLogger } from '@unchainedshop/logger';
import { WorkStatus } from '@unchainedshop/core-worker';

const logger = createLogger('unchained:worker:search-index');

export const SEARCH_INDEX_WORK_TYPE = 'SEARCH_INDEX';
const DEBOUNCE_MS = 500;

export type SearchIndexInput = Record<string, Record<string, string[]>>;

interface UnchainedAPI {
  modules: Modules;
  services: Services;
  bulkImporter: BulkImporter;
  options: ModuleOptions;
}

/**
 * Fetch entity data for indexing based on entity type.
 */
async function fetchEntityData(
  entityType: string,
  entityId: string,
  modules: Modules,
): Promise<Record<string, string | null | undefined> | null> {
  switch (entityType.toUpperCase()) {
    case 'PRODUCT': {
      const product = await modules.products.findProduct({ productId: entityId });
      if (!product) return null;
      return {
        _id: product._id,
        sku: product.warehousing?.sku || '',
        slugs_text: (product.slugs || []).join(' '),
      };
    }

    case 'PRODUCT_TEXT': {
      const texts = await modules.products.texts.findTexts({ productId: entityId });
      if (!texts.length) return null;
      return {
        _id: texts[0]._id,
        productId: entityId,
        title: texts.map((t) => t.title).join(' '),
        subtitle: texts.map((t) => t.subtitle || '').join(' '),
        brand: texts.map((t) => t.brand || '').join(' '),
        vendor: texts.map((t) => t.vendor || '').join(' '),
        description: texts.map((t) => t.description || '').join(' '),
        labels: texts.map((t) => (t.labels || []).join(' ')).join(' '),
        slug: texts.map((t) => t.slug || '').join(' '),
      };
    }

    case 'PRODUCT_REVIEW': {
      const review = await modules.products.reviews.findProductReview({ productReviewId: entityId });
      if (!review) return null;
      return {
        _id: review._id,
        productId: review.productId,
        title: review.title || '',
        review: review.review || '',
      };
    }

    case 'ASSORTMENT': {
      const assortment = await modules.assortments.findAssortment({ assortmentId: entityId });
      if (!assortment) return null;
      return {
        _id: assortment._id,
        slugs_text: (assortment.slugs || []).join(' '),
      };
    }

    case 'ASSORTMENT_TEXT': {
      const texts = await modules.assortments.texts.findTexts({ assortmentId: entityId });
      if (!texts.length) return null;
      return {
        _id: texts[0]._id,
        assortmentId: entityId,
        title: texts.map((t) => t.title).join(' '),
        subtitle: texts.map((t) => t.subtitle || '').join(' '),
      };
    }

    case 'ORDER': {
      const order = await modules.orders.findOrder({ orderId: entityId });
      if (!order) return null;
      return {
        _id: order._id,
        userId: order.userId || '',
        orderNumber: order.orderNumber || '',
        status: order.status || '',
        emailAddress: order.contact?.emailAddress || '',
        telNumber: order.contact?.telNumber || '',
      };
    }

    case 'USER': {
      const user = await modules.users.findUserById(entityId);
      if (!user) return null;
      return { _id: user._id, username: user.username || '' };
    }

    case 'QUOTATION': {
      const quotation = await modules.quotations.findQuotation({ quotationId: entityId });
      if (!quotation) return null;
      return {
        _id: quotation._id,
        userId: quotation.userId || '',
        quotationNumber: quotation.quotationNumber || '',
        status: quotation.status || '',
      };
    }

    case 'ENROLLMENT': {
      const enrollment = await modules.enrollments.findEnrollment({ enrollmentId: entityId });
      if (!enrollment) return null;
      return {
        _id: enrollment._id,
        userId: enrollment.userId || '',
        enrollmentNumber: enrollment.enrollmentNumber || '',
        status: enrollment.status || '',
      };
    }

    case 'FILTER': {
      const filter = await modules.filters.findFilter({ filterId: entityId });
      if (!filter) return null;
      return {
        _id: filter._id,
        key: filter.key || '',
        options: (filter.options || []).join(' '),
      };
    }

    case 'FILTER_TEXT': {
      const texts = await modules.filters.texts.findTexts({ filterId: entityId });
      if (!texts.length) return null;
      return {
        _id: texts[0]._id,
        filterId: entityId,
        title: texts.map((t) => t.title).join(' '),
        subtitle: texts.map((t) => t.subtitle || '').join(' '),
      };
    }

    case 'COUNTRY': {
      const country = await modules.countries.findCountry({ countryId: entityId });
      if (!country) return null;
      return {
        _id: country._id,
        isoCode: country.isoCode || '',
        defaultCurrencyCode: country.defaultCurrencyCode || '',
      };
    }

    case 'CURRENCY': {
      const currency = await modules.currencies.findCurrency({ currencyId: entityId });
      if (!currency) return null;
      return {
        _id: currency._id,
        isoCode: currency.isoCode || '',
        contractAddress: currency.contractAddress || '',
      };
    }

    case 'LANGUAGE': {
      const language = await modules.languages.findLanguage({ languageId: entityId });
      if (!language) return null;
      return { _id: language._id, isoCode: language.isoCode || '' };
    }

    case 'WORK_QUEUE': {
      const work = await modules.worker.findWork({ workId: entityId });
      if (!work) return null;
      return {
        _id: work._id,
        originalWorkId: work.originalWorkId || '',
        type: work.type || '',
        worker: work.worker || '',
        input: JSON.stringify(work.input || {}),
      };
    }

    case 'TOKEN_SURROGATE': {
      const token = await modules.warehousing.findToken({ tokenId: entityId });
      if (!token) return null;
      return {
        _id: token._id,
        tokenSerialNumber: token.tokenSerialNumber || '',
        userId: token.userId || '',
        productId: token.productId || '',
        contractAddress: token.contractAddress || '',
        walletAddress: token.walletAddress || '',
      };
    }

    default:
      return null;
  }
}

/**
 * Search Index Worker - processes batched index updates via SearchDirector
 */
export const SearchIndexWorker: IWorkerAdapter<SearchIndexInput, void> = {
  ...WorkerAdapter,

  key: 'shop.unchained.worker-plugin.search-index',
  label: 'Search Index Worker',
  version: '1.0.0',
  type: SEARCH_INDEX_WORK_TYPE,
  maxParallelAllocations: 1,

  doWork: async (input: SearchIndexInput, unchainedAPI: UnchainedAPI) => {
    const { modules } = unchainedAPI;

    // If input is empty, perform a full re-index of all entities
    if (!input || Object.keys(input).length === 0) {
      logger.info('Empty input - performing full search index rebuild');
      try {
        await rebuildSearchIndexes(modules);
        return {
          success: true,
          result: undefined,
          error: undefined,
        };
      } catch (error) {
        logger.error(`Full re-index failed: ${error}`);
        return {
          success: false,
          result: undefined,
          error: { message: `Full re-index failed: ${error}` },
        };
      }
    }

    // Process specific entity updates from input
    const searchActions = SearchDirector.actions({ queryString: '' }, { modules });

    let totalProcessed = 0;
    let errors = 0;

    for (const [entityType, operations] of Object.entries(input)) {
      const searchEntityType = entityType.toUpperCase() as SearchEntityType;

      for (const [operation, entityIds] of Object.entries(operations)) {
        for (const entityId of entityIds) {
          try {
            if (operation === 'remove') {
              await searchActions.removeEntity(searchEntityType, entityId);
            } else {
              const data = await fetchEntityData(entityType, entityId, modules);
              if (data) {
                await searchActions.indexEntity(searchEntityType, entityId, data);
              }
            }
            totalProcessed++;
          } catch (error) {
            logger.error(`Indexing failed for ${entityType}/${entityId}: ${error}`);
            errors++;
          }
        }
      }
    }

    logger.info(`Search indexing complete: ${totalProcessed} processed, ${errors} errors`);

    return {
      success: errors === 0,
      result: undefined,
      error: errors > 0 ? { message: `${errors} indexing errors occurred` } : undefined,
    };
  },
};

/**
 * Queue search index work with coalescing and debounce.
 */
async function queueSearchIndexWork(
  modules: Modules,
  entityType: string,
  operation: 'create' | 'update' | 'remove',
  entityId: string,
): Promise<void> {
  try {
    const existingWork = await modules.worker.findWorkQueue({
      types: [SEARCH_INDEX_WORK_TYPE],
      status: [WorkStatus.NEW],
      limit: 1,
    });

    const scheduledTime = new Date(Date.now() + DEBOUNCE_MS);

    if (existingWork.length > 0) {
      const work = existingWork[0];
      const input = { ...(work.input as SearchIndexInput) };

      if (!input[entityType]) input[entityType] = {};
      if (!input[entityType][operation]) input[entityType][operation] = [];
      if (!input[entityType][operation].includes(entityId)) {
        input[entityType][operation].push(entityId);
      }

      await modules.worker.deleteWork(work._id);
      await modules.worker.addWork({
        type: SEARCH_INDEX_WORK_TYPE,
        input,
        scheduled: scheduledTime,
      });
    } else {
      await modules.worker.addWork({
        type: SEARCH_INDEX_WORK_TYPE,
        input: { [entityType]: { [operation]: [entityId] } },
        scheduled: scheduledTime,
      });
    }
  } catch (error) {
    logger.error(`Failed to queue search index work: ${error}`);
  }
}

// Event subscription configuration
const EVENT_MAPPINGS: Array<{
  event: string;
  entityType: string;
  operation: 'create' | 'update' | 'remove';
  getId: (payload: any) => string | null;
}> = [
  // Products
  { event: 'PRODUCT_CREATE', entityType: 'PRODUCT', operation: 'create', getId: (p) => p.product?._id },
  { event: 'PRODUCT_UPDATE', entityType: 'PRODUCT', operation: 'update', getId: (p) => p.productId },
  { event: 'PRODUCT_REMOVE', entityType: 'PRODUCT', operation: 'remove', getId: (p) => p.productId },
  {
    event: 'PRODUCT_UPDATE_TEXT',
    entityType: 'PRODUCT_TEXT',
    operation: 'update',
    getId: (p) => p.productId,
  },
  {
    event: 'PRODUCT_REVIEW_CREATE',
    entityType: 'PRODUCT_REVIEW',
    operation: 'create',
    getId: (p) => p.productReview?._id,
  },
  {
    event: 'PRODUCT_UPDATE_REVIEW',
    entityType: 'PRODUCT_REVIEW',
    operation: 'update',
    getId: (p) => p.productReview?._id,
  },
  {
    event: 'PRODUCT_REMOVE_REVIEW',
    entityType: 'PRODUCT_REVIEW',
    operation: 'remove',
    getId: (p) => p.productReviewId,
  },

  // Assortments
  {
    event: 'ASSORTMENT_CREATE',
    entityType: 'ASSORTMENT',
    operation: 'create',
    getId: (p) => p.assortment?._id,
  },
  {
    event: 'ASSORTMENT_UPDATE',
    entityType: 'ASSORTMENT',
    operation: 'update',
    getId: (p) => p.assortmentId,
  },
  {
    event: 'ASSORTMENT_REMOVE',
    entityType: 'ASSORTMENT',
    operation: 'remove',
    getId: (p) => p.assortmentId,
  },
  {
    event: 'ASSORTMENT_UPDATE_TEXT',
    entityType: 'ASSORTMENT_TEXT',
    operation: 'update',
    getId: (p) => p.assortmentId,
  },

  // Orders
  { event: 'ORDER_CREATE', entityType: 'ORDER', operation: 'create', getId: (p) => p.order?._id },
  { event: 'ORDER_UPDATE', entityType: 'ORDER', operation: 'update', getId: (p) => p.orderId },
  { event: 'ORDER_REMOVE', entityType: 'ORDER', operation: 'remove', getId: (p) => p.orderId },

  // Users
  { event: 'USER_CREATE', entityType: 'USER', operation: 'create', getId: (p) => p.userId },
  { event: 'USER_UPDATE', entityType: 'USER', operation: 'update', getId: (p) => p.userId },
  { event: 'USER_REMOVE', entityType: 'USER', operation: 'remove', getId: (p) => p.userId },

  // Quotations
  {
    event: 'QUOTATION_REQUEST_CREATE',
    entityType: 'QUOTATION',
    operation: 'create',
    getId: (p) => p.quotation?._id,
  },
  {
    event: 'QUOTATION_UPDATE',
    entityType: 'QUOTATION',
    operation: 'update',
    getId: (p) => p.quotationId,
  },
  {
    event: 'QUOTATION_REMOVE',
    entityType: 'QUOTATION',
    operation: 'remove',
    getId: (p) => p.quotationId,
  },

  // Enrollments
  {
    event: 'ENROLLMENT_CREATE',
    entityType: 'ENROLLMENT',
    operation: 'create',
    getId: (p) => p.enrollment?._id,
  },
  {
    event: 'ENROLLMENT_UPDATE',
    entityType: 'ENROLLMENT',
    operation: 'update',
    getId: (p) => p.enrollmentId,
  },
  {
    event: 'ENROLLMENT_REMOVE',
    entityType: 'ENROLLMENT',
    operation: 'remove',
    getId: (p) => p.enrollmentId,
  },

  // Filters
  { event: 'FILTER_CREATE', entityType: 'FILTER', operation: 'create', getId: (p) => p.filter?._id },
  { event: 'FILTER_UPDATE', entityType: 'FILTER', operation: 'update', getId: (p) => p.filterId },
  { event: 'FILTER_REMOVE', entityType: 'FILTER', operation: 'remove', getId: (p) => p.filterId },
  {
    event: 'FILTER_UPDATE_TEXT',
    entityType: 'FILTER_TEXT',
    operation: 'update',
    getId: (p) => p.filterId,
  },

  // Countries
  { event: 'COUNTRY_CREATE', entityType: 'COUNTRY', operation: 'create', getId: (p) => p.country?._id },
  { event: 'COUNTRY_UPDATE', entityType: 'COUNTRY', operation: 'update', getId: (p) => p.countryId },
  { event: 'COUNTRY_REMOVE', entityType: 'COUNTRY', operation: 'remove', getId: (p) => p.countryId },

  // Currencies
  {
    event: 'CURRENCY_CREATE',
    entityType: 'CURRENCY',
    operation: 'create',
    getId: (p) => p.currency?._id,
  },
  { event: 'CURRENCY_UPDATE', entityType: 'CURRENCY', operation: 'update', getId: (p) => p.currencyId },
  { event: 'CURRENCY_REMOVE', entityType: 'CURRENCY', operation: 'remove', getId: (p) => p.currencyId },

  // Languages
  {
    event: 'LANGUAGE_CREATE',
    entityType: 'LANGUAGE',
    operation: 'create',
    getId: (p) => p.language?._id,
  },
  { event: 'LANGUAGE_UPDATE', entityType: 'LANGUAGE', operation: 'update', getId: (p) => p.languageId },
  { event: 'LANGUAGE_REMOVE', entityType: 'LANGUAGE', operation: 'remove', getId: (p) => p.languageId },
];

/**
 * Initialize search indexing event handlers.
 * Subscribes to entity events to queue search index work.
 * The worker adapter is auto-registered at module load time.
 */
export function initializeSearchIndexing(modules: Modules): void {
  for (const { event, entityType, operation, getId } of EVENT_MAPPINGS) {
    subscribe(event, async ({ payload }) => {
      const entityId = getId(payload);
      if (entityId) {
        await queueSearchIndexWork(modules, entityType, operation, entityId);
      }
    });
  }

  logger.info('Search indexing event handlers initialized');
}

/**
 * Rebuild all search indexes by indexing all existing entities.
 * Call this after seeding data or to rebuild indexes from scratch.
 */
export async function rebuildSearchIndexes(modules: Modules): Promise<void> {
  const searchActions = SearchDirector.actions({ queryString: '' }, { modules });

  // Products
  const products = await modules.products.findProducts({});
  for (const product of products) {
    const data = await fetchEntityData('PRODUCT', product._id, modules);
    if (data) await searchActions.indexEntity(SearchEntityType.PRODUCT, product._id, data);
  }

  // Product texts (index by productId)
  for (const product of products) {
    const data = await fetchEntityData('PRODUCT_TEXT', product._id, modules);
    if (data) await searchActions.indexEntity(SearchEntityType.PRODUCT_TEXT, product._id, data);
  }

  // Assortments
  const assortments = await modules.assortments.findAssortments({});
  for (const assortment of assortments) {
    const data = await fetchEntityData('ASSORTMENT', assortment._id, modules);
    if (data) await searchActions.indexEntity(SearchEntityType.ASSORTMENT, assortment._id, data);
  }

  // Assortment texts
  for (const assortment of assortments) {
    const data = await fetchEntityData('ASSORTMENT_TEXT', assortment._id, modules);
    if (data) await searchActions.indexEntity(SearchEntityType.ASSORTMENT_TEXT, assortment._id, data);
  }

  // Orders
  const orders = await modules.orders.findOrders({});
  for (const order of orders) {
    const data = await fetchEntityData('ORDER', order._id, modules);
    if (data) await searchActions.indexEntity(SearchEntityType.ORDER, order._id, data);
  }

  // Users
  const users = await modules.users.findUsers({});
  for (const user of users) {
    const data = await fetchEntityData('USER', user._id, modules);
    if (data) await searchActions.indexEntity(SearchEntityType.USER, user._id, data);
  }

  // Filters
  const filters = await modules.filters.findFilters({});
  for (const filter of filters) {
    const data = await fetchEntityData('FILTER', filter._id, modules);
    if (data) await searchActions.indexEntity(SearchEntityType.FILTER, filter._id, data);
  }

  // Filter texts
  for (const filter of filters) {
    const data = await fetchEntityData('FILTER_TEXT', filter._id, modules);
    if (data) await searchActions.indexEntity(SearchEntityType.FILTER_TEXT, filter._id, data);
  }

  // Countries
  const countries = await modules.countries.findCountries({});
  for (const country of countries) {
    const data = await fetchEntityData('COUNTRY', country._id, modules);
    if (data) await searchActions.indexEntity(SearchEntityType.COUNTRY, country._id, data);
  }

  // Currencies
  const currencies = await modules.currencies.findCurrencies({});
  for (const currency of currencies) {
    const data = await fetchEntityData('CURRENCY', currency._id, modules);
    if (data) await searchActions.indexEntity(SearchEntityType.CURRENCY, currency._id, data);
  }

  // Languages
  const languages = await modules.languages.findLanguages({});
  for (const language of languages) {
    const data = await fetchEntityData('LANGUAGE', language._id, modules);
    if (data) await searchActions.indexEntity(SearchEntityType.LANGUAGE, language._id, data);
  }

  // Work queue
  const workItems = await modules.worker.findWorkQueue({});
  for (const work of workItems) {
    const data = await fetchEntityData('WORK_QUEUE', work._id, modules);
    if (data) await searchActions.indexEntity(SearchEntityType.WORK_QUEUE, work._id, data);
  }

  logger.info('Search indexes rebuilt');
}

// Auto-register the search index worker at module load time
// This ensures the SEARCH_INDEX work type is available in the GraphQL schema
WorkerDirector.registerAdapter(SearchIndexWorker);
