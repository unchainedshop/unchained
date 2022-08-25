---
title: "Order plugins"
description: Customize order 
---

## 1. OrderPricingAdapter
Order price adapter gives you more control on how you charge based on an order. In order to add custom order pricing logic you first need to implement [IPricingAdapter](https://docs.unchained.shop/types/types/pricing.IPricingAdapter.html)  and register is to the global **OrderPricingDirector** which implements the [IPricingDirector](https://docs.unchained.shop/types/types/pricing.IPricingDirector.html).

There can be more than one order pricing plugin configurations and all of them will be executed based on there `orderIndex` value. Order pricing adapter with lower `orderIndex` will be executed first 

below is an example or IPricingAdapter implementation that will add $50 to each order as service charge


```typescript
import {
  OrderPricingSheet,
  IOrderPricingSheet,
  OrderPricingAdapterContext,
} from '@unchainedshop/types/order';

import { LogOptions } from '@unchainedshop/types/logs';
import { OrderPricingCalculation } from '@unchainedshop/types/orders.pricing';
import { IPricingAdapter, IPricingAdapterActions } from '@unchainedshop/types/pricing';
import { Discount } from '@unchainedshop/types/discount';

export const ShopOrderPricingAdapter: IOrderPricingAdapter = {
  key: 'shop-order-service-pricing',
  label: 'Default service charge price',
  version: '1.0',
  orderIndex: 1,

  isActivatedFor: (context: OrderPricingAdapterContext) => {
    return true;
  },

  log(message: string, options?: LogOptions): void {
    console.log(message);
  },

  actions: (params: {
    calculationSheet: IOrderPricingSheet;
    context: OrderPricingAdapterContext;
    discounts: Discount[];
  }): IPricingAdapterActions<OrderPricingCalculation, OrderPricingAdapterContext> & {
    resultSheet: () => IOrderPricingSheet;
  } => {
    const calculation: OrderPricingCalculation[] = [];
    const { context } = params;
    const { currency } = context;
    const resultSheet = OrderPricingSheet({ currency });

    return {
      calculate: async (): Promise<OrderPricingCalculation[]> => {
        const resultRaw = resultSheet.getRawPricingSheet();
        resultSheet.addPayment({ amount: 100 });
        resultRaw.forEach(
          ({ amount, category }) =>
            ShopOrderPricingAdapter.log(`Order Pricing Calculation -> ${category} ${amount}`),
          resultRaw,
        );
        return resultRaw;
      },
      getContext: (): OrderPricingAdapterContext => params.context,
      resultSheet: () => resultSheet,
      getCalculation: (): OrderPricingCalculation[] => calculation,
    };
  },
};

```

- **isActiveFor(context: [OrderPricingAdapterContext](https://docs.unchained.shop/types/interfaces/orders_pricing.OrderPricingAdapterContext.html))**: Used to activate or de-active a particular order price plugin based on the current context of the order or any other business rule.
- **calculate**: is where the actual calculation of the order price is done based on the calculation items defined for the adapter.
- **getContext**: returns the current order payment price plugin context.
- **resultSheet**: return the price sheet items that are  applied on the price adapter.


```typescript
import {OrderPriceDirector} from '@unchainedshop/core-orders'

OrderPriceDirector.registerAdapter(ShopOrderPricingAdapter)
```

### OrderDiscountAdapter 

Order discount adapter is used to add different type of discounts your shop offers based on different input. in order to add order based discount to a shop you need to implement [IDiscountAdapter](https://docs.unchained.shop/types/interfaces/discount.DiscountAdapterActions.html) and register to the global **OrderDiscountDirector** which implements the [IDiscountDirector](https://docs.unchained.shop/types/types/discount.IDiscountDirector.html)



Below is an example of [IDiscountAdapter](https://docs.unchained.shop/types/interfaces/discount.DiscountAdapterActions.html) implementation that adds a discount for all order that have more than 2 products.


```typescript

import { IDiscountAdapter } from '@unchainedshop/types/discount';
import { OrderDiscountDirector, OrderDiscountAdapter } from '@unchainedshop/core-orders';

const ShopDiscount_TAG = 'ShopDiscount';

const ShopDiscount: IDiscountAdapter = {
  ...OrderDiscountAdapter,

  key: 'ch.shop.discount.ShopDiscount',
  label: 'early bird',
  version: '1.0',
  orderIndex: 1,

  // return true if a discount is allowed to get added manually by a user
  isManualAdditionAllowed: async (code: string): Promise<boolean> => {
    return false;
  },

  // return true if a discount is allowed to get removed manually by a user
  isManualRemovalAllowed: async (): Promise<boolean> => {
    return false;
  },

  actions: async ({
    context,
  }: {
    context: DiscountContext & Context;
  }): Promise<DiscountAdapterActions> => {
    return {
      isValidForSystemTriggering: async (): Promise<boolean> => {
        return true;
      },

      isValidForCodeTriggering: async (params: { code: string }): Promise<boolean> => {
        return false;
      },

      // returns the appropriate discount context for a calculation adapter
      discountForPricingAdapterKey: ({
        pricingAdapterKey,
      }: {
        pricingAdapterKey: string;
        calculationSheet: IPricingSheet<PricingCalculation>;
      }): DiscountConfiguration => {
        if (pricingAdapterKey === 'shop.unchained.pricing.product-ShopDiscount') {
          return [
            {
              tag: ShopDiscount_TAG,
            },
          ] as any;
        }
        return null;
      },
      release: (): Promise<void> => {},
      reserve: (params: { code: string }): Promise<any> => {
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