export default [
  /* GraphQL */ `
    extend type Query {
      """
      List ticket productions (configurable products tagged ticket-production). Requires
      manageProducts; an organizer scope narrows the list for everyone but administrators.
      """
      ticketProductions(
        queryString: String
        limit: Int = 50
        offset: Int = 0
        includeDrafts: Boolean = true
        sort: [SortOptionInput!]
        tags: [LowerCaseString!]
      ): [Product!]!

      "Returns total number of ticket productions, with the filters of ticketProductions"
      ticketProductionsCount(
        queryString: String
        includeDrafts: Boolean = true
        tags: [LowerCaseString!]
      ): Int!

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
        "Only the performances of this production"
        productionId: ID
        "true: only events that are not a performance of a production"
        standalone: Boolean
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
        productionId: ID
        standalone: Boolean
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

      """
      Create a ticket production: a draft CONFIGURABLE_PRODUCT tagged ticket-production with a
      TOKENIZED_PRODUCT per performance and ticket category. Requires manageProducts.
      """
      createTicketProduction(production: CreateTicketProductionInput!): Product!

      "Add a performance (one product per ticket category) to a production"
      addTicketPerformance(productionId: ID!, performance: TicketPerformanceInput!): Product!

      """
      Change the performance starting at startsAt: its start (reschedule), details and sale rules
      (null takes the production value back) and the supply and price per ticket category
      """
      updateTicketPerformance(
        productionId: ID!
        startsAt: DateTime!
        performance: UpdateTicketPerformanceInput!
      ): Product!

      "Remove a performance without tickets from its production; cancel it otherwise"
      removeTicketPerformance(productionId: ID!, startsAt: DateTime!): Product!

      "Publish a production with all its performances"
      publishTicketProduction(productionId: ID!): Product!

      "Take a production with all its performances back to draft"
      unpublishTicketProduction(productionId: ID!): Product!
    }

    """
    Omitted rules stay, null clears one (a performance then inherits it from its production)
    """
    input TicketSaleRulesInput {
      onSale: Boolean
      salesStart: DateTime
      salesEnd: DateTime
      maxPerOrder: Int
    }

    input UpdateTicketEventInput {
      startsAt: DateTime
      location: String
      durationMinutes: Int
      doorsOpenMinutesBefore: Int
      category: String
      saleRules: TicketSaleRulesInput
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
      "The sale rules that apply: the rules of this product completed by those of its production"
      saleRules: TicketSaleRules!
      "The sale rules stored on this product"
      ownSaleRules: TicketSaleRules!
      "Details of a performance that are not taken over from its production"
      overridden: [String!]!
    }

    "Unset rules do not restrict the sale"
    type TicketSaleRules {
      "false closes the sale"
      onSale: Boolean
      salesStart: DateTime
      salesEnd: DateTime
      "The most tickets of this product one order may contain"
      maxPerOrder: Int
    }

    input TicketPriceInput {
      "In the smallest unit of the currency"
      amount: Int!
      currencyCode: String!
      countryCode: String!
      isTaxable: Boolean
      isNetPrice: Boolean
    }

    input TicketCategoryTextInput {
      locale: Locale!
      title: String
    }

    input TicketCategoryInput {
      "Lowercase letters, digits, - and _; the value of the category variation option"
      code: String!
      texts: [TicketCategoryTextInput!]
      "The supply of the category in a new performance"
      capacity: Int
      "The price of the category in a new performance"
      pricing: [TicketPriceInput!]
    }

    "The tickets of one category in one performance, unset values come from the category"
    input TicketPerformanceTicketInput {
      "Omit for productions without categories"
      category: String
      supply: Int
      pricing: [TicketPriceInput!]
    }

    input TicketPerformanceInput {
      startsAt: DateTime!
      location: String
      durationMinutes: Int
      doorsOpenMinutesBefore: Int
      saleRules: TicketSaleRulesInput
      tickets: [TicketPerformanceTicketInput!]
    }

    input UpdateTicketPerformanceInput {
      "A new start reschedules the performance"
      startsAt: DateTime
      location: String
      durationMinutes: Int
      doorsOpenMinutesBefore: Int
      saleRules: TicketSaleRulesInput
      tickets: [TicketPerformanceTicketInput!]
    }

    input CreateTicketProductionInput {
      texts: [ProductTextInput!]!
      tags: [LowerCaseString!]
      location: String
      durationMinutes: Int
      doorsOpenMinutesBefore: Int
      saleRules: TicketSaleRulesInput
      categories: [TicketCategoryInput!]
      performances: [TicketPerformanceInput!]
    }

    type TicketCategoryPrice {
      amount: Int!
      currencyCode: String!
      countryCode: String!
      isTaxable: Boolean
      isNetPrice: Boolean
    }

    type TicketCategory {
      code: String!
      "The category variation option, its texts name the category"
      option: ProductVariationOption
      capacity: Int
      pricing: [TicketCategoryPrice!]!
    }

    """
    The ticketing values of a production. Its performances are the assignments of the configurable
    product, their supply, sales and prices are on the performance products.
    """
    type TicketProduction {
      location: String
      durationMinutes: Int
      doorsOpenMinutesBefore: Int
      "The sale rules of the performances unless they set their own"
      saleRules: TicketSaleRules!
      "In the order of the category variation options"
      categories: [TicketCategory!]!
    }

    extend type ConfigurableProduct {
      "null unless the product is a ticket production"
      ticketProduction: TicketProduction
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
