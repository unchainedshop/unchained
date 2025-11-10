export default [
  /* GraphQL */ `
    type OrderPickUpLocation {
      _id: ID!
      order: Order!
      name: String!
      address: Address
      geoPoint: GeoPosition
    }
    type PickUpLocation {
      _id: ID!
      name: String!
      address: Address
      geoPoint: GeoPosition
    }
  `,
];
