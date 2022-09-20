import { ProductServices } from '@unchainedshop/types/products';
import { removeProductService } from './removeProductService';
import { ercMetadataService } from './ercMetadataService';

export const productServices: ProductServices = {
  removeProductService,
  ercMetadata: ercMetadataService,
};
