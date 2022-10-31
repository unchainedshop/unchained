import { Collection, Indexes, Document } from '@unchainedshop/types/common';
import { log, LogLevel } from '@unchainedshop/logger';

const buildIndexes = <T>(
  collection: Collection<T>,
  indexes: Indexes<T>,
): Promise<Array<false | Error>> =>
  Promise.all(
    indexes.map(async ({ index, options }) => {
      try {
        await collection.createIndex(index, options);
        return false;
      } catch (e: any) {
        return e as Error;
      }
    }),
  );

export const buildDbIndexes = async <T extends Document>(
  collection: Collection<T>,
  indexes: Indexes<T>,
) => {
  let success = true;
  const buildErrors = (await buildIndexes<T>(collection, indexes)).filter(Boolean);

  if (buildErrors.length) {
    const dropError = await collection.dropIndexes().catch((e) => e);

    if (!dropError) {
      const rebuildErrors = (await buildIndexes<T>(collection, indexes)).filter(Boolean);

      if (rebuildErrors.length) {
        log(`Error building some indexes for ${collection.collectionName}`, {
          level: LogLevel.Error,
          ...rebuildErrors,
        });
        success = false;
      }
    }
  }

  return success;
};
