import { BulkOperationTooLargeError } from '../../../errors.ts';

export const MAX_BULK_OPERATION_SIZE = 1000;

export interface BulkOperationIds {
  successIds: string[];
  failedIds: string[];
}

export const normalizeBulkIds = (ids: readonly string[]): string[] => {
  if (ids.length > MAX_BULK_OPERATION_SIZE) {
    throw new BulkOperationTooLargeError({ limit: MAX_BULK_OPERATION_SIZE });
  }
  return [...new Set(ids)];
};

export const createBulkOperationResult = ({ successIds, failedIds }: BulkOperationIds) => ({
  successIds,
  successCount: successIds.length,
  failedIds,
  failedCount: failedIds.length,
});
