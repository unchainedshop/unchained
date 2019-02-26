import configurableProduct from './configurable-product';
import simpleProduct from './simple-product';
import product from './product';
import setProduct from './set-product';

export default [...product, ...configurableProduct, ...simpleProduct, ...setProduct];
