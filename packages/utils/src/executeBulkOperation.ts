import { createLogger } from '@unchainedshop/logger';

const logger = createLogger('unchained:utils:bulk-operation');

export async function executeBulkOperation<T>(
  ids: readonly T[],
  operation: (id: T) => Promise<unknown>,
): Promise<{ successIds: T[]; failedIds: T[] }> {
  const successIds: T[] = [];
  const failedIds: T[] = [];

  for (const id of new Set(ids)) {
    try {
      await operation(id);
      successIds.push(id);
    } catch (error) {
      failedIds.push(id);
      // Both expected domain rejections (e.g. not-found, linked-to-active-bundle) and
      // unexpected failures land here, so log at debug to keep the reason inspectable
      // without spamming production logs for routine per-entity rejections.
      logger.debug(`Bulk operation failed for entity ${String(id)}`, {
        error: error instanceof Error ? error.message : String(error),
      });
    }
  }

  return { successIds, failedIds };
}
