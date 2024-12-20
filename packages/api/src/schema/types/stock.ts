export default [
  /* GraphQL */ `
    type Stock {
      deliveryProvider: DeliveryProvider
      warehousingProvider: WarehousingProvider
      quantity: Int
    }
  `,
];
