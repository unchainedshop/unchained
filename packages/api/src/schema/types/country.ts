export default [
  /* GraphQL */ `
    type Country @cacheControl(maxAge: 180) {
      _id: ID!
      """
      ISO 3166-1 alpha-2 https://en.wikipedia.org/wiki/ISO_3166-1_alpha-2#Officially_assigned_code_elements
      """
      isoCode: String
      isActive: Boolean
      isBase: Boolean
      defaultCurrency: Currency
      flagEmoji: String
      name(forceLocale: Locale): String
    }
  `,
];
