export default [
  /* GraphQL */ `
    extend type Query {
      """
      List ticket events (tokenized products). Product managers may include drafts;
      authenticated gate operators only see active events.
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
    }

    extend type Mutation {
      """
      Redeem an eligible ticket for an active event. Requires the scanTicket action.
      """
      scanTicket(tokenId: ID!): Token!

      """
      Cancel a ticket (token). Sets the cancelled flag on the token metadata.
      Requires the cancelTicket action. Optionally generates a discount code for reimbursement.
      """
      cancelTicket(tokenId: ID!, generateDiscount: Boolean): Token!

      """
      Cancel all tickets for an event (tokenized product). Invalidates all non-cancelled tokens.
      Requires the cancelTicket action. Optionally generates discount codes for affected users.
      Returns the number of token records cancelled (a token may contain multiple ticket units).
      """
      cancelEvent(productId: ID!, generateDiscount: Boolean): Int!
    }

    extend type TokenizedProduct {
      isCanceled: Boolean
    }

    """
    Contact details of a ticket holder, as shown on attendee lists
    """
    type TicketAttendee @cacheControl(maxAge: 0, scope: PRIVATE) {
      name: String
      email: String
      phone: String
    }

    extend type Token {
      isCanceled: Boolean

      """
      The current ticket holder. Requires the viewAttendees action: gate operators see
      attendees of active events, product managers also those of draft events.
      """
      attendee: TicketAttendee
    }
  `,
];
