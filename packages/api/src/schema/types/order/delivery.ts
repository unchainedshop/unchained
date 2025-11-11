export default [
  /* GraphQL */ `
    enum OrderDeliveryStatus {
      """
      Order is not delivered
      """
      OPEN

      """
      Delivery complete
      """
      DELIVERED

      """
      Delivery returned
      """
      RETURNED
    }

    interface OrderDelivery {
      _id: ID!
      provider: DeliveryProvider
      status: OrderDeliveryStatus
      delivered: DateTime
      fee: Price
      discounts: [OrderDeliveryDiscount!]
    }

    type OrderDeliveryPickUp implements OrderDelivery {
      _id: ID!
      provider: DeliveryProvider
      status: OrderDeliveryStatus
      delivered: DateTime
      fee: Price
      discounts: [OrderDeliveryDiscount!]
      pickUpLocations: [PickUpLocation!]!
        @deprecated(reason: "Use DeliveryProvider.pickupLocations instead")
      activePickUpLocation: PickUpLocation
    }

    type OrderDeliveryShipping implements OrderDelivery {
      _id: ID!
      provider: DeliveryProvider
      status: OrderDeliveryStatus
      delivered: DateTime
      fee: Price
      discounts: [OrderDeliveryDiscount!]
      address: Address
    }
  `,
];
