export default [
  /* GraphQL */ `
    extend type Query {
      """
      List all ticket events (tokenized products), by default includes drafts
      """
      ticketEvents(
        queryString: String
        limit: Int = 50
        offset: Int = 0
        includeDrafts: Boolean = true
        sort: [SortOptionInput!]
        onlyInvalidateable: Boolean = false
      ): [Product!]!

      """
      Returns total number of ticket events (tokenized products)
      """
      ticketEventsCount(
        queryString: String
        includeDrafts: Boolean = true
        onlyInvalidateable: Boolean = false
      ): Int!

      """
      Validates a scanner pass code for gate access. Pass code is read from the unchained_gate_passcode cookie (set via authenticateGate mutation).
      Optionally restricted to a specific product.
      """
      isPassCodeValid(productId: ID): Boolean!
    }

    extend type Mutation {
      """
      Cancel a ticket (token). Sets the cancelled flag on the token metadata.
      Optionally generates a discount code for reimbursement.
      """
      cancelTicket(tokenId: ID!, generateDiscount: Boolean): Token!

      """
      Cancel all tickets for an event (tokenized product). Invalidates all non-cancelled tokens.
      Optionally generates discount codes for affected users.
      Returns the number of tickets cancelled.
      """
      cancelEvent(productId: ID!, generateDiscount: Boolean): Int!

      """
      Set or remove the scanner pass code for gate control on a tokenized product.
      Pass null to remove the pass code.
      """
      setEventScannerPassCode(productId: ID!, passCode: String): Product!

      """
      Authenticate gate control by validating a pass code and setting an HttpOnly cookie.
      Returns true if the pass code is valid.
      """
      authenticateGate(passCode: String!): Boolean!

      """
      Deauthenticate gate control by clearing the gate pass code cookie.
      """
      deauthenticateGate: Boolean!
    }

    extend type TokenizedProduct {
      scannerPassCode: String @cacheControl(scope: PRIVATE, maxAge: 0)
    }
  `,
];
