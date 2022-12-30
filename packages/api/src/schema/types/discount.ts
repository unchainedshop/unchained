export default [
  /* GraphQL */ `
    type DiscountInterface @cacheControl(maxAge: 180) {
      _id: ID!
      label: String
      version: String
      isManualAdditionAllowed: Boolean
      isManualRemovalAllowed: Boolean
    }
  `,
];
