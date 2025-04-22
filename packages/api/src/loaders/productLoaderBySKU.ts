import { UnchainedCore } from '@unchainedshop/core';
import { Product } from '@unchainedshop/core-products';
import DataLoader from 'dataloader';

export default async (unchainedAPI: UnchainedCore) =>
  new DataLoader<{ sku: string }, Product>(async (queries) => {
    const skus = [...new Set(queries.map((q) => q.sku).filter(Boolean))]; // you don't need lodash, _.unique my ass

    const products = await unchainedAPI.modules.products.findProducts({
      productSelector: {
        'warehousing.sku': { $in: skus },
        status: { $exists: true },
      },
    });

    const productMap = {};
    for (const product of products) {
      productMap[product.warehousing!.sku!] = product;
    }

    return queries.map((q) => productMap[q.sku]);
  });
