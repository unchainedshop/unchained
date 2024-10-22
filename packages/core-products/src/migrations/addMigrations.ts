import { mongodb, MigrationRepository } from '@unchainedshop/mongodb';
import { ProductMediaCollection } from '../db/ProductMediaCollection.js';
import { ProductsCollection } from '../db/ProductsCollection.js';

const convertTagsToLowerCase = async (collection: mongodb.Collection<any>) => {
  let bulk = collection.initializeUnorderedBulkOp();
  let count = 0;

  const cursor = await collection.find({ tags: { $regex: '.*[A-Z]' } });
  // eslint-disable-next-line no-restricted-syntax
  for await (const doc of cursor) {
    const transformedTags = doc.tags.map((tag) => tag.toLowerCase());
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

export default function addMigrations(repository: MigrationRepository) {
  repository?.register({
    id: 20220920122600,
    name: 'Convert all tags to lower case to make it easy for search',
    up: async () => {
      const Products = await ProductsCollection(repository.db);
      const ProductMedia = await ProductMediaCollection(repository.db);
      await Promise.all([
        convertTagsToLowerCase(Products.Products),
        convertTagsToLowerCase(ProductMedia.ProductMedias),
      ]);
    },
  });
}
