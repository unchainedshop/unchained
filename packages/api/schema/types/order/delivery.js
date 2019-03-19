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
      delivered: Date
      fee: Money
      meta: JSON
    }

    type OrderDeliveryPickUp implements OrderDelivery {
      _id: ID!
      provider: DeliveryProvider
      status: OrderDeliveryStatus
      delivered: Date
      fee: Money
      meta: JSON

      address: Address
    }

    type OrderDeliveryShipping implements OrderDelivery {
      _id: ID!
      provider: DeliveryProvider
      status: OrderDeliveryStatus
      delivered: Date
      fee: Money
      meta: JSON

      address: Address
    }
  `
];
