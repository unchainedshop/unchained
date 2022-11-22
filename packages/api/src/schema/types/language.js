export default [
  /* GraphQL */ `
    type Language @cacheControl(maxAge: 180) {
      _id: ID!
      """
      ISO 639-1 alpha-2 https://en.wikipedia.org/wiki/List_of_ISO_639-1_codes
      """
      isoCode: String

      isActive: Boolean
      isBase: Boolean
      name: String
    }
  `,
];
