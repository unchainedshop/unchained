export const addressToString = (address?: {
  addressLine?: string;
  addressLine2?: string;
  city?: string;
  company?: string;
  countryCode?: string;
  firstName?: string;
  lastName?: string;
  postalCode?: string;
  regionCode?: string;
}): string => {
  if (!address) return '';

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
