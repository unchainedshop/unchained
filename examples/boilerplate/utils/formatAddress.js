export default (address, options = {}) => {
  const { lineDelimiter = ', ' } = options;
  const fullName = [address.firstName, address.lastName]
    .filter(Boolean)
    .join(' ');
  const postalCodeAndCity = [address.postalCode, address.city]
    .filter(Boolean)
    .join(' ');
  return [
    fullName,
    address.addressLine,
    address.addressLine2,
    postalCodeAndCity,
  ]
    .filter(Boolean)
    .join(lineDelimiter);
};
