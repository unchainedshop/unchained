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
      """
      Gross amount the order charges for the delivery (fees, discounts and taxes), null while not priced
      """
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
