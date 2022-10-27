import { ProductServices } from '@unchainedshop/types/products';
import { removeProductService } from './removeProductService';

export const productServices: ProductServices = {
  removeProduct: removeProductService,
};
