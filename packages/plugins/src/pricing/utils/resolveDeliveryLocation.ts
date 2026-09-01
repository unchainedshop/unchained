import type { Order, OrderDelivery } from '@unchainedshop/core-orders';

export interface DeliveryLocation {
  countryCode: string | null;
  regionCode: string | null;
}

/**
 * Resolve the location a supply is delivered to (delivery address first,
 * billing address second, the order's country as last resort) — the basis
 * every regional tax adapter uses to decide which jurisdiction taxes the
 * order.
 */
export default function resolveDeliveryLocation({
  orderDelivery,
  order,
  countryCode: forceCountryCode = null,
}: {
  orderDelivery?: OrderDelivery | null;
  order?: Order | null;
  countryCode?: string | null;
}): DeliveryLocation {
  const address = orderDelivery?.context?.address || order?.billingAddress;

  let countryCode = forceCountryCode?.toUpperCase().trim() || order?.countryCode || null;
  if (address?.countryCode && address.countryCode > '') {
    countryCode = address.countryCode.toUpperCase().trim();
  }

  const regionCode = address?.regionCode?.toUpperCase().trim() || null;

  return { countryCode, regionCode };
}
