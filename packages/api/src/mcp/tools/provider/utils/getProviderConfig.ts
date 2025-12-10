import type { Context } from '../../../../context.ts';
import { PaymentDirector, DeliveryDirector, WarehousingDirector } from '@unchainedshop/core';
import {
  PaymentProviderNotFoundError,
  DeliverProviderNotFoundError,
  WarehousingProviderNotFoundError,
} from '../../../../errors.ts';

export type ProviderType = 'PAYMENT' | 'DELIVERY' | 'WAREHOUSING';

export interface ProviderConfig {
  module: any;
  director: any;
  NotFoundError: any;
  idField: string;
}

export function getProviderConfig(context: Context, providerType: ProviderType): ProviderConfig {
  switch (providerType) {
    case 'PAYMENT':
      return {
        module: context.modules.payment.paymentProviders,
        director: PaymentDirector,
        NotFoundError: PaymentProviderNotFoundError,
        idField: 'paymentProviderId',
      };
    case 'DELIVERY':
      return {
        module: context.modules.delivery,
        director: DeliveryDirector,
        NotFoundError: DeliverProviderNotFoundError,
        idField: 'deliveryProviderId',
      };
    case 'WAREHOUSING':
      return {
        module: context.modules.warehousing,
        director: WarehousingDirector,
        NotFoundError: WarehousingProviderNotFoundError,
        idField: 'warehousingProviderId',
      };
    default:
      throw new Error(`Unknown provider type: ${providerType}`);
  }
}
