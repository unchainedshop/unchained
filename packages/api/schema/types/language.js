export default [
  /* GraphQL */ `
    type Language {
      _id: ID!
      """
      ISO 639-1 alpha-2 https://en.wikipedia.org/wiki/List_of_ISO_639-1_codes
      """
      isoCode: String

      isActive: Boolean
      isBase: Boolean
      name: String
    }
  `
];
