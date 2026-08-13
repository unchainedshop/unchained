import { test } from 'node:test';
import assert from 'node:assert';
import { setupDatabase, createLoggedInGraphqlFetch, disconnect } from './helpers.js';
import { ADMIN_TOKEN, USER_TOKEN } from './seeds/users.js';
import { ProposedQuotation } from './seeds/quotations.js';
import { SimpleProduct } from './seeds/products.js';

let graphqlFetchAsAdmin;
let graphqlFetchAsUser;

// Full negotiation lifecycle: request -> verify -> propose (with negotiated
// price) -> add to cart -> checkout. Regression coverage for:
// - checkout TypeError on carts containing quotations (isExpired destructure)
// - proposal context persisted to quotation.context, price derived by quote()
// - Quotation.price exposure
// - owner access to Query.quotation
// NB: how a proposed price affects cart calculation is project-specific
// (transformItemConfiguration + a project pricing adapter) — the engine
// keeps catalog pricing for the position; asserted below.
test.describe('Quotation: negotiated checkout flow', async () => {
  const CATALOG_UNIT_PRICE = 10000;
  const NEGOTIATED_UNIT_PRICE = 8500;
  const QUANTITY = 2;
  let quotationId;
  let orderId;

  test.before(async () => {
    await setupDatabase();
    graphqlFetchAsAdmin = createLoggedInGraphqlFetch(ADMIN_TOKEN);
    graphqlFetchAsUser = createLoggedInGraphqlFetch(USER_TOKEN);
  });

  test.after(async () => {
    await disconnect();
  });

  test('user requests a quotation', async () => {
    const { data: { requestQuotation } = {} } = await graphqlFetchAsUser({
      query: /* GraphQL */ `
        mutation requestQuotation(
          $productId: ID!
          $configuration: [ProductConfigurationParameterInput!]
        ) {
          requestQuotation(productId: $productId, configuration: $configuration) {
            _id
            status
          }
        }
      `,
      variables: {
        productId: SimpleProduct._id,
        configuration: [{ key: 'quantity', value: String(QUANTITY) }],
      },
    });
    assert.equal(requestQuotation.status, 'REQUESTED');
    quotationId = requestQuotation._id;
  });

  test('admin verifies the request', async () => {
    const { data: { verifyQuotation } = {} } = await graphqlFetchAsAdmin({
      query: /* GraphQL */ `
        mutation verifyQuotation($quotationId: ID!) {
          verifyQuotation(quotationId: $quotationId) {
            _id
            status
          }
        }
      `,
      variables: { quotationId },
    });
    assert.equal(verifyQuotation.status, 'PROCESSING');
  });

  test('admin proposes a negotiated unit price via quotationContext', async () => {
    const { data: { makeQuotationProposal } = {} } = await graphqlFetchAsAdmin({
      query: /* GraphQL */ `
        mutation makeQuotationProposal($quotationId: ID!, $quotationContext: JSON) {
          makeQuotationProposal(quotationId: $quotationId, quotationContext: $quotationContext) {
            _id
            status
            expires
            price {
              amount
              currencyCode
            }
          }
        }
      `,
      variables: {
        quotationId,
        quotationContext: { price: NEGOTIATED_UNIT_PRICE, reason: 'volume tier' },
      },
    });
    assert.equal(makeQuotationProposal.status, 'PROPOSED');
    assert.partialDeepStrictEqual(makeQuotationProposal.price, {
      amount: NEGOTIATED_UNIT_PRICE,
    });
  });

  test('owner can read their own quotation incl. proposed price', async () => {
    const { data: { quotation } = {}, errors } = await graphqlFetchAsUser({
      query: /* GraphQL */ `
        query quotation($quotationId: ID!) {
          quotation(quotationId: $quotationId) {
            _id
            status
            price {
              amount
              currencyCode
            }
          }
        }
      `,
      variables: { quotationId },
    });
    assert.equal(errors, undefined);
    assert.partialDeepStrictEqual(quotation, {
      _id: quotationId,
      status: 'PROPOSED',
      price: { amount: NEGOTIATED_UNIT_PRICE },
    });
  });

  test('accepting the proposal adds the position (catalog price applies unless a project pricing adapter consumes the quotation)', async () => {
    // dedicated cart so the test is independent of leftover seeded carts
    const { data: { createCart } = {} } = await graphqlFetchAsUser({
      query: /* GraphQL */ `
        mutation {
          createCart(orderNumber: "quotation-checkout") {
            _id
          }
        }
      `,
    });
    orderId = createCart._id;

    const { data: { addCartQuotation } = {} } = await graphqlFetchAsUser({
      query: /* GraphQL */ `
        mutation addCartQuotation($quotationId: ID!, $quantity: Int, $orderId: ID) {
          addCartQuotation(quotationId: $quotationId, quantity: $quantity, orderId: $orderId) {
            _id
            quantity
            unitPrice {
              amount
              currencyCode
            }
            total {
              amount
              currencyCode
            }
          }
        }
      `,
      variables: { quotationId, quantity: QUANTITY, orderId },
    });
    assert.equal(addCartQuotation.quantity, QUANTITY);
    assert.equal(addCartQuotation.total.amount, CATALOG_UNIT_PRICE * QUANTITY);
  });

  test('checkout of a quotation cart succeeds (no isExpired TypeError)', async () => {
    await graphqlFetchAsUser({
      query: /* GraphQL */ `
        mutation updateCart($orderId: ID, $billingAddress: AddressInput, $contact: ContactInput) {
          updateCart(orderId: $orderId, billingAddress: $billingAddress, contact: $contact) {
            _id
          }
        }
      `,
      variables: {
        orderId,
        billingAddress: {
          firstName: 'Agentic',
          lastName: 'Buyer',
          addressLine: 'Strasse 1',
          postalCode: '8000',
          city: 'Zürich',
        },
        contact: { emailAddress: 'buyer@unchained.local' },
      },
    });

    const { data: { checkoutCart } = {}, errors } = await graphqlFetchAsUser({
      query: /* GraphQL */ `
        mutation checkoutCart($orderId: ID) {
          checkoutCart(orderId: $orderId) {
            _id
            status
            total {
              amount
            }
          }
        }
      `,
      variables: { orderId },
    });
    assert.equal(errors, undefined);
    assert.equal(checkoutCart.status, 'CONFIRMED');
  });

  test('checkout with an EXPIRED quotation fails with a business error, not a TypeError', async () => {
    const { data: { createCart } = {} } = await graphqlFetchAsUser({
      query: /* GraphQL */ `
        mutation {
          createCart(orderNumber: "quotation-checkout-expired") {
            _id
          }
        }
      `,
    });
    const expiredOrderId = createCart._id;

    await graphqlFetchAsUser({
      query: /* GraphQL */ `
        mutation addCartQuotation($quotationId: ID!, $orderId: ID) {
          addCartQuotation(quotationId: $quotationId, orderId: $orderId) {
            _id
          }
        }
      `,
      variables: { quotationId: ProposedQuotation._id, orderId: expiredOrderId }, // seed expired 2019
    });

    await graphqlFetchAsUser({
      query: /* GraphQL */ `
        mutation updateCart($orderId: ID, $billingAddress: AddressInput, $contact: ContactInput) {
          updateCart(orderId: $orderId, billingAddress: $billingAddress, contact: $contact) {
            _id
          }
        }
      `,
      variables: {
        orderId: expiredOrderId,
        billingAddress: {
          firstName: 'Agentic',
          lastName: 'Buyer',
          addressLine: 'Strasse 1',
          postalCode: '8000',
          city: 'Zürich',
        },
        contact: { emailAddress: 'buyer@unchained.local' },
      },
    });

    const { errors } = await graphqlFetchAsUser({
      query: /* GraphQL */ `
        mutation checkoutCart($orderId: ID) {
          checkoutCart(orderId: $orderId) {
            _id
            status
          }
        }
      `,
      variables: { orderId: expiredOrderId },
    });
    assert.ok(errors?.length);
    // surfaced as OrderCheckoutError with the business error preserved in
    // extensions — NOT a masked TypeError from the isExpired destructure
    assert.equal(errors[0]?.extensions?.code, 'OrderCheckoutError');
    assert.equal(errors[0]?.extensions?.detailCode, 'QuotationInvalidError');
    assert.match(String(errors[0]?.extensions?.detailMessage), /Quotation expired/i);
  });
});
