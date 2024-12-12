import { DeliveryProvider } from '@unchainedshop/core-delivery';
import { Product } from '@unchainedshop/core-products';
import { WarehousingProvider } from '@unchainedshop/core-warehousing';
import { sha256 } from '@unchainedshop/utils';

export const Stock = {
  _id: async (params: {
    product: Product;
    deliveryProvider: DeliveryProvider;
    warehousingProvider: WarehousingProvider;
    referenceDate: Date;
    country: string;
    userId?: string;
  }) =>
    await sha256(
      [
        params.product._id,
        params.deliveryProvider._id,
        params.warehousingProvider._id,
        params.referenceDate,
        params.country,
        params.userId || 'ANONYMOUS',
      ].join(''),
    ),
};
