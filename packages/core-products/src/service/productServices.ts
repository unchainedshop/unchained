import { removeProductService } from './removeProductService.js';

export const productServices = {
  removeProduct: removeProductService,
};

export type ProductServices = typeof productServices;
