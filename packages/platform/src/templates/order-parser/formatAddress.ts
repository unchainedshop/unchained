import type { Address } from '@unchainedshop/mongodb';

export const formatAddress = (address: Address) => {
  return [
    [address.firstName, address.lastName].filter(Boolean).join(' '),
    address.company,
    address.addressLine,
    address.addressLine2,
    [address.postalCode, address.city].filter(Boolean).join(' '),
    address.regionCode,
    [address.countryCode].filter(Boolean).join(''),
  ]
    .filter(Boolean)
    .join('\n');
};
