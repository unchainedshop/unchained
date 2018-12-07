import configurableProduct from './configurable-product';
import simpleProduct from './simple-product';
import product from './product';

export default [
  ...product,
  ...configurableProduct,
  ...simpleProduct,
];
