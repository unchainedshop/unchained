---
sidebar_position: 9
sidebar_label: Product pricing
title: Product Pricing
---
:::
Add a product pricing plugins
:::



To manipulate a specific product price or the entire product price in your system you can create a custom plugin by extending
the `ProductPricingAdapter` and registering it on to the `ProductPricingDirector`.

The sample code below will create a custom product price plugin that will round each product price to the next 50th.

```typescript

import {
  ProductPricingAdapter,
  ProductPricingDirector,
} from '@unchainedshop/core-pricing';

const roundToNext = (value) =>
  value % 50 === 50 / 2 ? value + 50 / 2 : value + (50 - (value % 50));

class ProductPriceRound extends ProductPricingAdapter {
  static key = 'shop.unchained.pricing.price-round';

  static version = '1.0';

  static label = 'Round product price to the next precision number';

  static orderIndex = 2;

  static isActivatedFor({ product, currency }) {
    return true;
  }

  async calculate() {
    const { currency, quantity } = this.context;
    const { calculation = [] } = this.calculation;

    if (calculation?.length) {
      const [productPrice] = calculation;
      pricingAdapter.resetCalculation();
      pricingAdapter.resultSheet().addItem({
        amount: roundToNext(productPrice.amount) * quantity,
        isTaxable: productPrice.isTaxable,
        isNetPrice: productPrice.isNetPrice,
        meta: { adapter: this.constructor.key },
      });
    }

    return pricingAdapter.calculate();;
  }
}

ProductPricingDirector.registerAdapter(ProductPriceRound);
```

Explanation:

`ProductPricingAdapter` is responsible for calculating the price of a product whenever it is queried. This is useful in cases where you may have some bushiness logic to be applied to the price of a product such as rounding, currency conversion, discount, tax etc... before any further calculation is made to it or simply presented to the user.
In the above code sample we created a product price plugin that will round every product price to the next 50th digit.
few things to note about extending the `ProductPricingAdapter` :

- `key :` is a unique identifier associated with the specific plugin and two product price adapter can not have an identical value for key
- `orderIndex :` determines the order in which a particular product price adapter should be executed. `ProductPricingAdapter`'s are executed in ascending order of there `orderIndex` value so adapters with the smallest value will be executed first. this is very useful when you have pricing business logics that need to be applied in a certain order. eg. discount should be applied to a product before tax is calculated.
- `isActivatedFor :` returns boolean value that determine if the plugin is active or not. it is passed an object containing `product` & `currency` of the current execution context. This allows you to activate or deactivate by returning `true` or `false` respectively based on your business rule.
- `calculate :` this is the actual function where the manipulation happens. You need to make sure if a `calculation` object exists for this particular product price context before you make any adjustment. Finally call `pricingAdapter.calculate();` after applying your changes so that they can take effect.

Returning `null` from here will stop the execution of any other `ProductPriceAdapter` that may exist in the system so you should always return result of `pricingAdapter.calculate();` call unless you want this behavior.

Next step is registering your `ProductPricingAdapter` on the `ProductPricingDirector` like so:

```typescript
ProductPricingDirector.registerAdapter(ProductPriceRound);
```

Finally you can import this file in the boot file like :

```typescript
import '@unchainedshop/core-pricing/plugins/product-round-price';

startPlatform({...})
```
