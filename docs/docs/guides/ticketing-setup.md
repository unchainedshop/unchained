---
sidebar_position: 10
title: Event Ticketing Setup
sidebar_label: Event Ticketing
description: Sell event tickets, redeem them at the gate and deliver them as PDF, Apple Wallet and Google Wallet passes with @unchainedshop/ticketing
---

# Event Ticketing Setup

`@unchainedshop/ticketing` turns tokenized products into event tickets:

- **Selling.** A ticket issuer (a warehousing adapter) issues one ticket per seat when an order is confirmed, and an order position validator keeps sales within the event's supply and sale rules.
- **At the gate.** Staff sign in with their own account, look tickets up and redeem them, in the Admin UI (**Ticketing → Gate Control**) or through GraphQL.
- **Managing events.** Event details, cancelling tickets or whole events with cancellation e-mails and optional reimbursement codes.
- **Delivering tickets.** Routes for the tickets PDF, Apple Wallet and Google Wallet, magic-key links that open an order without a session, and helpers for e-mail attachments.

The package draws nothing itself: the PDF and the wallet passes come from renderer functions you write. [Ticket Renderers](./ticketing-renderers) builds all three step by step.

## Installation

```bash
npm install @unchainedshop/ticketing
# Optional: pushes updated Apple Wallet passes to the devices that saved them
npm install @parse/node-apn
```

The Admin UI plugin needs `@unchainedshop/admin-ui` (an optional peer). The HTTP routes are served by `connect()` of `@unchainedshop/api/express` or `@unchainedshop/api/fastify`; nothing framework-specific is imported from the ticketing package.

