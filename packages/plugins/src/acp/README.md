# Agentic Commerce Protocol (ACP)

A self-contained `IPlugin` implementing the ACP `2026-04-17` checkout-session
contract. It registers **no payment adapter** — it drives a checkout through
whichever payment provider is configured (Stripe SPT ships as the default rail).
Registered in `presets/all.ts`; it self-gates via `onRegister` (skips its routes
when `UNCHAINED_ACP_API_KEY` is unset).

Routes (WHATWG `Request`/`Response`, mounted for both Express and Fastify):

- `POST /acp/checkout_sessions`
- `GET|POST /acp/checkout_sessions/:id`
- `POST /acp/checkout_sessions/:id/complete`
- `POST /acp/checkout_sessions/:id/cancel`
- `GET /acp/feed.jsonl`
- `GET /.well-known/acp.json`

Required checkout configuration:

```text
UNCHAINED_ACP_API_KEY=<inbound bearer token>
UNCHAINED_ACP_PAYMENT_PROVIDER_ID=<GENERIC provider id>
ACP_CHECKOUT_CONTINUE_URL=https://shop.example.com/orders
```

The configured payment provider's adapter must be on the ACP allowlist
(`ACP_PAYMENT_ADAPTER_KEYS`, default `shop.unchained.payment.stripe`). The bundled
Stripe SPT charge uses `STRIPE_SECRET` and Stripe's `2026-04-22.preview` API
version for that single charge. Stripe's SPT surface is still **Preview/Beta** (no
GA as of 2026-09) — treat it accordingly in any SLA or user-facing copy.

## Payment handlers (PSP-agnostic)

ACP's payment layer is the PSP-agnostic Payment Handlers Framework: the
`2026-04-17` schema enumerates `stripe`, `paypal` and `adyen` and `psp` is a
free-form string. **Nothing in the ACP layer assumes Stripe** — the delegated
token travels generically as `paymentContext.{acpToken, acpHandlerId}` through
`services.orders.checkoutOrder` into whichever adapter the provider uses; the
PSP-specific token handling lives inside the adapter (`payment/stripe/adapter.ts`).

Stripe SPT ships as the one adapter implementing that contract today. Adding
PayPal/Adyen is a pure adapter add — no ACP-layer change:

1. write a payment adapter whose `charge()` reads `acpToken`/`acpHandlerId` from
   its charge context and consumes that PSP's delegated token;
2. add its adapter key to `ACP_PAYMENT_ADAPTER_KEYS`;
3. point `ACP_PAYMENT_HANDLER_{ID,NAME,PSP,CONFIG}` at it.

```text
ACP_PAYMENT_ADAPTER_KEYS=shop.unchained.payment.stripe  # comma-separated allowlist of ACP-capable adapters
ACP_PAYMENT_HANDLER_ID=stripe_spt
ACP_PAYMENT_HANDLER_NAME=dev.acp.tokenized.card
ACP_PAYMENT_HANDLER_DISPLAY_NAME=Card
ACP_PAYMENT_HANDLER_PSP=stripe
ACP_PAYMENT_HANDLER_CONFIG={}                             # JSON surfaced to the agent's PSP (e.g. publishable key / connected account)
```

On a successful SPT charge the adapter persists an evidence trail on the order
payment `info` (delegated-token reference, resulting charge id, Stripe API
version, timestamp) so the merchant — who stays merchant-of-record and owns
chargeback liability — can later reconstruct agent identity/consent.

Product-feed and webhook configuration:

```text
ACP_SELLER_NAME=Example Store
ACP_SELLER_URL=https://shop.example.com
ACP_SELLER_PRIVACY_POLICY=https://shop.example.com/privacy
ACP_SELLER_TOS=https://shop.example.com/terms
ACP_PRODUCT_URL_BASE=https://shop.example.com/products
ACP_TARGET_COUNTRIES=US,CH

ACP_WEBHOOK_URL=https://example.openai.com/agentic_checkout/webhooks/order_events
ACP_WEBHOOK_SECRET=<shared signing secret>
ACP_WEBHOOK_RETRIES=5
ACP_WEBHOOK_EVENT_TENSE=past
```

`OPENAI_WEBHOOK_URL`/`OPENAI_WEBHOOK_SECRET` are accepted as aliases.
`ACP_WEBHOOK_EVENT_TENSE=present` emits the canonical repository values
`order_create`/`order_update`; the default emits OpenAI's `order_created`/`order_updated`.

Every request requires `Authorization: Bearer` and `API-Version: 2026-04-17`, and
every POST also requires `Idempotency-Key`.

## Known limitation

The idempotency cache and outbound-webhook dedupe are both **process-local**
(single-instance). Multi-instance deployments need a shared persistent
implementation and a durable delivery queue — tracked as a payment-system-wide
follow-up, not part of this integration.
