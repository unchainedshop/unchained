import { Migration, MigrationRepository } from '@unchainedshop/types/core';
import { convertTagsToLowerCase } from '@unchainedshop/utils';
import { ProductMediaCollection } from '../db/ProductMediaCollection';
import { ProductsCollection } from '../db/ProductsCollection';

export default function addMigrations(repository: MigrationRepository<Migration>) {
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
