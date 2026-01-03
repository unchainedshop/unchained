/**
 * FTS Index Worker
 *
 * Event-driven indexing worker that updates FTS5 search indices.
 * Uses sliding window debounce with work coalescing to batch updates efficiently.
 *
 * Usage:
 *   import { initializeFTSIndexing } from '@unchainedshop/plugins/worker/fts-index';
 *
 *   // During app initialization (after modules are ready):
 *   initializeFTSIndexing(unchainedAPI);
 */

import {
  WorkerAdapter,
  WorkerDirector,
  type IWorkerAdapter,
  type Modules,
  type Services,
  type ModuleOptions,
} from '@unchainedshop/core';
import type { BulkImporter } from '@unchainedshop/core';
import { subscribe } from '@unchainedshop/events';
import { createLogger } from '@unchainedshop/logger';
import { WorkStatus } from '@unchainedshop/core-worker';
import { getFTS5Db, upsertFTSEntity, deleteFTSEntity } from '../search/fts5-search.ts';

const logger = createLogger('unchained:plugins:fts-index');

export const FTS_INDEX_WORK_TYPE = 'FTS_INDEX';
const DEBOUNCE_MS = 500;

/**
 * Input structure matches bulk import processedOperations format:
 * {
 *   PRODUCT: { create: ['id1'], update: ['id2', 'id3'], remove: ['id4'] },
 *   USER: { create: ['id5'] },
 *   ...
 * }
 */
export type FTSIndexInput = Record<string, Record<string, string[]>>;

interface UnchainedAPI {
  modules: Modules;
  services: Services;
  bulkImporter: BulkImporter;
  options: ModuleOptions;
}

/**
 * Fetch entity data for FTS indexing based on entity type.
 */
async function fetchEntityData(
  entityType: string,
  entityId: string,
  modules: Modules,
): Promise<Record<string, string | null | undefined> | null> {
  const type = entityType.toUpperCase();

  switch (type) {
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
      const productTexts = await modules.products.texts.findTexts({
        productId: entityId,
      });
      // Index all localized texts for this product
      return productTexts.length > 0
        ? {
            _id: productTexts[0]._id,
            productId: entityId,
            title: productTexts.map((t) => t.title).join(' '),
            subtitle: productTexts.map((t) => t.subtitle || '').join(' '),
            brand: productTexts.map((t) => t.brand || '').join(' '),
            vendor: productTexts.map((t) => t.vendor || '').join(' '),
            description: productTexts.map((t) => t.description || '').join(' '),
            labels: productTexts.map((t) => (t.labels || []).join(' ')).join(' '),
            slug: productTexts.map((t) => t.slug || '').join(' '),
          }
        : null;
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
      const assortmentTexts = await modules.assortments.texts.findTexts({
        assortmentId: entityId,
      });
      return assortmentTexts.length > 0
        ? {
            _id: assortmentTexts[0]._id,
            assortmentId: entityId,
            title: assortmentTexts.map((t) => t.title).join(' '),
            subtitle: assortmentTexts.map((t) => t.subtitle || '').join(' '),
          }
        : null;
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
      return {
        _id: user._id,
        username: user.username || '',
      };
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
      const filterTexts = await modules.filters.texts.findTexts({ filterId: entityId });
      return filterTexts.length > 0
        ? {
            _id: filterTexts[0]._id,
            filterId: entityId,
            title: filterTexts.map((t) => t.title).join(' '),
            subtitle: filterTexts.map((t) => t.subtitle || '').join(' '),
          }
        : null;
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
      return {
        _id: language._id,
        isoCode: language.isoCode || '',
      };
    }

    case 'EVENT': {
      // Events don't have a direct module lookup, skip for now
      return null;
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
      const token = await modules.warehousing.findToken({
        tokenId: entityId,
      });
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
      logger.warn(`Unknown entity type for FTS indexing: ${entityType}`);
      return null;
  }
}

/**
 * Map FTS table names to their entity type identifiers
 */
function getTableName(entityType: string): string {
  const mapping: Record<string, string> = {
    PRODUCT: 'products',
    PRODUCT_TEXT: 'product_texts',
    PRODUCT_REVIEW: 'product_reviews',
    ASSORTMENT: 'assortments',
    ASSORTMENT_TEXT: 'assortment_texts',
    ORDER: 'orders',
    USER: 'users',
    QUOTATION: 'quotations',
    ENROLLMENT: 'enrollments',
    FILTER: 'filters',
    FILTER_TEXT: 'filter_texts',
    COUNTRY: 'countries',
    CURRENCY: 'currencies',
    LANGUAGE: 'languages',
    EVENT: 'events',
    WORK_QUEUE: 'work_queue',
    TOKEN_SURROGATE: 'token_surrogates',
  };
  return mapping[entityType.toUpperCase()] || entityType.toLowerCase();
}

