# Payrexx

Register `PayrexxPlugin` from `@unchainedshop/plugins/payment/payrexx` through `pluginRegistry` before platform startup. Set `PAYREXX_SECRET`; configure the provider's `instance` value with your Payrexx instance name.

The plugin mounts its webhook at `/payment/payrexx`, configurable with `PAYREXX_WEBHOOK_PATH`. See the [Payrexx integration guide](../../../../../docs/docs/plugins/payment/payrexx.md) for the payment flow and configuration.
