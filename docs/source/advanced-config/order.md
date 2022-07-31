---
title: "Order plugins"
description: Customize order 
---


### OrderDiscountAdapter 


```typescript

import { IDiscountAdapter } from "@unchainedshop/types/discount";
import {
  OrderDiscountDirector,
  OrderDiscountAdapter,
} from "meteor/unchained:core-orders";

const ShopDiscount_TAG = "ShopDiscount";

const ShopDiscount: IDiscountAdapter = {
  ...OrderDiscountAdapter,

  key: "ch.shop.discount.ShopDiscount",
  label: "early bird",
  version: "1.0",
  orderIndex: 1,

  // return true if a discount is allowed to get added manually by a user
  isManualAdditionAllowed: async (code: string): Promise<boolean> => {
    return false;
  },

  // return true if a discount is allowed to get removed manually by a user
  isManualRemovalAllowed: async (): Promise<boolean> => {
    return false;
  },

  actions: async ({ context }: { context: DiscountContext & Context }):  Promise<DiscountAdapterActions> => {
    return {
      ...(await OrderDiscountAdapter.actions({ context })),

      isValidForSystemTriggering: async (): Promise<boolean> => {
    
        return true;
      },

      isValidForCodeTriggering: async (params: { code: string }): Promise<boolean> => {
        return false;
      },

      // returns the appropriate discount context for a calculation adapter
      discountForPricingAdapterKey: ({ pricingAdapterKey }: {
    pricingAdapterKey: string;
    calculationSheet: IPricingSheet<PricingCalculation>): DiscountConfiguration => {
        if (pricingAdapterKey === "shop.unchained.pricing.product-ShopDiscount") {
          return [
            {
              tag: ShopDiscount_TAG,
            },
          ] as any;
        }
        return null;
      },
    };
  },
};

OrderDiscountDirector.registerAdapter(ShopDiscount);



```



### OrderPriceSheet



```typescript

discountForPricingAdapterKey: ({ pricingAdapterKey }: {
    pricingAdapterKey: string;
    calculationSheet: IPricingSheet<PricingCalculation>): DiscountConfiguration => {
if (pricingAdapterKey === 'shop.unchained.artwork-discount') {
      const minimumOrderValue = this.context.orderDiscount?.reservation
        ?.promoCodeConfiguration?.minimumOrderValue;

      const currentPricingSheet = new OrderPricingSheet({
        calculation,
        currency: this.context?.order.currency,
      });

      const maximumDiscountableAmount = currentPricingSheet.total(
        ProductPricingSheetRowCategories.Item,
      )?.amount;

      if (maximumDiscountableAmount > minimumOrderValue) {
        const { fixedRate, rate } =
          this.context?.orderDiscount?.reservation?.promoCodeConfiguration ||
          {};
        if (fixedRate) {
          return { fixedRate };
        }
        return {
          rate: rate || 0.0,
        };
      }
    }
    }

```