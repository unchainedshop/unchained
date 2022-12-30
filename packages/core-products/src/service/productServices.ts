import { ProductServices } from '@unchainedshop/types/products';
import { removeProductService } from './removeProductService.js';

export const productServices: ProductServices = {
  removeProduct: removeProductService,
};
