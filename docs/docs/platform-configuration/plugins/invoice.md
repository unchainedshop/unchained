---
sidebar_position: 13
title: Invoice Payment Methods
sidebar_label: Invoice Payments
---

# Invoice Payment Methods

:::info
Configuration Options for Invoice-based Payment Methods
:::

Unchained provides two invoice-based payment plugins for different billing workflows: standard invoicing and prepaid invoicing.

## Invoice Payment Plugin

The standard invoice payment plugin allows orders to be confirmed immediately with payment processed separately through your invoicing system.

### Configuration

```graphql
createPaymentProvider(
  paymentProvider: {
    type: INVOICE
    adapterKey: "shop.unchained.invoice"
    configuration: []
  }
) {
  _id
}
```

### Features

- **Pay Later Allowed**: Orders can be confirmed before payment is received
- **Immediate Order Confirmation**: Orders are processed immediately upon checkout
- **External Payment Processing**: Payment is handled through your separate invoicing system
- **No Payment Validation**: No upfront payment verification required

### Use Cases

- **B2B Sales**: Business customers with established credit terms
- **Traditional Invoicing**: Standard invoice-then-pay workflow
- **Credit Customers**: Customers with approved payment terms
- **Wholesale Orders**: Large orders with net payment terms

## Invoice Prepaid Payment Plugin

The prepaid invoice payment plugin requires payment confirmation before order fulfillment, typically used for prepayment scenarios.

### Configuration

```graphql
createPaymentProvider(
  paymentProvider: {
    type: INVOICE
    adapterKey: "shop.unchained.invoice-prepaid"
    configuration: []
  }
) {
  _id
}
```

### Features

- **Pay Later Not Allowed**: Payment must be confirmed before order completion
- **Manual Payment Confirmation**: Requires manual confirmation of payment receipt
- **Order Hold**: Orders remain pending until payment is confirmed
- **Payment Verification**: Manual verification process required

### Use Cases

- **Prepayment Required**: Orders requiring payment before processing
- **Bank Transfer Payments**: Manual confirmation of wire transfers
- **Check Payments**: Orders paid by check requiring manual verification
- **High-Value Orders**: Orders requiring payment confirmation before shipping

## Usage

### Standard Invoice Flow

1. **Create Order**: Customer places order normally
2. **Checkout**: Order is confirmed immediately
3. **Invoice Generation**: Generate invoice through your external system
4. **Payment Processing**: Handle payment through your invoicing workflow
5. **Order Fulfillment**: Process and ship order

### Prepaid Invoice Flow

1. **Create Order**: Customer places order
2. **Checkout**: Order enters pending payment status
3. **Payment Request**: Send payment instructions to customer
4. **Payment Confirmation**: Manually confirm payment receipt in admin
5. **Order Processing**: Order moves to confirmed status after payment confirmation

## Integration Notes

### Standard Invoice
- Orders are confirmed immediately upon checkout
- No payment processing happens in Unchained
- Integration with external invoicing systems required
- Suitable for established business relationships

### Prepaid Invoice
- Orders require manual payment confirmation
- Use admin interface to confirm payments
- Suitable for one-time customers or high-risk orders
- Manual oversight required for each transaction

## Administrative Tasks

### Confirming Prepaid Payments

For prepaid invoice orders, use the admin interface to:
1. Review pending payment orders
2. Verify payment receipt through your banking/payment system
3. Mark orders as paid in the Unchained admin
4. Process confirmed orders for fulfillment

### Managing Invoice Orders

- Monitor order status and payment terms
- Generate invoices through your external system
- Track payment receipts and reconciliation
- Handle payment disputes and collections

## Comparison

| Feature | Standard Invoice | Prepaid Invoice |
|---------|------------------|-----------------|
| Order Confirmation | Immediate | After payment |
| Pay Later | Yes | No |
| Payment Processing | External | Manual confirmation |
| Use Case | Established customers | New/high-risk customers |
| Administrative Overhead | Low | High |
| Cash Flow | Delayed | Immediate |

Choose the appropriate invoice method based on your business model, customer relationships, and cash flow requirements.