| Variable | Default | Description |
|----------|---------|-------------|
| `UNCHAINED_SECRET` | - | **Required.** Derives the magic keys of orders; the engine does not start without it (`TICKETING_SECRET_MISSING`). Changing it revokes all magic-key links. |
| `ROOT_URL` | `http://localhost:4010` | Public URL of the engine, used for ticket and wallet links |
| `UNCHAINED_PDF_PRINT_HANDLER_PATH` | `/rest/print_tickets` | Tickets PDF route |
| `GOOGLE_WALLET_WEBSERVICE_PATH` | `/rest/google-wallet` | Google Wallet route |
| `APPLE_WALLET_WEBSERVICE_PATH` | `/rest/apple-wallet` | Apple Wallet download and PassKit web service; issued passes keep this URL |
| `PASS_CERTIFICATE_PATH`, `PASS_CERTIFICATE_SECRET` | - | PEM with the Apple pass certificate and key, and its passphrase, for push updates (see [Ticket Renderers](./ticketing-renderers#certificates)) |
| `DISCOUNT_CODE_SECRET` | - | 32 bytes as hex (`openssl rand -hex 32`) to sign reimbursement codes; see [Cancellations](#cancellations-and-reimbursement-codes) |
| `EMAIL_FROM`, `EMAIL_WEBSITE_NAME`, `EMAIL_WEBSITE_URL` | - | Used by the cancellation e-mails, read when a message is built |

The route paths are read when `createTicketingPlugin()` is called, so load your environment before.

## Setup

Mirrors [`examples/ticketing/boot.ts`](https://github.com/unchainedshop/unchained/tree/master/examples/ticketing):

```ts
import Fastify from 'fastify';
import { startPlatform } from '@unchainedshop/platform';
import { registerBasePlugins } from '@unchainedshop/plugins/presets/base';
import { pluginRegistry } from '@unchainedshop/core';
import { connect, unchainedLogger } from '@unchainedshop/api/fastify';
import {
  createTicketingPlugin,
  validateTicketOrderPosition,
  withTicketing,
} from '@unchainedshop/ticketing';
import { createTicketWarehousingPlugin } from '@unchainedshop/ticketing/warehousing/ticket';
import { ticketingAdminPlugin } from '@unchainedshop/ticketing/admin-plugin';

const fastify = Fastify({ loggerInstance: unchainedLogger('fastify'), trustProxy: true });

registerBasePlugins();

// Passes module, PDF and wallet routes, magic keys, cancellation e-mails
pluginRegistry.register(
  createTicketingPlugin({
    renderOrderPDF, // your renderers, see Ticket Renderers; routes answer 404 without them
    createAppleWalletPass,
    createGoogleWalletPass,
  }),
);

// The ticket issuer, with the attendee name each ticket carries
pluginRegistry.register(
  createTicketWarehousingPlugin({
    ticketMeta: ({ orderPosition, index }) => {
      const attendees = orderPosition.configuration?.find(({ key }) => key === 'attendees')?.value?.split(',');
      const attendeeName = attendees?.[index]?.trim();
      return attendeeName ? { attendeeName } : undefined;
    },
  }),
);

const platform = await startPlatform(
  // GraphQL schema, services, actions and the `ticketing` role
  withTicketing({
    options: { orders: { validateOrderPosition: validateTicketOrderPosition } },
  }),
);

// Mounts the plugin routes, including the ticketing routes, before the Admin UI
await connect(fastify, platform, {
  adminUI: { plugins: [ticketingAdminPlugin()] },
});

await fastify.listen({ host: '::', port: 4010 });
```

With Express, use `connect(app, platform, …)` from `@unchainedshop/api/express`; the rest is identical.

What each piece does:

| Piece | From | Does |
|-------|------|------|
| `createTicketingPlugin(options)` | `@unchainedshop/ticketing` | Adds the `passes` module (magic keys, ticket serials and counts, Apple pass files, reimbursement codes), the [routes](#rest-routes), the magic-key permission rules, the `EVENT_CANCELLED` / `TICKET_CANCELLED` e-mail templates (only if you did not register your own) and, with an Apple renderer, the re-rendering of passes of redeemed and cancelled tickets. Options: `renderOrderPDF`, `createAppleWalletPass`, `createGoogleWalletPass`, `discountCode`. |
| `TicketWarehousingPlugin` / `createTicketWarehousingPlugin({ ticketMeta })` | `@unchainedshop/ticketing/warehousing/ticket` | The ticket issuer (adapter key `shop.unchained.warehousing.ticket`), see [below](#the-ticket-issuer). |
| `withTicketing(platformOptions, { canAccessEvent })` | `@unchainedshop/ticketing` | Merges the ticketing GraphQL type definitions, resolvers, services, the actions `scanTicket`, `gateControl`, `cancelTicket` and the `ticketing` role into your `startPlatform` options. Your own entries win. `canAccessEvent` sets an [organizer scope](#organizer-scope). |
| `validateTicketOrderPosition` / `createTicketOrderPositionValidator({ getSaleRules })` | `@unchainedshop/ticketing` | Keeps ticket sales within the supply and your sale rules, see [Selling tickets](#selling-tickets). |
| `ticketingAdminPlugin()` | `@unchainedshop/ticketing/admin-plugin` | Adds the **Ticketing** menu (Events, Gate Control) to the Admin UI. |

Register the plugins before `startPlatform`. Do not also pass `modules: ticketingModules`: the plugin already provides the `passes` module.

## The ticket issuer

Tickets are issued by a warehousing provider of type `VIRTUAL` with the adapter key `shop.unchained.warehousing.ticket`. Create exactly one: every active `VIRTUAL` provider issues tokens for a tokenized product, so an ETH minter provider next to it issues every ticket twice, and only the first provider decides whether a ticket can be redeemed.

Create it in the Admin UI (**System settings → Warehousing provider**), with the `createWarehousingProvider` mutation, or in your seed:

```ts
import { WarehousingProviderType } from '@unchainedshop/core-warehousing';
import { TICKET_WAREHOUSING_ADAPTER_KEY } from '@unchainedshop/ticketing/warehousing/ticket';

await modules.warehousing.create({
  adapterKey: TICKET_WAREHOUSING_ADAPTER_KEY,
  type: WarehousingProviderType.VIRTUAL,
  // A seed has to set the configuration itself; only the mutation and the Admin UI apply the defaults.
  configuration: [
    { key: 'entryOpensMinutesBefore', value: '120' },
    { key: 'entryClosesMinutesAfter', value: '60' },
    { key: 'serialOffset', value: '0' },
  ],
});
```

| Configuration | Default | Meaning |
|---------------|---------|---------|
| `entryOpensMinutesBefore` | `120` | Tickets can be redeemed from this many minutes before the event start. Empty: no limit. |
| `entryClosesMinutesAfter` | `60` | …until this many minutes after it. Empty: no limit. Events without a start can always be redeemed. |
| `serialOffset` | `0` | Serial numbers of an event start after this number. Only applies to events that have no numbered tickets yet; `-1` starts at 0. |

What the issuer does:

- **One ticket per seat.** An order position of 3 tickets becomes 3 tokens with quantity 1, each with its own serial number. Serials come from an atomic counter per event: they are unique and increasing even with concurrent checkouts, but not necessarily without gaps. The counter continues after the highest serial an event already has.
- **Ticket metadata.** `token.meta` holds the `orderId` and whatever your `ticketMeta` hook returns. `ticketMeta({ order, orderPosition, product, index }, { modules })` runs once per seat (`index` counts from 0). Return `{ attendeeName }` to show gate staff a name (`Token.attendeeName`); where the name comes from is up to you (order position configuration as above, the order context, …). The keys `orderId`, `cancelled` and `cancelledDate` are reserved, and a hook that throws is logged and the ticket is issued without its data. Ticket metadata is never part of the public ERC metadata.
- **Stock** is `supply` minus the tickets that are not cancelled, and `0` for cancelled events and events without a supply. It is shown to customers but does not stop a sale; the validator does.
- **Redeemable** are tickets that are neither redeemed nor cancelled, of an event that is not cancelled, within the entry window.
- **Public metadata** (`/erc-metadata/...`, `Token.ercMetadata`): name, description, image and the product's `tokenization.ercMetadataProperties` (not the event details).

## Events

An event is a product of type `TOKENIZED_PRODUCT`. `tokenization.supply` caps the tickets sold (`0` or unset means no cap); off-chain tickets need no `contractAddress` or `tokenId`. The event facts live in `product.meta`, next to the cancellation flag (`meta.cancelled`):

| Key in `product.meta` | Field on `TokenizedProduct.event` |
|---|---|
| `slot` (`START`), a date | `startsAt` |
| `location` | `location` |
| `durationMinutes` | `durationMinutes`, `endsAt` (start + duration) |
| `doorsOpenMinutesBefore` | `doorsOpenMinutesBefore`, `doorsOpenAt` (start − minutes) |
| `category` | `category` |
| `cancelled`, `cancelledDate` (set by `cancelEvent`) | `isCanceled`, `cancelledDate` |

`TokenizedProduct.event` (type `TicketEvent`) holds every ticketing value of an event; the supply and the tickets come from the product itself (`contractConfiguration`, `tokens`, `tokensCount`). `product.meta` is not part of the GraphQL `Product` type or of the public ERC metadata; read the details through `event` or `getTicketEventDetails(product)`.

Set them in the Admin UI (**Ticketing → Events**, event editor), in a [bulk import](./bulk-import) (`specification.meta`), or with `updateTicketEvent`, which changes only the details you pass (`null` clears one):

```graphql schema=page
mutation MoveEvent {
  updateTicketEvent(
    productId: "event-1"
    event: { startsAt: "2026-10-01T18:00:00Z", location: "Main Hall", doorsOpenMinutesBefore: 30 }
  ) {
    _id
    ... on TokenizedProduct {
      event {
        startsAt
        doorsOpenAt
        location
      }
    }
  }
}
```

`updateTicketEvent` requires `manageProducts`.

:::caution CMS and ETL syncs
A bulk import that sends `specification.meta` replaces `product.meta` as a whole: event details set with `updateTicketEvent` or the event editor are lost on the next sync, and the cancellation of a [cancelled event](#cancellations-and-reimbursement-codes) is cleared. Either let the sync own the event details and carry `cancelled` / `cancelledDate` over, or leave `meta` out of the sync.
:::

## Productions

A production is a play, concert series or course with several dates, and optionally several ticket categories per date. It is a `CONFIGURABLE_PRODUCT` tagged `ticket-production` whose variants are the dates: one `TOKENIZED_PRODUCT` per start (variation `slot`, the start as ISO string) and ticket category (variation `category`, the category code). Every date is a ticket event of its own, with supply, price, tickets, gate and cancellation; the production keeps what they share.

Create and edit productions in the Admin UI or with the ticketing mutations. In the Admin UI, **Ticketing → Events → Add production** asks for name, subtitle, location and tags like a new product; the production then opens with tabs for its dates, ticket categories, event details and sale rules, and the usual Texts and Media tabs. The mutations require `manageProducts` and stay within the [organizer scope](#organizer-scope):

| Mutation | What it does |
|---|---|
| `createTicketProduction(production)` | Creates a draft production with texts, tags, details, sale rules, categories and dates |
| `updateTicketProduction(productionId, production)` | Changes texts, tags, details and sale rules |
| `publishTicketProduction` / `unpublishTicketProduction` | Publishes or unpublishes the production with all dates |
| `addTicketPerformance` / `updateTicketPerformance` / `removeTicketPerformance` | Adds a date, changes (reschedules) one, removes one without tickets |
| `cancelTicketPerformance(productionId, startsAt, generateDiscount)` | Cancels the tickets of a date in all categories (requires `cancelTicket`) |
| `addTicketCategory` / `updateTicketCategory` / `removeTicketCategory` | Manages the categories and their defaults for new dates |
| `removeTicketProduction` | Removes a production without tickets with its dates |
| `syncTicketProduction` | Takes texts, tags, details, status and images over to all dates again |

```graphql schema=page
mutation CreateHamlet {
  createTicketProduction(
    production: {
      texts: [{ locale: "de", title: "Hamlet", slug: "hamlet" }]
      tags: ["organizer-a"]
      location: "Grosse Bühne"
      durationMinutes: 150
      saleRules: { salesStart: "2026-09-01T08:00:00Z", maxPerOrder: 6 }
      categories: [
        { code: "adult", texts: [{ locale: "de", title: "Erwachsene" }], capacity: 100, pricing: [{ amount: 4500, currencyCode: "CHF", countryCode: "CH" }] }
        { code: "reduced", texts: [{ locale: "de", title: "Ermässigt" }], capacity: 20, pricing: [{ amount: 2500, currencyCode: "CHF", countryCode: "CH" }] }
      ]
      performances: [
        { startsAt: "2026-11-01T19:00:00Z" }
        { startsAt: "2026-11-02T19:00:00Z", tickets: [{ category: "adult", supply: 50 }] }
      ]
    }
  ) {
    _id
    ... on ConfigurableProduct {
      ticketProduction {
        categories {
          code
          capacity
        }
      }
      assignments(includeInactive: true) {
        product {
          _id
          ... on TokenizedProduct {
            event {
              startsAt
              category
              saleRules {
                maxPerOrder
              }
            }
          }
        }
      }
    }
  }
}
```

What the dates take over from their production:

- **Texts** (title, subtitle, description in every language; the slug of a date ends with its start and category), **tags** (without `ticket-production`, so tag-based organizer scopes keep working) and the **status**.
- **Images**: images added to the production are shared with every date (the same file). Add and remove them on the production only; removing an image of a date in the core media tab deletes the shared file. Texts and tags changed in the Texts tab or the product list reach the dates as well.
- **Details** (`location`, `durationMinutes`, `doorsOpenMinutesBefore`) are copied into each date unless the date sets its own (`TicketEvent.overridden`); clearing a date's detail takes the production value back.
- **Sale rules** are not copied: a date's unset rules come from the production when a ticket is sold.
- **Categories** (`ticketProduction.categories`) hold the capacity and price of a new date; `updateTicketCategory(applyToPerformances: true)` also sets them in every date. A date's supply and price can differ per category.

The start and category of a date only change through the production: `updateTicketEvent` refuses `startsAt` and `category` of a date with `TicketPerformanceManagedError`. Rescheduling a date with sold tickets keeps the tickets valid (they belong to the product); the supply can never go below the tickets that are sold or reserved (`TicketSupplyBelowSoldError`), and dates or categories with tickets can only be cancelled, not removed. `ticketEvents(productionId)` lists the dates of a production, `ticketEvents(standalone: true)` the events that are not a date of a production, and `ticketProductions` the productions.

:::caution Core product tabs
Changing a production in the core product tabs (texts, tags) reaches the dates with `syncTicketProduction` or the next production change. Do not remove a production through the core product list: its dates would stay on sale as single events; use `removeTicketProduction`.
:::

## Selling tickets

`validateTicketOrderPosition` runs whenever a ticket is added to a cart, its quantity changes and at checkout. After the core check (the product is active), for tokenized products it:

1. refuses tickets of a cancelled event (`TicketEventCancelledError`),
2. always allows reducing a quantity,
3. applies the sale rules,
4. keeps the tickets within `tokenization.supply`: issued tickets that are not cancelled, plus the tickets of `PENDING` orders, plus this order must not exceed it (`TicketSoldOutError` with `available`).

The built-in sale rules are stored in `meta.saleRules` of the ticket (`onSale`, `salesStart`, `salesEnd`, `maxPerOrder`); a date of a [production](#productions) takes the rules it does not set from `meta.saleRules` of its production. Set them in the Admin UI, with `updateTicketEvent(event: { saleRules })` or `updateTicketProduction`; `TicketEvent.saleRules` returns the rules that apply and `TicketEvent.ownSaleRules` the stored ones. To read the rules from somewhere else, pass `getSaleRules` (`getSaleRules: null` switches them off) and spread `getDefaultTicketSaleRules` to keep the built-in ones:

```ts
import { createTicketOrderPositionValidator, getDefaultTicketSaleRules } from '@unchainedshop/ticketing';

const validateOrderPosition = createTicketOrderPositionValidator({
  getSaleRules: async (input) => {
    const rules = await getDefaultTicketSaleRules(input);
    // e.g. never more than 10 tickets per order, whatever is stored
    return { ...rules, maxPerOrder: Math.min(rules.maxPerOrder ?? 10, 10) };
  },
});

await startPlatform(withTicketing({ options: { orders: { validateOrderPosition } } }));
```

| Rule | Error (`extensions.code`) |
|------|---------------------------|
| `onSale: false`, or a date that cannot be parsed | `TicketNotOnSaleError` |
| before `salesStart` | `TicketSaleNotStartedError` (`salesStart`) |
| from `salesEnd` on | `TicketSaleEndedError` (`salesEnd`) |
| more than `maxPerOrder` tickets of the event in the order | `TicketOrderLimitExceededError` (`maxPerOrder`) |

Cart mutations return these codes in `extensions.code`; `checkoutCart` fails with `OrderCheckoutError` and the code in `extensions.detailCode`. At checkout the second argument of `getSaleRules` only holds `modules`: look users up through `order.userId`. Tickets are issued when an order is confirmed, so checkouts that run at the very same moment can still sell a few tickets more than the supply.

## Gate staff

Gate staff get their own user account with the `ticketing` role (it grants `scanTicket`), or a custom role with `scanTicket`. There are no pass codes, gate cookies or shared gate logins. They then see **Ticketing → Gate Control** in the Admin UI: pick an event of the day, scan QR codes with the device camera or type a code, and redeem valid tickets.

- **One gate, several events.** Tick several events, or use **Admit all … categories** for a performance sold as several products (category × time slot); the gate keeps them in its URL (`?event=a,b`). Tickets of other events show as wrong event, and `scanTicket` gets each ticket's own event, so the server refuses foreign tickets as well.
- **Only ticket QR codes from the camera.** The camera takes a code only when it holds a ticket id and its access key (`?hash=`), as [`buildTicketScanPayload`](./ticketing-renderers#one-qr-code-for-all-renderers) produces. Serials, names and order numbers can be typed, but they prove nothing about who holds the ticket: such matches are marked "found by search" and are never redeemed without a tap, even with the setting that redeems valid ticket QR codes right after scanning. A scanned QR code is redeemed with its access key, so the server refuses codes issued before the ticket changed hands ("Outdated ticket code").

| Operation | Requires | Description |
|-----------|----------|-------------|
| `ticketEvents`, `ticketEventsCount` | `gateControl` | Ticket events. Gate staff see active events, users with `manageProducts` also drafts. Filters: `queryString`, `tags`, `slotFrom` / `slotTo` (event start, inclusive), `onlyInvalidateable` (events with a ticket that can be redeemed now; combine it with a date range). |
| `ticketLookup(code, productId, limit)` | `gateControl` | A token id or a scanned QR code returns that ticket; with `productId` also a serial number (`12` or `#12`), an order number or part of an attendee name. Includes redeemed and cancelled tickets, and tickets of other events for token ids and order numbers (compare `product._id`). |
| `scanTicket(tokenId, productId, accessKey)` | `scanTicket` | Redeems a ticket. `productId` is the event this gate admits. `accessKey` is the `hash` of a scanned ticket QR code; when given it must match the ticket's current access key. Emits `TICKET_REDEEMED`. |
| `cancelTicket(tokenId, generateDiscount)` | `cancelTicket` | Cancels a ticket, see [Cancellations](#cancellations-and-reimbursement-codes). |
| `cancelEvent(productId, generateDiscount)` | `cancelTicket` | Cancels an event and all its tickets; returns the number of cancelled tokens. |
| `updateTicketEvent(productId, event)` | `manageProducts` | Changes event details. |

`scanTicket` answers with the redeemed ticket or refuses with one of these codes, in this order:

| `extensions.code` | Extensions | When |
|-------------------|------------|------|
| `TokenNotFoundError` | | unknown ticket |
| `NoPermissionError` | | the event is outside the viewer's [organizer scope](#organizer-scope) |
| `TicketAccessKeyInvalidError` | `productId` | `accessKey` does not match: the QR code was issued before the ticket changed hands, or it is forged |
| `TicketWrongEventError` | `productId`, `expectedProductId` | the ticket is for another event than `productId` |
| `TicketCanceledError` | `scope` (`TICKET` or `EVENT`), `cancelledDate` | the ticket or its event was cancelled |
| `TicketAlreadyRedeemedError` | `invalidatedDate` | the ticket was redeemed before |
| `TicketNotRedeemableError` | `reason`, `startsAt`, `opensAt`, `closesAt` | `EVENT_INACTIVE`, `NOT_YET_OPEN`, `ENTRY_CLOSED` or `NOT_REDEEMABLE` |

Tickets expose their state to gate staff:

```graphql schema=page
query GateLookup {
  ticketLookup(code: "https://shop.example.com/tickets/5f0c1e2d3a4b5c6d7e8f9a0b?hash=abc", productId: "event-1") {
    _id
    tokenSerialNumber
    ticketStatus
    invalidatedDate
    cancelledDate
    attendeeName
    user {
      _id
      name
    }
    product {
      _id
    }
  }
}
```

- `ticketStatus` is `VALID`, `REDEEMED` or `CANCELLED` (cancelled wins: a cancelled ticket also carries an `invalidatedDate`).
- `attendeeName` is what your `ticketMeta` hook stored, nothing else.
- `user` is the buyer, of which ticketing shows only the public profile (name, avatar): it grants no `viewUserPrivateInfos`, so e-mail addresses and phone numbers stay hidden from gate staff.

**Login lifetime.** Sessions are JWTs that expire after `UNCHAINED_TOKEN_EXPIRY_SECONDS` (default `3600`, one hour) and are not renewed while in use. For gate shifts, raise it (for example `43200` for 12 hours) or let staff sign in again. It applies to every user, and a signed-in session can only be revoked early by logging the user out of all sessions, so weigh the longer lifetime against that.

**`scanTicket` versus `invalidateToken`.** The core `invalidateToken` mutation also marks a token as used, but it knows nothing about events: no organizer scope, no wrong-event check, no refusal reasons, no `TICKET_REDEEMED`. Use `scanTicket` at the gate. `invalidateToken` only requires `updateToken`, which the ticket's owner and whoever holds its access key (`x-token-accesskey`) or the order's magic key have: within the entry window they can mark their own ticket as used, and it then shows as `REDEEMED` like a scanned one.

### Organizer scope

When several organizers share one shop, limit their staff to their own events:

```ts
const platform = await startPlatform(
  withTicketing(platformOptions, {
    // Only asked for users with ticketing access who are not admins
    canAccessEvent: async (event, context) => event.meta?.organizerId === context.user?.meta?.organizerId,
  }),
);
```

The scope can only take access away. It is never asked for administrators, and users without ticketing access get nothing through it. It applies to `ticketEvents`, `ticketEventsCount`, `ticketLookup`, `scanTicket`, `cancelTicket`, `cancelEvent`, `updateTicketEvent`, Gate Control and the event's ticket list (`viewTokens`). A role you grant `cancelTicket` is limited to its scope as well.

If you define the `ticketing` role yourself, build it with `createTicketingRoles({ canAccessEvent })` and pass nothing to `withTicketing`; passing a scope next to a different project `ticketing` role throws `TICKETING_SCOPE_CONFLICT`. The scope does not narrow project roles that grant `viewTokens`, `viewToken` or `updateToken` themselves, `Query.tokens`, or the core `invalidateToken` mutation. Scoped users' event lists are checked event by event instead of being paginated in the database, so give them a date range.

## Cancellations and reimbursement codes

`cancelTicket(tokenId, generateDiscount)` and `cancelEvent(productId, generateDiscount)` require `cancelTicket` (administrators by default). They mark the tickets as cancelled (`Token.isCanceled`, `ticketStatus: CANCELLED`, `cancelledDate`), invalidate them, send `TICKET_CANCELLED` / `EVENT_CANCELLED` e-mails and emit the [events](#events-and-subscriptions) below. A cancelled event also gets `TokenizedProduct.event.isCanceled` and `cancelledDate` and can no longer be sold (the flag lives in `product.meta`, see the [caution on syncs](#events)). `cancelTicket` refuses a redeemed ticket with `TokenAlreadyRedeemedError`, also one a gate redeems while the cancellation runs, and `scanTicket` refuses a ticket cancelled while it is scanned, so a ticket is never admitted and reimbursed both.

**E-mail templates.** Register your own `EVENT_CANCELLED` and `TICKET_CANCELLED` templates with `MessagingDirector.registerTemplate()` to replace the built-in English ones; yours win in any registration order. They receive `{ productId | tokenId, userId, discountCode?, discountAmount? }`.

**Reimbursement codes.** With `generateDiscount: true`, every affected buyer gets a code worth the catalog price of the cancelled tickets. To accept the codes at checkout, register `ReimbursementCodePlugin` from `@unchainedshop/ticketing/pricing/discount-reimbursement-code` and set `DISCOUNT_CODE_SECRET` to 32 random bytes as hex. A value in another format stops the engine at startup; without the variable, issuing a code fails before any ticket is cancelled. Codes from your own code generator keep working if you pass it as `createTicketingPlugin({ discountCode: { generate, verify } })`.

## Events and subscriptions

| Event | Payload | Emitted |
|-------|---------|---------|
| `TICKET_REDEEMED` | `{ token, redeemedBy }` | by `scanTicket` (not by the core `invalidateToken` mutation) |
| `TICKET_CANCELLED` | `{ token }` | for every cancelled ticket, also those of a cancelled event |
| `TICKET_EVENT_CANCELLED` | `{ productId, cancelledCount }` | after the tickets of a cancelled event |

```ts
import { subscribe } from '@unchainedshop/events';
import { TicketingEventTypes, registerTicketingEvents } from '@unchainedshop/ticketing';

// The events are registered when the platform starts; register them yourself to subscribe earlier.
registerTicketingEvents();
subscribe(TicketingEventTypes.TICKET_REDEEMED, async ({ payload: { token, redeemedBy } }) => {
  // e.g. print a name badge
});
```

The core `TOKEN_INVALIDATED` event fires for redemptions and cancellations alike; a cancelled ticket already carries `meta.cancelled` when it fires. Listen to the ticketing events when you need to tell them apart.

## Delivering tickets

**Magic keys.** Every order has a key that opens it and its tickets without a session: as `x-magic-key` header on GraphQL requests, or as `otp` parameter of the tickets PDF link. It is derived from the order id and `UNCHAINED_SECRET` and does not expire. `Order.magicKey` returns it to the order's owner, administrators and requests that presented it; `Order.ticketsPdfUrl` is the PDF link with the key:

```graphql schema=page
query OrderTickets {
  order(orderId: "order-1") {
    _id
    magicKey
    ticketsPdfUrl
    receipt: ticketsPdfUrl(variant: "receipt")
    items {
      tokens {
        _id
        tokenSerialNumber
        accessKey
        ticketStatus
      }
    }
  }
}
```

`ticketsPdfUrl` is `null` for carts and without a PDF renderer. `accessKey` is the key of one ticket (the `hash` of the wallet links); it changes when the ticket changes hands.

**Server-side helpers:**

| Helper | Returns |
|--------|---------|
| `buildTicketsPdfUrl(orderId, context, { variant, rootUrl })` | the tickets PDF link with the magic key, or `null` without a PDF renderer |
| `buildWalletPassUrls(token, context, { rootUrl })` | `{ appleWallet, googleWallet }` download links, only for registered renderers |
| `getTicketAttachments(orderId, context, { pdf, appleWalletPasses, rootUrl })` | e-mail attachments `{ filename, href }`: the tickets PDF and, with `appleWalletPasses: true`, one `.pkpass` per ticket that is not cancelled |

To attach the tickets to the order confirmation, register a template after `startPlatform` that extends the built-in one:

```ts
import { MessagingDirector } from '@unchainedshop/core';
import { resolveOrderConfirmationTemplate } from '@unchainedshop/platform';
import { getTicketAttachments, type TicketingAPI } from '@unchainedshop/ticketing';

MessagingDirector.registerTemplate('ORDER_CONFIRMATION', async (params, context) => {
  const messages = await resolveOrderConfirmationTemplate(params, context);
  const attachments = await getTicketAttachments(params.orderId, context as TicketingAPI, {
    appleWalletPasses: true,
  });
  return messages.map((message) =>
    message.type === 'EMAIL'
      ? { ...message, input: { ...message.input, attachments: [...(message.input.attachments || []), ...attachments] } }
      : message,
  );
});
```

The e-mail worker downloads the attachments from `ROOT_URL` when it sends the message, so that URL must be reachable from the worker instances (pass `rootUrl` for an internal address).

## REST routes

Mounted by `connect()` before the Admin UI:

| Route | Parameters | Answers |
|-------|------------|---------|
| `GET /rest/print_tickets` | `orderId`, `otp` (magic key; not needed for the owner's session or admins), optional `variant` | the PDF; `403` without access, `404` without a PDF renderer or for an unknown order |
| `GET /rest/google-wallet/download/<tokenId>` | `hash` (the ticket's access key) | `302` to the Google Wallet save link; `403` for a wrong hash, `404` for an unknown ticket, without a renderer or when it returns `null` |
| `GET /rest/apple-wallet/download/<tokenId>.pkpass` | `hash` | the `.pkpass` file; `403` for a wrong hash, `404` for an unknown ticket or without a renderer |
| `/rest/apple-wallet/v1/…` | Apple's PassKit web service | device registration and unregistration, updated serial numbers, latest pass, log |

The paths follow the [environment variables](#installation). Base paths change the URLs, not the route patterns.

## Custom GraphQL schema

`withTicketing` adds type definitions and resolvers. If you pass your own `schema` to `startPlatform` (for example a stitched schema), the GraphQL server ignores `typeDefs` and `resolvers`, and `withTicketing` logs a warning. Add them to your schema yourself, and build it after `startPlatform`, when `roles.actions` contains the ticketing actions: the `RoleAction` enum needs them, or `User.allowedActions` fails for staff.

```ts
import { makeExecutableSchema } from '@graphql-tools/schema';
import type { GraphQLSchema } from 'graphql';
import { roles } from '@unchainedshop/api';
import { buildDefaultTypeDefs } from '@unchainedshop/api/lib/schema/index.js';
import unchainedResolvers from '@unchainedshop/api/lib/resolvers/index.js';
import { ticketingResolvers, ticketingTypeDefs, withTicketing } from '@unchainedshop/ticketing';

let schema: GraphQLSchema;
const platform = await startPlatform(
  withTicketing({
    ...platformOptions,
    schema: () => schema, // resolved per request, built below
  }),
);

schema = makeExecutableSchema({
  typeDefs: [
    ...buildDefaultTypeDefs({ actions: Object.keys(roles.actions) }),
    ...ticketingTypeDefs,
    ...myTypeDefs,
  ],
  resolvers: [unchainedResolvers, ticketingResolvers, myResolvers],
});
```

Remove your own `cancelEvent`, `cancelTicket` and `isCanceled` definitions: `cancelEvent` returns `Int!` here, and resolvers listed later silently replace earlier ones.

The ticketing part of the schema, as added by `withTicketing()`:

```ts
// ticketingTypeDefs (excerpt, descriptions left out)
export default [
  /* GraphQL */ `
    extend type Query {
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
        productionId: ID
        standalone: Boolean
      ): [Product!]!
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
      ticketLookup(code: String!, productId: ID, limit: Int = 10): [Token!]!
      ticketProductions(
        queryString: String
        limit: Int = 50
        offset: Int = 0
        includeDrafts: Boolean = true
        sort: [SortOptionInput!]
        tags: [LowerCaseString!]
      ): [Product!]!
      ticketProductionsCount(queryString: String, includeDrafts: Boolean = true, tags: [LowerCaseString!]): Int!
    }

    extend type Mutation {
      scanTicket(tokenId: ID!, productId: ID, accessKey: String): Token!
      cancelTicket(tokenId: ID!, generateDiscount: Boolean): Token!
      cancelEvent(productId: ID!, generateDiscount: Boolean): Int!
      updateTicketEvent(productId: ID!, event: UpdateTicketEventInput!): Product!
      createTicketProduction(production: CreateTicketProductionInput!): Product!
      updateTicketProduction(productionId: ID!, production: UpdateTicketProductionInput!): Product!
      publishTicketProduction(productionId: ID!): Product!
      unpublishTicketProduction(productionId: ID!): Product!
      syncTicketProduction(productionId: ID!): Product!
      removeTicketProduction(productionId: ID!): Product!
      addTicketPerformance(productionId: ID!, performance: TicketPerformanceInput!): Product!
      updateTicketPerformance(
        productionId: ID!
        startsAt: DateTime!
        performance: UpdateTicketPerformanceInput!
      ): Product!
      removeTicketPerformance(productionId: ID!, startsAt: DateTime!): Product!
      cancelTicketPerformance(productionId: ID!, startsAt: DateTime!, generateDiscount: Boolean): Int!
      addTicketCategory(productionId: ID!, category: TicketCategoryInput!): Product!
      updateTicketCategory(
        productionId: ID!
        code: String!
        category: UpdateTicketCategoryInput!
        applyToPerformances: Boolean = false
      ): Product!
      removeTicketCategory(productionId: ID!, code: String!): Product!
    }

    input UpdateTicketEventInput {
      startsAt: DateTime
      location: String
      durationMinutes: Int
      doorsOpenMinutesBefore: Int
      category: String
      saleRules: TicketSaleRulesInput
    }

    input TicketSaleRulesInput {
      onSale: Boolean
      salesStart: DateTime
      salesEnd: DateTime
      maxPerOrder: Int
    }

    input TicketPriceInput {
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
      code: String!
      texts: [TicketCategoryTextInput!]
      capacity: Int
      pricing: [TicketPriceInput!]
    }

    input UpdateTicketCategoryInput {
      texts: [TicketCategoryTextInput!]
      capacity: Int
      pricing: [TicketPriceInput!]
    }

    input TicketPerformanceTicketInput {
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

    input UpdateTicketProductionInput {
      texts: [ProductTextInput!]
      tags: [LowerCaseString!]
      location: String
      durationMinutes: Int
      doorsOpenMinutesBefore: Int
      saleRules: TicketSaleRulesInput
    }

    enum TicketStatus {
      VALID
      REDEEMED
      CANCELLED
    }

    type TicketEvent {
      startsAt: DateTime
      endsAt: DateTime
      doorsOpenAt: DateTime
      location: String
      durationMinutes: Int
      doorsOpenMinutesBefore: Int
      category: String
      isCanceled: Boolean!
      cancelledDate: DateTime
      saleRules: TicketSaleRules!
      ownSaleRules: TicketSaleRules!
      overridden: [String!]!
    }

    type TicketSaleRules {
      onSale: Boolean
      salesStart: DateTime
      salesEnd: DateTime
      maxPerOrder: Int
    }

    extend type TokenizedProduct {
      event: TicketEvent!
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
      option: ProductVariationOption
      capacity: Int
      pricing: [TicketCategoryPrice!]!
    }

    type TicketProduction {
      location: String
      durationMinutes: Int
      doorsOpenMinutesBefore: Int
      saleRules: TicketSaleRules!
      categories: [TicketCategory!]!
    }

    extend type ConfigurableProduct {
      ticketProduction: TicketProduction
    }

    extend type Token {
      isCanceled: Boolean
      cancelledDate: DateTime
      ticketStatus: TicketStatus!
      attendeeName: String
    }

    extend type Order {
      magicKey: String
      ticketsPdfUrl(variant: String): String
    }
  `,
];
```

GraphQL clients declare date variables with the runtime scalar name `DateTimeISO`, for example `query ($from: DateTimeISO) { ticketEvents(slotFrom: $from) { _id } }`.

## Example

The [ticketing example](https://github.com/unchainedshop/unchained/tree/master/examples/ticketing) seeds a demo event, the ticket issuer and a gate staff account (`gate@unchained.local`), and its integration tests buy tickets, redeem one at the gate and cancel another:

```bash
git clone https://github.com/unchainedshop/unchained.git
cd unchained/examples/ticketing
npm install
npm run dev
```

## Related

- [Ticket Renderers](./ticketing-renderers) - PDF, Apple Wallet and Google Wallet
- [Ticketing Package Source](https://github.com/unchainedshop/unchained/tree/master/packages/ticketing)
- [Warehousing Module](../platform-configuration/modules/warehousing) - Token management
- [Order Lifecycle](../concepts/order-lifecycle) - Order processing
- [Worker](../extend/worker) - Background job processing
