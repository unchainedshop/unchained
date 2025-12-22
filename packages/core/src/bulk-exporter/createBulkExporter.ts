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
    const type = entity.toUpperCase();
    const exportHandler = bulkOperationHandlers?.[type];

    if (!exportHandler) {
      throw new Error(`Export entity (${entity}) no supported`);
    }

    return {
      validate: async (payload) => {
        logger.debug(`🩺 ${type} * `);
        try {
          if (exportHandler?.payloadSchema) {
            exportHandler.payloadSchema.parse(payload);
          }
        } catch (e) {
          throw new Error(`${type} (${e.message})`);
        }
      },

      execute: async (payload, locales: string[], unchainedApi) => {
        const result = await exportHandler(payload, locales, unchainedApi);
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