/**
 * FTS Index Worker - processes batched index updates
 */
const FTSIndexWorker: IWorkerAdapter<FTSIndexInput, void> = {
  ...WorkerAdapter,

  key: 'shop.unchained.worker-plugin.fts-index',
  label: 'FTS5 Search Index Worker',
  version: '1.0.0',
  type: FTS_INDEX_WORK_TYPE,
  maxParallelAllocations: 1, // Serialize FTS updates

  doWork: async (input: FTSIndexInput, unchainedAPI: UnchainedAPI) => {
    const { modules } = unchainedAPI;
    const ftsDb = getFTS5Db();

    if (!ftsDb) {
      logger.warn('FTS database not initialized, skipping indexing');
      return { success: true };
    }

    let totalProcessed = 0;
    let errors = 0;

    for (const [entityType, operations] of Object.entries(input)) {
      const tableName = getTableName(entityType);

      for (const [operation, entityIds] of Object.entries(operations)) {
        for (const entityId of entityIds) {
          try {
            if (operation === 'remove') {
              await deleteFTSEntity(tableName, entityId);
              logger.debug(`Removed from FTS: ${entityType}/${entityId}`);
            } else {
              // 'create' or 'update' - both upsert
              const data = await fetchEntityData(entityType, entityId, modules);
              if (data) {
                await upsertFTSEntity(tableName, entityId, data);
                logger.debug(`Indexed to FTS: ${entityType}/${entityId}`);
              }
            }
            totalProcessed++;
          } catch (error) {
            logger.error(`FTS indexing failed for ${entityType}/${entityId}: ${error}`);
            errors++;
          }
        }
      }
    }

    logger.info(`FTS indexing complete: ${totalProcessed} processed, ${errors} errors`);

    return {
      success: errors === 0,
      result: undefined,
      error: errors > 0 ? { message: `${errors} indexing errors occurred` } : undefined,
    };
  },
};

/**
 * Queue FTS index work with coalescing and sliding window debounce.
 * Updates existing NEW work item if found, otherwise creates new.
 */
async function queueFTSIndexWork(
  modules: Modules,
  entityType: string,
  operation: 'create' | 'update' | 'remove',
  entityId: string,
): Promise<void> {
  try {
    // Find existing NEW work item for FTS indexing
    const existingWork = await modules.worker.findWorkQueue({
      types: [FTS_INDEX_WORK_TYPE],
      status: [WorkStatus.NEW],
      limit: 1,
    });

    const scheduledTime = new Date(Date.now() + DEBOUNCE_MS);

    if (existingWork.length > 0) {
      const work = existingWork[0];
      const input = { ...(work.input as FTSIndexInput) };

      // Coalesce: add entity to existing work
      if (!input[entityType]) input[entityType] = {};
      if (!input[entityType][operation]) input[entityType][operation] = [];
      if (!input[entityType][operation].includes(entityId)) {
        input[entityType][operation].push(entityId);
      }

      // Slide the window - reschedule with new debounce time
      await modules.worker.rescheduleWork(work, scheduledTime);

      // Update the input (need to use a workaround since rescheduleWork doesn't update input)
      // We'll delete and recreate with merged data
      await modules.worker.deleteWork(work._id);
      await modules.worker.addWork({
        type: FTS_INDEX_WORK_TYPE,
        input,
        scheduled: scheduledTime,
      });

      logger.debug(
        `Coalesced FTS work: ${entityType}/${operation}/${entityId} (${Object.keys(input).length} entity types)`,
      );
    } else {
      // Create new work item
      await modules.worker.addWork({
        type: FTS_INDEX_WORK_TYPE,
        input: {
          [entityType]: { [operation]: [entityId] },
        },
        scheduled: scheduledTime,
      });

      logger.debug(`Queued new FTS work: ${entityType}/${operation}/${entityId}`);
    }
  } catch (error) {
    logger.error(`Failed to queue FTS index work: ${error}`);
  }
}

// Event handler type
interface EventHandler {
  payload: Record<string, unknown>;
}

/**
 * Initialize FTS indexing by registering the worker and subscribing to events.
 * Call after modules are ready.
 */
