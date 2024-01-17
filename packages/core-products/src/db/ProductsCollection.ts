import { mongodb, buildDbIndexes } from '@unchainedshop/mongodb';
import { Product, ProductText } from '@unchainedshop/types/products.js';

export const ProductsCollection = async (db: mongodb.Db) => {
  const Products = db.collection<Product>('products');
  const ProductTexts = db.collection<ProductText>('product_texts');

  // Product Indexes
  await buildDbIndexes(Products, [
    { index: { sequence: 1 } },
    { index: { slugs: 1 } },
    { index: { status: 1 } },
    { index: { tags: 1 } },
    { index: { 'warehousing.sku': 1 } },
    {
      index: { 'warehousing.sku': 'text', slugs: 'text' },
      options: {
        name: 'products_fulltext_search',
      },
    } as any,
  ]);

  // ProductTexts indexes
  await buildDbIndexes(ProductTexts, [
    { index: { productId: 1 } },
    { index: { locale: 1 } },
    { index: { slug: 1 } },
    { index: { locale: 1, productId: 1 } },
    {
      index: { title: 'text', subtitle: 'text', vendor: 'text', brand: 'text' },
      options: {
        weights: {
          title: 8,
          subtitle: 6,
          vendor: 5,
          brand: 4,
        },
        name: 'product_texts_fulltext_search',
      },
    },
  ]);

  return {
    Products,
    ProductTexts,
  };
};
