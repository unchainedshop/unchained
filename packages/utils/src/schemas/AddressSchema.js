import SimpleSchema from 'simpl-schema';

export const AddressSchema = new SimpleSchema(
  {
    firstName: String,
    lastName: String,
    company: String,
    addressLine: String,
    addressLine2: String,
    city: String,
    postalCode: String,
    regionCode: String,
    countryCode: String,
  },
  { requiredByDefault: false },
);
