import { ProductServices } from '@unchainedshop/types/products';
import { removeProductService } from './removeProductService';
import { ercMetadataService } from './ercMetadataService';

export const productServices: ProductServices = {
  removeProduct: removeProductService,
  ercMetadata: ercMetadataService,
};
