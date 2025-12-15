import type { DeliveryProvider } from '@unchainedshop/core-delivery';
import type { Order } from '@unchainedshop/core-orders';
import type { User } from '@unchainedshop/core-users';
import { DeliveryPricingDirector } from '../core-index.ts';
import type { Modules } from '../modules.ts';

export interface SimulatedDeliveryPrice {
  amount: number;
  currencyCode: string;
  countryCode: string;
  isTaxable: boolean;
  isNetPrice: boolean;
}

export async function simulateDeliveryPricingService(
  this: Modules,
  pricingContext: {
    currencyCode: string;
    countryCode: string;
    provider: DeliveryProvider;
    providerContext?: any;
    order: Order;
    user: User;
  },
  options: { useNetPrice?: boolean } = {},
): Promise<SimulatedDeliveryPrice | null> {
  const context = {
    currencyCode: pricingContext.currencyCode,
    countryCode: pricingContext.countryCode,
    provider: pricingContext.provider,
    providerContext: pricingContext.providerContext,
    order: pricingContext.order,
    user: pricingContext.user,
  };

  const calculated = await DeliveryPricingDirector.rebuildCalculation(context, { modules: this });
  if (!calculated?.length) return null;

  const pricing = DeliveryPricingDirector.calculationSheet(context, calculated);
  const orderPrice = pricing.total({ useNetPrice: options.useNetPrice });

  return {
    amount: orderPrice.amount,
    currencyCode: orderPrice.currencyCode,
    countryCode: pricingContext.countryCode,
    isTaxable: pricing.taxSum() > 0,
    isNetPrice: options.useNetPrice || false,
  };
}
