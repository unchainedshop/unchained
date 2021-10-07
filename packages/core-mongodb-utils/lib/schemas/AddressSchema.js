import SimpleSchema from 'simpl-schema';
export var AddressSchema = new SimpleSchema({
    firstName: String,
    lastName: String,
    company: String,
    addressLine: String,
    addressLine2: String,
    city: String,
    postalCode: String,
    regionCode: String,
    countryCode: String
}, { requiredByDefault: false });
//# sourceMappingURL=AddressSchema.js.map