export default [
  /* GraphQL */ `
    type Dispatch {
      _id: ID!
      deliveryProvider: DeliveryProvider
      warehousingProvider: WarehousingProvider
      shipping: Timestamp
      earliestDelivery: Timestamp
    }
  `,
];
