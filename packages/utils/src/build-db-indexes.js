import { log, LogLevel } from 'meteor/unchained:logger';

const buildIndexes = (indexes) =>
  Promise.all(
    indexes.map(async (index) => {
      await index().catch((e) => e);
    })
  );

export const buildDbIndexes = async (collection, indexes) => {
  let success = true;
  const buildErrors = (await buildIndexes(indexes)).filter(Boolean);

  if (buildErrors.length) {
    const dropError = await collection.dropIndexes().catch((e) => e);

    if (!dropError) {
      const rebuildErrors = (await buildIndexes(indexes)).filter(Boolean);

      if (rebuildErrors.length) {
        log('Error building indexes', { level: LogLevel.Error });
        success = false;
      }
    }
  }

  return success;
};
