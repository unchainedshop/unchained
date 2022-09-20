/* eslint-disable no-restricted-syntax */
import { Migration, MigrationRepository } from '@unchainedshop/types/core';

const convertTagsToLowerCase = async (
  repository: MigrationRepository<Migration>,
  collectionName: string,
) => {
  const collection = repository.db.collection(collectionName);

  let bulk = collection.initializeUnorderedBulkOp();
  let count = 0;

  const cursor = collection.find({ tags: { $regex: '.*[A-Z]' } });
  for await (const doc of cursor) {
    const transformedTags = doc.tags.map((t) => t.toLowerCase());
    count += 1;
    bulk.find({ _id: doc._id }).updateOne({ $set: { tags: transformedTags } });
    if (count % 500 === 0) {
      bulk.execute();
      bulk = collection.initializeUnorderedBulkOp();
      count = 0;
    }
  }
  if (count > 0) bulk.execute();
};

export default convertTagsToLowerCase;
