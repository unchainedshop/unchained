import configurableProduct from './configurable-product';
import simpleProduct from './simple-product';
import product from './product';
import bundleProduct from './bundle-product';

export default [
  ...product,
  ...configurableProduct,
  ...simpleProduct,
  ...bundleProduct
];
