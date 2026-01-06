import exportProductsHandler from './handlers/exportProductsHandler.ts';
import exportAssortmentsHandler from './handlers/exportAssortmentsHandler.ts';
import exportFiltersHandler from './handlers/exportFiltersHandler.ts';
import { createLogger } from '@unchainedshop/logger';
import { z } from 'zod';
import type { CSVFileResult } from './handlers/generateCSVFileAndUrl.ts';
import exportUsersHandler from './handlers/exportUsersHandler.ts';

const logger = createLogger('unchained:bulk-export');

export const EXPORTS_DIRECTORY = 'exports';

export type ExportFiles = Record<string, CSVFileResult | null>;

export interface BulkExportOperationResult {
  entity: string;
  success: boolean;
  files: ExportFiles;
}

export interface BulkExportHandler<T = unknown> {
  payloadSchema?: z.ZodObject<z.ZodRawShape>;
  (params: Record<string, unknown>, locales: string[], unchainedAPI: T): Promise<ExportFiles>;
}

export interface BulkExporterOptions {
  handlers?: Record<string, BulkExportHandler>;
}

let bulkOperationHandlers: Record<string, BulkExportHandler> = {};

export default function createBulkExporterFactory(bulkExporterOptions?: BulkExporterOptions) {
  bulkOperationHandlers = {
    ASSORTMENTS: exportAssortmentsHandler as unknown as BulkExportHandler,
    PRODUCTS: exportProductsHandler as unknown as BulkExportHandler,
    FILTERS: exportFiltersHandler as unknown as BulkExportHandler,
    USER: exportUsersHandler as unknown as BulkExportHandler,
    ...(bulkExporterOptions?.handlers || {}),
  };

  const createBulkExporter = ({ entity }: { entity: string }) => {
    const type = entity.toUpperCase();
    const exportHandler = bulkOperationHandlers[type];

    if (!exportHandler) {
      throw new Error(`Export entity (${entity}) is not supported`);
    }

    return {
      validate: async (payload: Record<string, unknown>) => {
        logger.debug(`Validating ${type} export payload`);
        try {
          if (exportHandler.payloadSchema) {
            exportHandler.payloadSchema.parse(payload);
          }
        } catch (e) {
          throw new Error(`${type}: ${(e as Error).message}`);
        }
      },

      execute: async <T>(payload: Record<string, unknown>, locales: string[], unchainedApi: T) => {
        const files = await exportHandler(payload, locales, unchainedApi);
        return [{ entity: type, success: true, files }, null];
      },
    };
  };

  return {
    createBulkExporter,
  };
}

export type BulkExporter = ReturnType<typeof createBulkExporterFactory>;

export { exportAssortmentsHandler, exportProductsHandler, exportFiltersHandler };
