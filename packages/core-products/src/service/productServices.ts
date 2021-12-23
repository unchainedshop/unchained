import {
  removeProductService,
  RemoveProductService,
} from './removeProductService';

export interface ProductServices {
  removeProductService: RemoveProductService;
}

export const productServices: ProductServices = {
  removeProductService,
};
