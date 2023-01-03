import configurableProduct from './configurable-product.js';
import simpleProduct from './simple-product.js';
import product from './product.js';
import bundleProduct from './bundle-product.js';
import planProduct from './plan-product.js';
import tokenizedProduct from './tokenized-product.js';

export default [
  ...product,
  ...configurableProduct,
  ...simpleProduct,
  ...bundleProduct,
  ...planProduct,
  ...tokenizedProduct,
];
