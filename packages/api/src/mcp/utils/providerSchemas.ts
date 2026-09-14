import { z } from 'zod/v4-mini';
import { PaymentProviderType } from '@unchainedshop/core-payment';
import { DeliveryProviderType } from '@unchainedshop/core-delivery';
import { WarehousingProviderType } from '@unchainedshop/core-warehousing';

export const PaymentProviderTypeEnum = z.enum(PaymentProviderType);
export const DeliveryProviderTypeEnum = z.enum(DeliveryProviderType);
export const WarehousingProviderTypeEnum = z.enum(WarehousingProviderType);

export const ProviderSubtypeSchemas = {
  PAYMENT: PaymentProviderTypeEnum,
  DELIVERY: DeliveryProviderTypeEnum,
  WAREHOUSING: WarehousingProviderTypeEnum,
} as const;

export type ProviderType = keyof typeof ProviderSubtypeSchemas;

export const ProviderTypeEnum = z
  .enum(Object.keys(ProviderSubtypeSchemas) as [ProviderType, ...ProviderType[]])
  .check(
    z.describe(
      'Type of provider - PAYMENT for payment processing, DELIVERY for shipping/pickup methods, WAREHOUSING for inventory management',
    ),
  );

export const ProviderSubtypeSchema = z.union(Object.values(ProviderSubtypeSchemas));

export const providerSubtypeDescription = Object.entries(ProviderSubtypeSchemas)
  .map(([category, schema]) => `${category} (${schema.options.join(', ')})`)
  .join(', ');
