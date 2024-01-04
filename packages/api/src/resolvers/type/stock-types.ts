import crypto from 'crypto';
import { DeliveryProvider } from '@unchainedshop/types/delivery.js';
import { Product } from '@unchainedshop/types/products.js';
import { WarehousingProvider } from '@unchainedshop/types/warehousing.js';

export const Stock = {
  _id: (params: {
    product: Product;
    deliveryProvider: DeliveryProvider;
    warehousingProvider: WarehousingProvider;
    referenceDate: Date;
    country: string;
    userId?: string;
  }) =>
    crypto
      .createHash('sha256')
      .update(
        [
          params.product._id,
          params.deliveryProvider._id,
          params.warehousingProvider._id,
          params.referenceDate,
          params.country,
          params.userId || 'ANONYMOUS',
        ].join(''),
      )
      .digest('hex'),
};
