import { Collection, Document, CreateIndexesOptions, IndexDirection } from 'mongodb';
import { createLogger } from '@unchainedshop/logger';

const logger = createLogger('unchained:mongodb');

export type Indexes<T extends Document> = Array<{
  index: { [key in keyof T]?: IndexDirection }; // TODO: Support key with object path (e.g. 'product.proxy.assignments')
  options?: CreateIndexesOptions;
}>;

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
        logger.error(e);
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
    // try {
    //   const dropError = await collection.dropIndexes();
    // } catch (e) {
    //   /* */
    // }

    // if (!dropError) {
    const rebuildErrors = (await buildIndexes<T>(collection, indexes)).filter(Boolean);

    if (rebuildErrors.length) {
      logger.error(`Error building some indexes for ${collection.collectionName}`);
      logger.debug(rebuildErrors);
      success = false;
    }
    // }
  }

  return success;
};
