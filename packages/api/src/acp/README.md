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

The configured payment provider must use adapter key
`shop.unchained.payment.acp-stripe-spt`. Its optional configuration keys are
`secret`, `stripeVersion`, and `description`; `STRIPE_SECRET` is used when the
provider has no `secret`.

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

The current idempotency cache is process-local with a 24-hour TTL. It provides
the ACP wire behavior for a single process, but production multi-instance
deployments need a shared persistent implementation behind the same helper.
