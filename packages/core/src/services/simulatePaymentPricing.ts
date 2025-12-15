import type { PaymentProvider } from '@unchainedshop/core-payment';
import type { Order } from '@unchainedshop/core-orders';
import type { User } from '@unchainedshop/core-users';
import { PaymentPricingDirector } from '../core-index.ts';
import type { Modules } from '../modules.ts';

export interface SimulatedPaymentPrice {
  amount: number;
  currencyCode: string;
  countryCode: string;
  isTaxable: boolean;
  isNetPrice: boolean;
}

export async function simulatePaymentPricingService(
  this: Modules,
  pricingContext: {
    currencyCode: string;
    countryCode: string;
    provider: PaymentProvider;
    providerContext?: any;
    order?: Order;
    user: User;
  },
  options: { useNetPrice?: boolean } = {},
): Promise<SimulatedPaymentPrice | null> {
  const context = {
    currencyCode: pricingContext.currencyCode,
    countryCode: pricingContext.countryCode,
    provider: pricingContext.provider,
    providerContext: pricingContext.providerContext,
    order: pricingContext.order,
    user: pricingContext.user,
  };

  const calculated = await PaymentPricingDirector.rebuildCalculation(context, { modules: this });
  if (!calculated?.length) return null;

  const pricing = PaymentPricingDirector.calculationSheet(context, calculated);
  const orderPrice = pricing.total({ useNetPrice: options.useNetPrice }) as {
    amount: number;
    currencyCode: string;
  };

  return {
    amount: orderPrice.amount,
    currencyCode: orderPrice.currencyCode,
    countryCode: pricingContext.countryCode,
    isTaxable: pricing.taxSum() > 0,
    isNetPrice: options.useNetPrice || false,
  };
}
