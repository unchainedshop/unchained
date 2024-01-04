import crypto from 'crypto';
import { Context } from '@unchainedshop/types/api.js';
import { ProductDiscount as ProductDiscountType } from '@unchainedshop/types/products.js';

type HelperType<T> = (product: ProductDiscountType, _: never, context: Context) => T;

export interface ProductDiscountHelperTypes {
  interface: HelperType<
    Promise<{
      _id: string;
      label: string;
      version: string;
      isManualAdditionAllowed: boolean;
      isManualRemovalAllowed: boolean;
    } | null>
  >;
  total: HelperType<{
    _id: string;
    amount: number;
    currency: string;
  } | null>;
}

export const ProductDiscount: ProductDiscountHelperTypes = {
  interface: async (obj, _, { modules }) => {
    const Interface = modules.products.interface(obj);
    if (!Interface) return null;
    return {
      _id: Interface.key,
      label: Interface.label,
      version: Interface.version,
      isManualAdditionAllowed: await Interface.isManualAdditionAllowed(obj.code),
      isManualRemovalAllowed: await Interface.isManualRemovalAllowed(),
    };
  },

  total: (obj) => {
    const { total } = obj;
    if (total) {
      return {
        _id: crypto
          .createHash('sha256')
          .update([`${obj._id}`, total.amount, total.currency].join(''))
          .digest('hex'),
        amount: total.amount,
        currency: total.currency,
      };
    }
    return null;
  },
};
