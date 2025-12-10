import configurableProduct from './configurable-product.ts';
import simpleProduct from './simple-product.ts';
import product from './product.ts';
import bundleProduct from './bundle-product.ts';
import planProduct from './plan-product.ts';
import tokenizedProduct from './tokenized-product.ts';

export default [
  ...product,
  ...configurableProduct,
  ...simpleProduct,
  ...bundleProduct,
  ...planProduct,
  ...tokenizedProduct,
];
