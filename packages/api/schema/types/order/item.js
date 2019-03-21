export default [
  /* GraphQL */ `
    enum OrderItemPriceCategory {
      """
      Discount
      """
      DISCOUNT

      """
      Tax
      """
      TAX

      """
      Items
      """
      ITEM
    }

    type OrderItem {
      _id: ID!
      product: Product
      order: Order!
      quantity: Int!
      originalProduct: Product
      quotation: Quotation
      unitPrice: Money
      total(category: OrderItemPriceCategory): Money
      discounts: [OrderItemDiscount!]
      dispatches: [Dispatch!]
      configuration: [ProductConfigurationParameter!]
    }
  `
];
