import { ProductDiscount as ProductDiscountType } from '@unchainedshop/core-products';
import { ProductDiscountDirector } from '@unchainedshop/core';
import { sha256 } from '@unchainedshop/utils';

export const ProductDiscount = {
  interface: async (productDiscount: ProductDiscountType) => {
    const Interface = ProductDiscountDirector.getAdapter(productDiscount.discountKey);
    if (!Interface) return null;
    return {
      _id: Interface.key,
      label: Interface.label,
      version: Interface.version,
      isManualAdditionAllowed: await Interface.isManualAdditionAllowed(productDiscount.code),
      isManualRemovalAllowed: await Interface.isManualRemovalAllowed(),
    };
  },

  async total(productDiscount: ProductDiscountType) {
    const { total, _id } = productDiscount;
    if (productDiscount.total) {
      return {
        _id: await sha256([`${_id}`, total.amount, total.currency].join('')),
        amount: total.amount,
        currency: total.currency,
      };
    }
    return null;
  },
};