export function initializeFTSIndexing(modules: Modules): void {
  // Register the worker adapter
  WorkerDirector.registerAdapter(FTSIndexWorker);

  // Product events
  subscribe('PRODUCT_CREATE', async ({ payload }: EventHandler) => {
    const product = payload.product as { _id: string };
    if (product?._id) {
      await queueFTSIndexWork(modules, 'PRODUCT', 'create', product._id);
    }
  });

  subscribe('PRODUCT_UPDATE', async ({ payload }: EventHandler) => {
    const productId = payload.productId as string;
    if (productId) {
      await queueFTSIndexWork(modules, 'PRODUCT', 'update', productId);
    }
  });

  subscribe('PRODUCT_REMOVE', async ({ payload }: EventHandler) => {
    const productId = payload.productId as string;
    if (productId) {
      await queueFTSIndexWork(modules, 'PRODUCT', 'remove', productId);
    }
  });

  // Product text events
  subscribe('PRODUCT_UPDATE_TEXT', async ({ payload }: EventHandler) => {
    const productId = payload.productId as string;
    if (productId) {
      await queueFTSIndexWork(modules, 'PRODUCT_TEXT', 'update', productId);
    }
  });

  // Product review events
  subscribe('PRODUCT_REVIEW_CREATE', async ({ payload }: EventHandler) => {
    const review = payload.productReview as { _id: string };
    if (review?._id) {
      await queueFTSIndexWork(modules, 'PRODUCT_REVIEW', 'create', review._id);
    }
  });

  subscribe('PRODUCT_UPDATE_REVIEW', async ({ payload }: EventHandler) => {
    const review = payload.productReview as { _id: string };
    if (review?._id) {
      await queueFTSIndexWork(modules, 'PRODUCT_REVIEW', 'update', review._id);
    }
  });

  subscribe('PRODUCT_REMOVE_REVIEW', async ({ payload }: EventHandler) => {
    const productReviewId = payload.productReviewId as string;
    if (productReviewId) {
      await queueFTSIndexWork(modules, 'PRODUCT_REVIEW', 'remove', productReviewId);
    }
  });

  // Assortment events
  subscribe('ASSORTMENT_CREATE', async ({ payload }: EventHandler) => {
    const assortment = payload.assortment as { _id: string };
    if (assortment?._id) {
      await queueFTSIndexWork(modules, 'ASSORTMENT', 'create', assortment._id);
    }
  });

  subscribe('ASSORTMENT_UPDATE', async ({ payload }: EventHandler) => {
    const assortmentId = payload.assortmentId as string;
    if (assortmentId) {
      await queueFTSIndexWork(modules, 'ASSORTMENT', 'update', assortmentId);
    }
  });

  subscribe('ASSORTMENT_REMOVE', async ({ payload }: EventHandler) => {
    const assortmentId = payload.assortmentId as string;
    if (assortmentId) {
      await queueFTSIndexWork(modules, 'ASSORTMENT', 'remove', assortmentId);
    }
  });

  // Assortment text events
  subscribe('ASSORTMENT_UPDATE_TEXTS', async ({ payload }: EventHandler) => {
    const assortmentId = payload.assortmentId as string;
    if (assortmentId) {
      await queueFTSIndexWork(modules, 'ASSORTMENT_TEXT', 'update', assortmentId);
    }
  });

  // Order events
  subscribe('ORDER_CREATE', async ({ payload }: EventHandler) => {
    const order = payload.order as { _id: string };
    if (order?._id) {
      await queueFTSIndexWork(modules, 'ORDER', 'create', order._id);
    }
  });

  subscribe('ORDER_UPDATE', async ({ payload }: EventHandler) => {
    const orderId = payload.orderId as string;
    if (orderId) {
      await queueFTSIndexWork(modules, 'ORDER', 'update', orderId);
    }
  });

  subscribe('ORDER_REMOVE', async ({ payload }: EventHandler) => {
    const orderId = payload.orderId as string;
    if (orderId) {
      await queueFTSIndexWork(modules, 'ORDER', 'remove', orderId);
    }
  });

  // User events
  subscribe('USER_CREATE', async ({ payload }: EventHandler) => {
    const userId = payload.userId as string;
    if (userId) {
      await queueFTSIndexWork(modules, 'USER', 'create', userId);
    }
  });

  subscribe('USER_UPDATE', async ({ payload }: EventHandler) => {
    const userId = payload.userId as string;
    if (userId) {
      await queueFTSIndexWork(modules, 'USER', 'update', userId);
    }
  });

  subscribe('USER_REMOVE', async ({ payload }: EventHandler) => {
    const userId = payload.userId as string;
    if (userId) {
      await queueFTSIndexWork(modules, 'USER', 'remove', userId);
    }
  });

  // Quotation events
  subscribe('QUOTATION_CREATE', async ({ payload }: EventHandler) => {
    const quotation = payload.quotation as { _id: string };
    if (quotation?._id) {
      await queueFTSIndexWork(modules, 'QUOTATION', 'create', quotation._id);
    }
  });

  subscribe('QUOTATION_UPDATE', async ({ payload }: EventHandler) => {
    const quotationId = payload.quotationId as string;
    if (quotationId) {
      await queueFTSIndexWork(modules, 'QUOTATION', 'update', quotationId);
    }
  });

  subscribe('QUOTATION_REMOVE', async ({ payload }: EventHandler) => {
    const quotationId = payload.quotationId as string;
    if (quotationId) {
      await queueFTSIndexWork(modules, 'QUOTATION', 'remove', quotationId);
    }
  });

  // Enrollment events
  subscribe('ENROLLMENT_CREATE', async ({ payload }: EventHandler) => {
    const enrollment = payload.enrollment as { _id: string };
    if (enrollment?._id) {
      await queueFTSIndexWork(modules, 'ENROLLMENT', 'create', enrollment._id);
    }
  });

  subscribe('ENROLLMENT_UPDATE', async ({ payload }: EventHandler) => {
    const enrollmentId = payload.enrollmentId as string;
    if (enrollmentId) {
      await queueFTSIndexWork(modules, 'ENROLLMENT', 'update', enrollmentId);
    }
  });

  subscribe('ENROLLMENT_REMOVE', async ({ payload }: EventHandler) => {
    const enrollmentId = payload.enrollmentId as string;
    if (enrollmentId) {
      await queueFTSIndexWork(modules, 'ENROLLMENT', 'remove', enrollmentId);
    }
  });

  // Filter events
  subscribe('FILTER_CREATE', async ({ payload }: EventHandler) => {
    const filter = payload.filter as { _id: string };
    if (filter?._id) {
      await queueFTSIndexWork(modules, 'FILTER', 'create', filter._id);
    }
  });

  subscribe('FILTER_UPDATE', async ({ payload }: EventHandler) => {
    const filterId = payload.filterId as string;
    if (filterId) {
      await queueFTSIndexWork(modules, 'FILTER', 'update', filterId);
    }
  });

  subscribe('FILTER_REMOVE', async ({ payload }: EventHandler) => {
    const filterId = payload.filterId as string;
    if (filterId) {
      await queueFTSIndexWork(modules, 'FILTER', 'remove', filterId);
    }
  });

  // Filter text events
  subscribe('FILTER_UPDATE_TEXTS', async ({ payload }: EventHandler) => {
    const filterId = payload.filterId as string;
    if (filterId) {
      await queueFTSIndexWork(modules, 'FILTER_TEXT', 'update', filterId);
    }
  });

  // Country events
  subscribe('COUNTRY_CREATE', async ({ payload }: EventHandler) => {
    const country = payload.country as { _id: string };
    if (country?._id) {
      await queueFTSIndexWork(modules, 'COUNTRY', 'create', country._id);
    }
  });

  subscribe('COUNTRY_UPDATE', async ({ payload }: EventHandler) => {
    const countryId = payload.countryId as string;
    if (countryId) {
      await queueFTSIndexWork(modules, 'COUNTRY', 'update', countryId);
    }
  });

  subscribe('COUNTRY_REMOVE', async ({ payload }: EventHandler) => {
    const countryId = payload.countryId as string;
    if (countryId) {
      await queueFTSIndexWork(modules, 'COUNTRY', 'remove', countryId);
    }
  });

  // Currency events
  subscribe('CURRENCY_CREATE', async ({ payload }: EventHandler) => {
    const currency = payload.currency as { _id: string };
    if (currency?._id) {
      await queueFTSIndexWork(modules, 'CURRENCY', 'create', currency._id);
    }
  });

  subscribe('CURRENCY_UPDATE', async ({ payload }: EventHandler) => {
    const currencyId = payload.currencyId as string;
    if (currencyId) {
      await queueFTSIndexWork(modules, 'CURRENCY', 'update', currencyId);
    }
  });

  subscribe('CURRENCY_REMOVE', async ({ payload }: EventHandler) => {
    const currencyId = payload.currencyId as string;
    if (currencyId) {
      await queueFTSIndexWork(modules, 'CURRENCY', 'remove', currencyId);
    }
  });

  // Language events
  subscribe('LANGUAGE_CREATE', async ({ payload }: EventHandler) => {
    const language = payload.language as { _id: string };
    if (language?._id) {
      await queueFTSIndexWork(modules, 'LANGUAGE', 'create', language._id);
    }
  });

  subscribe('LANGUAGE_UPDATE', async ({ payload }: EventHandler) => {
    const languageId = payload.languageId as string;
    if (languageId) {
      await queueFTSIndexWork(modules, 'LANGUAGE', 'update', languageId);
    }
  });

  subscribe('LANGUAGE_REMOVE', async ({ payload }: EventHandler) => {
    const languageId = payload.languageId as string;
    if (languageId) {
      await queueFTSIndexWork(modules, 'LANGUAGE', 'remove', languageId);
    }
  });

  logger.info('FTS indexing worker initialized');
}

export default FTSIndexWorker;
