export default [/* GraphQL */`
type Stock {
  _id: ID!
  deliveryProvider: DeliveryProvider
  warehousingProvider: WarehousingProvider
  quantity: Int
}
`];
