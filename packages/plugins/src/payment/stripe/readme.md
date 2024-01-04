## Test Webhooks:

```
brew install stripe/stripe-cli/stripe
stripe login --api-key sk_....
stripe listen --forward-to http://localhost:4010/payment/stripe
stripe trigger payment_intent.succeeded
```