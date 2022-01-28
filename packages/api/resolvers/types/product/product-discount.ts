import crypto from "crypto";
import { ProductDisount, ProductPrice } from "@unchainedshop/types/products";
import { Context } from "@unchainedshop/types/api";

type HelperType<T> = (product: ProductDisount, _: never, context: Context) => T;

export interface ProductDiscountHelperTypes {
  interface: HelperType<{
    _id: string;
    label: string;
    version: string;
    isManualAdditionAllowed: boolean;
    isManualRemovalAllowed: boolean;
  }>;
  total: HelperType<{
    _id: string;
    amount: number;
    currency: string;
  }>;
}

export const ProductDiscount: ProductDiscountHelperTypes = {
  interface(_obj, _, { modules }) {
    const Interface = modules.product.interface();
    if (!Interface) return null;
    return {
      _id: Interface.key,
      label: Interface.label,
      version: Interface.version,
      isManualAdditionAllowed: Interface.isManualAdditionAllowed(),
      isManualRemovalAllowed: Interface.isManualRemovalAllowed(),
    };
  },

  total(obj) {
    const { total } = obj;
    if (total) {
      return {
        _id: crypto
          .createHash("sha256")
          .update([`${obj._id}`, total.amount, total.currency].join(""))
          .digest("hex"),
        amount: total.amount,
        currency: total.currency,
      };
    }
    return null;
  },
};
