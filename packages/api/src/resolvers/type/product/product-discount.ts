import { ProductDiscount as ProductDiscountType } from '@unchainedshop/core-products';
import { ProductDiscountDirector } from '@unchainedshop/core';

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

  total(productDiscount: ProductDiscountType) {
    const { total } = productDiscount;
    if (total) {
      return {
        amount: total.amount,
        currencyCode: total.currencyCode,
      };
    }
    return null;
  },
};
