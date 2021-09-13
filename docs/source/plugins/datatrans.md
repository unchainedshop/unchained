---
title: 'Plugin: Payment through Datatrans'
description: Configuration Options for our Datatrans Integration
---

Unchained supports both the old XML based legacy API of Datatrans (https://docs.datatrans.ch/v1.0.1/docs/payment-process-overview) and the new transactionId-centric API based on JSON https://docs.datatrans.ch/docs/home
If you already have Datatrans chances are high you're still using the legacy API and so you will have to use the legacy Datatrans Unchained Plugin. If you're starting fresh, you will be using the new one.

Activate either of those in your project by selecting to import one (and only one):

- Old Legacy API (v1): `import 'meteor/unchained:core-payment/plugins/datatrans';`
- Current API (v2): `import 'meteor/unchained:core-payment/plugins/datatrans-v2';`

The rest of this page will center around the new v2 plugin. If you need support for the legacy plugin, check the source of the plugin and if questions arise, send us an e-mail.

# Environment variables

You have to set `DATATRANS_SECRET` and `DATATRANS_SIGN_KEY` on build-time based on the configuration on your Datatrans Merchant Account:

| NAME                     | Default Value                          | Alllowed Values                         |
| ------------------------ | -------------------------------------- | --------------------------------------- |
| `DATATRANS_SECRET`       |                                        |                                         |
| `DATATRANS_SIGN_KEY`     |                                        |                                         |
| `DATATRANS_SIGN2_KEY`    | `{DATATRANS_SIGN_KEY}`                 |                                         |
| `DATATRANS_SECURITY`     | `dynamic-sign`                         | `''`, `'static-sign'`, `'dynamic-sign'` |
| `DATATRANS_API_ENDPOINT` | `https://api.sandbox.datatrans.com`    |                                         |
| `DATATRANS_WEBHOOK_PATH` | `{ROOT_URL}/payment/datatrans/webhook` |                                         |
| `DATATRANS_SUCCESS_PATH` | `{ROOT_URL}/payment/datatrans/success` |                                         |
| `DATATRANS_ERROR_PATH`   | `{ROOT_URL}/payment/datatrans/error`   |                                         |
| `DATATRANS_CANCEL_PATH`  | `{ROOT_URL}/payment/datatrans/cancel`  |                                         |
| `DATATRANS_RETURN_PATH`  | `{ROOT_URL}/payment/datatrans/return`  |                                         |

In order to activate live payments, you will have to set the `DATATRANS_API_ENDPOINT` to the non-sandbox URL.

# Instantiate a provider
