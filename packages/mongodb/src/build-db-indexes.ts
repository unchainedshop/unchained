import type { Collection, Document, CreateIndexesOptions, IndexSpecification } from 'mongodb';
import { createLogger } from '@unchainedshop/logger';

const logger = createLogger('unchained:mongodb');

export type Indexes = {
  index: IndexSpecification;
  options?: CreateIndexesOptions;
}[];

const buildIndexes = async <T extends Document>(
  collection: Collection<T>,
  indexes: Indexes,
): Promise<Error[]> => {
  const errors = (
    await Promise.all(
      indexes.map(async (indexOptions) => {
        if (!indexOptions) return null;
        const { index, options } = indexOptions;
        try {
          await collection.createIndex(index, options);
          return null;
        } catch (e: any) {
          logger.error(e);
          return e as Error;
        }
      }),
    )
  ).filter(Boolean) as Error[];
  return errors;
};

export const buildDbIndexes = async <T extends Document>(
  collection: Collection<T>,
  indexes: Indexes,
  { rebuild }: { rebuild?: boolean } = {},
) => {
  let success = true;
  const buildErrors = (await buildIndexes<T>(collection, indexes)).filter(Boolean);

  if (buildErrors.length) {
    if (rebuild) {
      try {
        await collection.dropIndexes();
      } catch {
        /* */
      }
    }

    const rebuildErrors = (await buildIndexes<T>(collection, indexes)).filter(Boolean);

    if (rebuildErrors.length) {
      logger.error(`Error building some indexes for ${collection.collectionName}`);
      logger.debug(rebuildErrors);
      success = false;
    }
  }

  return success;
};
