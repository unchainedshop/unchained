# Agentic Commerce Protocol

The ACP transport is mounted at `/acp` by both the Express and Fastify API
adapters. It implements the `2026-04-17` checkout-session contract:

- `POST /acp/checkout_sessions`
- `POST /acp/checkout_sessions/:id`
- `GET /acp/checkout_sessions/:id`
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

The configured payment provider must be a `GENERIC` provider whose adapter is on
the ACP allowlist (`ACP_PAYMENT_ADAPTER_KEYS`, default `shop.unchained.payment.stripe`).
The bundled Stripe SPT charge uses `STRIPE_SECRET` and Stripe's `2026-04-22.preview`
API version for that single charge request. Stripe's SPT surface is still
**Preview/Beta** (no GA as of 2026-09) — treat it accordingly in any SLA or
user-facing copy.

### Payment handlers (PSP-agnostic)

ACP's payment layer is the PSP-agnostic Payment Handlers Framework: the
`2026-04-17` schema enumerates `stripe`, `paypal` and `adyen` and `psp` is a
free-form string. The **ACP layer is adapter-agnostic** — nothing in the checkout
handler assumes Stripe. The delegated token travels generically as
`paymentContext.{acpToken, acpHandlerId}` through `PaymentDirector` into whichever
adapter the payment provider uses; PSP-specific token handling lives *inside the
adapter*, where it belongs.

Stripe SPT ships as the one adapter that implements this contract **today**.
Adding PayPal/Adyen is a pure adapter add — no ACP-layer change:

1. write a payment adapter whose `charge()` reads `acpToken`/`acpHandlerId` from
   its `transactionContext` and consumes that PSP's delegated token;
2. add its adapter key to `ACP_PAYMENT_ADAPTER_KEYS`;
3. point `ACP_PAYMENT_HANDLER_{ID,NAME,PSP,CONFIG}` at it.

```text
ACP_PAYMENT_ADAPTER_KEYS=shop.unchained.payment.stripe  # comma-separated allowlist of ACP-capable adapters
ACP_PAYMENT_HANDLER_ID=stripe_spt            # handler id advertised + accepted on complete
ACP_PAYMENT_HANDLER_NAME=dev.acp.tokenized.card
ACP_PAYMENT_HANDLER_DISPLAY_NAME=Card
ACP_PAYMENT_HANDLER_PSP=stripe
ACP_PAYMENT_HANDLER_CONFIG={}                 # JSON surfaced to the agent's PSP (e.g. publishable key / connected account)
```

On a successful SPT charge the adapter persists an evidence trail on the order
payment `info` (delegated-token reference, resulting charge id, Stripe API
version, timestamp) so the merchant — who stays merchant-of-record and owns
chargeback liability — can later reconstruct agent identity/consent
(`agent_details`/`usage_limits`) for dispute defense.

Product-feed configuration:

```text
ACP_SELLER_NAME=Example Store
ACP_SELLER_URL=https://shop.example.com
ACP_SELLER_PRIVACY_POLICY=https://shop.example.com/privacy
ACP_SELLER_TOS=https://shop.example.com/terms
ACP_PRODUCT_URL_BASE=https://shop.example.com/products
ACP_TARGET_COUNTRIES=US,CH
```

Webhook configuration:

```text
ACP_WEBHOOK_URL=https://example.openai.com/agentic_checkout/webhooks/order_events
ACP_WEBHOOK_SECRET=<shared signing secret>
ACP_WEBHOOK_RETRIES=5
ACP_WEBHOOK_EVENT_TENSE=past
```

`OPENAI_WEBHOOK_URL` and `OPENAI_WEBHOOK_SECRET` are accepted as aliases.
`ACP_WEBHOOK_EVENT_TENSE=present` emits the canonical repository values
`order_create` and `order_update`; the default emits the OpenAI certification
values `order_created` and `order_updated`.

Every request requires `Authorization: Bearer`, `API-Version: 2026-04-17`, and
every POST also requires `Idempotency-Key`.

The current idempotency cache and the outbound-webhook dedupe are both
process-local (idempotency: 24-hour TTL). They provide correct ACP wire behavior
for a single process, but production multi-instance deployments need a shared
persistent implementation (and a durable delivery queue for webhooks) behind the
same helpers.
