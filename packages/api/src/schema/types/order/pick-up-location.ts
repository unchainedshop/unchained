export default [
  /* GraphQL */ `
    type PickUpLocation {
      _id: ID!
      name: String!
      address: Address
      geoPoint: GeoPosition
    }
  `,
];
