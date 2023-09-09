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
      product: Product!
      order: Order!
      quantity: Int!
      originalProduct: Product!
      quotation: Quotation
      unitPrice(useNetPrice: Boolean = false): Price
      total(category: OrderItemPriceCategory): Price
      discounts: [OrderItemDiscount!]
      dispatches: [Dispatch!]
      configuration: [ProductConfigurationParameter!]
    }
  `,
];
