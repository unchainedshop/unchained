import { ProductServices } from '@unchainedshop/types/products.js';
import { removeProductService } from './removeProductService.js';
import { removeUserTracesProductService } from './removeUserTracesService.js';

export const productServices: ProductServices = {
  removeProduct: removeProductService,
  removeUserTraces: removeUserTracesProductService,
};
