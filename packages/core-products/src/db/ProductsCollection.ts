import { Db } from '@unchainedshop/types/common';
import { buildDbIndexes } from 'meteor/unchained:utils';
import { Product, ProductText } from '@unchainedshop/types/products';

export const ProductsCollection = async (db: Db) => {
  const Products = db.collection<Product>('products');
  const ProductTexts = db.collection<ProductText>('product_texts');

  // Product Indexes
  await buildDbIndexes(Products, [
    { index: { sequence: 1 } },
    { index: { slugs: 1 } },
    { index: { status: 1 } },
    { index: { tags: 1 } },
    /* @ts-ignore */
    { index: { 'warehousing.sku': 1 } },
  ]);

  // ProductTexts indexes
  await buildDbIndexes(ProductTexts, [
    { index: { productId: 1 } },
    { index: { locale: 1 } },
    { index: { slug: 1 } },
    { index: { locale: 1, productId: 1 } },
    {
      index: { title: 'text', subtitle: 'text', vendor: 'text', brand: 'text' },
    },
  ]);

  return {
    Products,
    ProductTexts,
  };
};
