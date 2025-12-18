import exportProductsHandler from './handlers/exportProductsHandler.ts';
import exportAssortmentsHandler from './handlers/exportAssortmentsHandler.ts';
import exportFiltersHandler from './handlers/exportFiltersHandler.ts';
import { createLogger } from '@unchainedshop/logger';
import z from 'zod';

const logger = createLogger('unchained:bulk-import');

export interface BulkExportOperationResult {
  entity: string;
  success: boolean;
  files: any;
}
export type BulkExportOperation<T> = { payloadSchema?: z.ZodObject } & ((
  entity: string,
  locales: string[],
  unchainedAPI: T,
) => Promise<BulkExportOperationResult>);

export type BulkExportHandler<T> = BulkExportOperation<T>;

let bulkOperationHandlers: Record<string, BulkExportHandler<any>> = {};

export default function createBulkExporterFactory(bulkExporterOptions: any) {
  bulkOperationHandlers = {
    ASSORTMENTS: exportAssortmentsHandler,
    PRODUCTS: exportProductsHandler,
    FILTERS: exportFiltersHandler,
    ...(bulkExporterOptions?.handlers || {}),
  };

  const createBulkExporter = ({ entity }: { entity: string }) => {
    return {
      validate: async (payload) => {
        const entity = payload.type.toUpperCase();

        logger.debug(`🩺 ${entity} * `);
        try {
          const fn = bulkOperationHandlers[entity];
          if (fn.payloadSchema) {
            fn.payloadSchema.parse(payload);
          }
        } catch (e) {
          throw new Error(`${entity} (${e.message})`);
        }
      },

      execute: async (payload, locales: string[], unchainedApi) => {
        const handler = bulkOperationHandlers[entity];
        const result = await handler(payload, locales, unchainedApi);
        return [result, null];
      },
    };
  };

  return {
    createBulkExporter,
  };
}

export type BulkExporter = ReturnType<typeof createBulkExporterFactory>;

export { exportAssortmentsHandler, exportProductsHandler, exportFiltersHandler };
