import configurableProduct from './configurable-product';
import simpleProduct from './simple-product';
import product from './product';
import bundleProduct from './bundle-product';
import planProduct from './plan-product';
import tokenizedProduct from './tokenized-product';

export default [
  ...product,
  ...configurableProduct,
  ...simpleProduct,
  ...bundleProduct,
  ...planProduct,
  ...tokenizedProduct,
];
