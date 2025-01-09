---
sidebar_position: 5
title: Order Discounts
sidebar_label: Order discounts
---
:::info
Apply custom discount logic to orders
:::


Order discount adapter is used to add different type of discounts your shop offers based on different input. in order to add order based discount to a shop you need to implement [IDiscountAdapter](https://docs.unchained.shop/types/interfaces/discount.DiscountAdapterActions.html) and register to the global **OrderDiscountDirector** which implements the [IDiscountDirector](https://docs.unchained.shop/types/types/discount.IDiscountDirector.html)


Below is an example of [IDiscountAdapter](https://docs.unchained.shop/types/interfaces/discount.DiscountAdapterActions.html) implementation that adds a discount for all order that have more than 2 products.


```typescript
import { OrderDiscountDirector, OrderDiscountAdapter } from '@unchainedshop/core-orders';
import { ProductDiscountConfiguration } from '@unchainedshop/core-products/director/ProductDiscountConfiguration.js';

const ShopDiscount_TAG = 'ShopDiscount';

const ShopDiscount: IDiscountAdapter<ProductDiscountConfiguration> = {
  ...OrderDiscountAdapter,

  key: 'ch.shop.discount.ShopDiscount',
  label: 'Early Bird',
  version: '1.0.0',
  orderIndex: 1,

  // return true if a discount is allowed to get added manually by a user
  isManualAdditionAllowed: async (code) => {
    return false;
  },

  // return true if a discount is allowed to get removed manually by a user
  isManualRemovalAllowed: async () => {
    return false;
  },

  actions: async ({
    context,
  }) => {
    return {
      isValidForSystemTriggering: async () => {
        return true;
      },

      isValidForCodeTriggering: async (params) => {
        return false;
      },

      // returns the appropriate discount context for a calculation adapter
      discountForPricingAdapterKey: ({
        pricingAdapterKey,
      }) => {
        if (pricingAdapterKey === 'shop.unchained.pricing.product-ShopDiscount') {
          return [
            {
              tag: ShopDiscount_TAG,
            },
          ] as any;
        }
        return null;
      },
      release: () => {},
      reserve: (params): => {
        return null;
      },
    };
  },
};

```

- **isManualAdditionAllowed(code: string)**: return true if the supplied discount code is applicable to an order manually and not system based (automated).
- **isManualRemovalAllowed**: return true if it's possible to remove the discount from an order manually.
- **isValidForSystemTriggering** return true if a discount is valid to be part of the order without input of a user. that could be a time based global discount like a 10% discount day if you return false, this discount will get removed from the order before any price calculation takes place.
- **discountForPricingAdapterKey**: implement this function if you want to apply a discount when an order is using a specific order pricing adapter. returns the appropriate discount context for a calculation adapter
- **release**: Return void, allows you to free up any reservations in backend systems
- **reserve**: Return an arbitrary JSON serializable object with reservation data this method is called when a discount is added through a manual code and let's you manually deduct expendable discounts (coupon balances for ex.) before checkout
- **isValidForCodeTrigger**: return true if a discount is valid to be part of the order. if you return false, this discount will get removed from the order before any price calculation takes place.


```typescript
import {OrderDiscountDirecto} from '@unchainedshop/core-orders'

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