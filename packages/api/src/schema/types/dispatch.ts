export default [
  /* GraphQL */ `
    type Dispatch {
      deliveryProvider: DeliveryProvider
      warehousingProvider: WarehousingProvider
      shipping: DateTime
      earliestDelivery: DateTime
    }
  `,
];
