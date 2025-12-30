import type { Order, OrderDelivery } from '@unchainedshop/core-orders';

export default function isDeliveryAddressInCountry(
  {
    orderDelivery,
    order,
    countryCode: forceCountryCode = null,
  }: {
    orderDelivery?: OrderDelivery | null;
    order?: Order | null;
    countryCode?: string | null;
  },
  allowedCountryCodes: string[],
) {
  let countryCode = forceCountryCode?.toUpperCase().trim() || order?.countryCode;

  if (orderDelivery || order) {
    const address =
      (orderDelivery?.context as { address?: { countryCode?: string } | null } | null)?.address ||
      order?.billingAddress;
    if (address?.countryCode && address.countryCode > '') {
      countryCode = address.countryCode.toUpperCase().trim();
    }
  }

  if (!countryCode) return false;
  return allowedCountryCodes.includes(countryCode);
}
