export default [/* GraphQL */`
type ConversionRate {
  sourceCurrency: String
  date: Date!
  quote(targetCurrency: String): Int!
}

type Money {
  amount: Int
  currency: String
}
`];
