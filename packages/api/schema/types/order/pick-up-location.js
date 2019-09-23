export default [
  /* GraphQL */ `
    type OrderPickUpLocation {
      _id: ID!
      order: Order!
      name: String!
      address: Address
      geoPoint: GeoPosition
    }
  `
];
