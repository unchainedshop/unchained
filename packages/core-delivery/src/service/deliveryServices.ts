import {
  resolveDefaultCurrencyCodeService,
  ResolveDefaultCurrencyCodeService,
} from './resolveDefaultCurrencyCodeService';

export interface DeliveryServices {
  resolveDefaultCurrencyCodeService: ResolveDefaultCurrencyCodeService;
}

export const deliveryServices: DeliveryServices = {
  resolveDefaultCurrencyCodeService,
};
