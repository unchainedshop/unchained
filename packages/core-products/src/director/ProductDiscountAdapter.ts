import { IDiscountAdapter } from "@unchainedshop/types/discount";
import { BaseDiscountAdapter } from "meteor/unchained:utils";

export const ProductDiscountAdapter: Omit<
  IDiscountAdapter,
  "key" | "label" | "version"
> = BaseDiscountAdapter;
