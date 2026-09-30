export default [
  /* GraphQL */ `
    extend type Query {
      """
      List ticket events (tokenized products). Product managers may include drafts;
      authenticated gate operators only see active events. An organizer scope narrows the list for
      everyone but administrators. slotFrom and slotTo filter by the event start (inclusive, events
      without a start are left out), tags keeps events carrying all given tags. onlyInvalidateable
      keeps events with a ticket that can be redeemed now; combine it with a slot range, it checks
      the tickets of every event in the range.
      """
      ticketEvents(
        queryString: String
        limit: Int = 50
        offset: Int = 0
        includeDrafts: Boolean = true
        sort: [SortOptionInput!]
        onlyInvalidateable: Boolean = false
        slotFrom: DateTime
        slotTo: DateTime
        tags: [LowerCaseString!]
      ): [Product!]!

      """
      Returns total number of ticket events (tokenized products), with the filters of ticketEvents
      """
      ticketEventsCount(
        queryString: String
        includeDrafts: Boolean = true
        onlyInvalidateable: Boolean = false
        slotFrom: DateTime
        slotTo: DateTime
        tags: [LowerCaseString!]
      ): Int!

      """
      Resolve a scanned or typed ticket code: token id / QR payload, serial within productId, order number, or attendee name within productId.
      A token id or order number may return tickets of other events than productId; compare their product.
      Cancelled and redeemed tickets are included. Requires the gateControl action.
      """
      ticketLookup(code: String!, productId: ID, limit: Int = 10): [Token!]!
    }

    extend type Mutation {
      """
      Redeem an eligible ticket. Requires the scanTicket action. productId is the event this gate
      admits. accessKey is the hash of a scanned ticket QR code: when given, it must match the
      ticket's current access key, so outdated codes (the ticket changed hands) and forged codes
      are refused. Refusals carry extensions.code: TicketAccessKeyInvalidError,
      TicketWrongEventError, TicketCanceledError (scope TICKET or EVENT),
      TicketAlreadyRedeemedError (invalidatedDate) or TicketNotRedeemableError (reason
      EVENT_INACTIVE, NOT_YET_OPEN, ENTRY_CLOSED or NOT_REDEEMABLE). Emits TICKET_REDEEMED.
      """
      scanTicket(tokenId: ID!, productId: ID, accessKey: String): Token!

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

      """
      Set the details of a ticket event (stored in the product meta). Omitted details stay, null
      clears one.
      Requires the manageProducts action.
      """
      updateTicketEvent(productId: ID!, event: UpdateTicketEventInput!): Product!
    }

    input UpdateTicketEventInput {
      startsAt: DateTime
      location: String
      durationMinutes: Int
      doorsOpenMinutesBefore: Int
      category: String
    }

    enum TicketStatus {
      VALID
      REDEEMED
      CANCELLED
    }

    """
    The ticketing values of an event (tokenized product), stored in its product meta. Supply and
    tickets come from the product itself (contractConfiguration, tokens, tokensCount).
    """
    type TicketEvent {
      startsAt: DateTime
      "startsAt + durationMinutes"
      endsAt: DateTime
      "startsAt - doorsOpenMinutesBefore"
      doorsOpenAt: DateTime
      location: String
      durationMinutes: Int
      doorsOpenMinutesBefore: Int
      category: String
      "Set by cancelEvent; the tickets are cancelled as well"
      isCanceled: Boolean!
      cancelledDate: DateTime
    }

    extend type TokenizedProduct {
      event: TicketEvent!
    }

    extend type Token {
      isCanceled: Boolean
      cancelledDate: DateTime
      "CANCELLED wins over REDEEMED: cancelling a ticket also sets invalidatedDate"
      ticketStatus: TicketStatus!
      "The attendee name stored with the ticket when it was issued (ticket issuer ticketMeta hook)"
      attendeeName: String
    }

    extend type Order {
      """
      Order-bound key (x-magic-key header, otp param of the tickets PDF link) that opens the order
      and its tickets without a session; it never expires. Only for the order owner,
      administrators and requests that presented it; null otherwise and for carts.
      """
      magicKey: String @cacheControl(scope: PRIVATE, maxAge: 0)

      """
      Link to the tickets PDF, carrying the magic key. Null when magicKey is null or no PDF
      renderer is registered.
      """
      ticketsPdfUrl(variant: String): String @cacheControl(scope: PRIVATE, maxAge: 0)
    }
  `,
];
