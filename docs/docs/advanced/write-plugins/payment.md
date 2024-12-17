---
sidebar_position: 8
sidebar_label: Payment
title: Payment Providers
---
:::
Customize Payment
:::


 You can add multiple payment method types to a shop such as `CARD` & `INVOICE` but before you can start accepting payment you need to add a payment adapter by implementing the [IPaymentAdapter](https://docs.unchained.shop/types/types/payments.IPaymentAdapter.html) and registering it to the global Payment director that implements the [IPaymentDirector](https://docs.unchained.shop/types/types/payments.IPaymentDirector.html).

Below is an example implementation of `Pre-Paid INVOICE` payment provider type that will require a manual confirmation of order payment 

```typescript

import { IPaymentAdapter } from '@unchainedshop/core-payment';
import {
  PaymentDirector,
  PaymentAdapter,
  PaymentProviderType,
  PaymentError,
} from '@unchainedshop/core-payment';

const ShopPayment: IPaymentAdapter = {
  key: 'ch.Shop.payment',
  label: 'Shop Payment',
  version: '1.0.0',

  initialConfiguration: PaymentConfiguration =  [],

  typeSupported: (type: PaymentProviderType): boolean => {
    return type === PaymentProviderType.INVOICE;
  },

  actions: (params): IPaymentActions => {
    const { context, paymentContext } = params;
    const { order } = paymentContext;
    const { modules } = context;

    return {

      configurationError: (transactionContext?: any): PaymentError => {
        return null;
      },
      isActive: (transactionContext?: any): boolean => {
        return true;
      },

      isPayLaterAllowed: (transactionContext?: any): boolean => {
        return false;
      },
      charge: async (transactionContext?: any):Promise<PaymentChargeActionResult | false> => {
        return false;
      },
      register: async (transactionContext?: any): boolean => {
        return {
          token: '',
        };
      },

      sign: async (transactionContext?: any): Promise<string> => {
        return null;
      },

      validate: async (token?: any): Promise<boolean> => {
        return false;
      },

      cancel: async (transactionContext?: any): Promise<boolean> => {
        return false;
      },

      confirm: async (transactionContext?: any) => {
        return false;
      },

    };
  },
};


```
<!-- - **typeSupported: (type: [PaymentProviderType](https://docs.unchained.shop/types/enums/payments.PaymentProviderType.html))**: Defines what the payment adapter represents.
 - **configurationError**: returns any error that occurred for a payment adapter, could be missing required environment  variable for example
 - **isActive**: Used to disable payment adapter for a given context
 - **isPayLaterAllowed**: if you return true an order can be complete without depending on a payment status if returned false payment needs to be completed for a successful completion of an order
 - **register**: Registers a payment provider
 - **sign**: Used to authenticate user information using there submitted payment provider credential
 - **validate**
 - **cancel**: cancels payment 
  **charge: async (transactionContext?: any):Promise<[PaymentChargeActionResult](https://docs.unchained.shop/types/types/payments.PaymentChargeActionResult.html) | false>**: used for adding charge to the payment provider selected, for example it might be calling the charge API endpoint of a specific card payment provider.
 - **charge**: If you return true, the status will be changed to PAID, if you return false, the order payment status stays the same but the order status might change if you throw an error, you cancel the checkout process 




## Registering payment adapter


In order to register your custom payment adapter for use, you need to register it to the global payment director

```typescript
import { PaymentDirector } from '@unchainedshop/core-payment'

PaymentDirector.registerAdapter(ShopPayment); -->
```