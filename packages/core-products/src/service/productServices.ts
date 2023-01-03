import { ProductServices } from '@unchainedshop/types/products.js';
import { removeProductService } from './removeProductService.js';

export const productServices: ProductServices = {
  removeProduct: removeProductService,
};
