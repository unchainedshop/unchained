# Agentic Commerce Protocol (ACP)

`ACPPlugin` implements ACP `2026-04-17`: checkout sessions, a product feed, discovery and signed order webhooks. It registers no payment adapter: checkout charges through the configured payment provider, whose adapter receives the delegated token as `paymentContext.{acpToken, acpHandlerId}` and throws an error with `cause: 'PAYMENT_DECLINED'` on a decline (the Stripe adapter charges Stripe Shared Payment Tokens, a Stripe preview API). The `all` preset registers it; it stays inactive until `UNCHAINED_ACP_API_KEY` is set.

Routes: `POST /acp/checkout_sessions`, `GET|POST /acp/checkout_sessions/:id`, `POST /acp/checkout_sessions/:id/{complete,cancel}`, `GET /acp/feed.jsonl`, and the public `/.well-known/acp.json` with the schemas below `/.well-known/acp/schemas/`. Requests need `Authorization: Bearer`, `API-Version: 2026-04-17` and, for `POST`, an `Idempotency-Key`. Requests to one checkout session run one after another: a request that arrives while another one is processed, for example the payment of `complete`, answers `409` with `Retry-After`.

| Variable | Default | |
| --- | --- | --- |
| `UNCHAINED_ACP_API_KEY` | | Bearer token of the agent platform (required) |
| `UNCHAINED_ACP_PAYMENT_PROVIDER_ID` | | `GENERIC` payment provider for checkout (required) |
| `ACP_CHECKOUT_CONTINUE_URL` | | Base URL of order pages (required) |
| `ACP_PAYMENT_MERCHANT_ID` | | Merchant id of the payment handler (required) |
| `ACP_PAYMENT_ADAPTER_KEYS` | `shop.unchained.payment.stripe` | Adapters that take delegated tokens |
| `ACP_PAYMENT_HANDLER_{ID,NAME,DISPLAY_NAME,VERSION,PSP}` | `stripe_spt`, … | Advertised payment handler |
| `ACP_PAYMENT_HANDLER_CONFIG` | `{}` | JSON merged into the handler `config` |
| `ACP_API_PATH`, `ACP_API_BASE_URL` | `/acp`, `ROOT_URL` + path | |
| `ACP_SELLER_NAME`, `ACP_PRODUCT_URL_BASE` | | Required for the feed |
| `ACP_SELLER_PRIVACY_POLICY`, `ACP_SELLER_TOS` | | Seller links |
| `ACP_SELLER_URL` | | Used when `ROOT_URL` is not set |
| `ACP_WEBHOOK_URL`, `ACP_WEBHOOK_SECRET` (or `OPENAI_WEBHOOK_*`) | | `order_create` / `order_update` webhooks |
| `ACP_WEBHOOK_RETRIES` | `5` | |

Responses to `Idempotency-Key`s are kept in memory for 24 hours, up to 10,000 of them (then new `POST` requests answer `503`), so run a single instance.
