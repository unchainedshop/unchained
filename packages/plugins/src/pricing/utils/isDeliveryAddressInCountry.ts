import type { Order, OrderDelivery } from '@unchainedshop/core-orders';
import resolveDeliveryLocation from './resolveDeliveryLocation.ts';

export default function isDeliveryAddressInCountry(
  params: {
    orderDelivery?: OrderDelivery | null;
    order?: Order | null;
    countryCode?: string | null;
  },
  allowedCountryCodes: string[],
) {
  const { countryCode } = resolveDeliveryLocation(params);
  if (!countryCode) return false;
  return allowedCountryCodes.includes(countryCode);
}
