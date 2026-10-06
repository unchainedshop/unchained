import { test } from 'node:test';
import assert from 'node:assert';
import { setupDatabase, createLoggedInGraphqlFetch, disconnect } from './helpers.js';
import { ADMIN_TOKEN, USER_TOKEN, GUEST_TOKEN } from './seeds/users.js';
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
// - the proposed unit price replaces the catalog price of the cart position
// - quotation lines keep the quoted configuration and pass validateOrderPosition
test.describe('Quotation: negotiated checkout flow', async () => {
  const CATALOG_UNIT_PRICE = 10000;
  const NEGOTIATED_UNIT_PRICE = 8500;
  const QUANTITY = 2;
  let quotationId;
  let orderId;
  let itemId;
  let db;

  test.before(async () => {
    [db] = await setupDatabase();
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

  test('accepting the proposal adds the position at the negotiated unit price', async () => {
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
    itemId = addCartQuotation._id;
    assert.equal(addCartQuotation.unitPrice.amount, NEGOTIATED_UNIT_PRICE);
    assert.equal(addCartQuotation.total.amount, NEGOTIATED_UNIT_PRICE * QUANTITY);
  });

  test('updating a quotation line keeps the quoted configuration and unit price', async () => {
    const { data: { updateCartItem } = {}, errors } = await graphqlFetchAsUser({
      query: /* GraphQL */ `
        mutation updateCartItem(
          $itemId: ID!
          $quantity: Int
          $configuration: [ProductConfigurationParameterInput!]
        ) {
          updateCartItem(itemId: $itemId, quantity: $quantity, configuration: $configuration) {
            _id
            quantity
            configuration {
              key
              value
            }
            unitPrice {
              amount
            }
          }
        }
      `,
      variables: {
        itemId,
        quantity: QUANTITY + 1,
        configuration: [{ key: 'quantity', value: '99' }],
      },
    });
    assert.equal(errors, undefined);
    assert.equal(updateCartItem.quantity, QUANTITY + 1);
    assert.deepStrictEqual(updateCartItem.configuration, [{ key: 'quantity', value: String(QUANTITY) }]);
    assert.equal(updateCartItem.unitPrice.amount, NEGOTIATED_UNIT_PRICE);
    assert.notEqual(updateCartItem.unitPrice.amount, CATALOG_UNIT_PRICE);
  });

  test('a proposed quotation for an inactive product cannot be added to the cart', async () => {
    await db.collection('quotations').insertOne({
      _id: 'proposed-draft-product-quotation',
      created: new Date(),
      status: 'PROPOSED',
      userId: 'user',
      productId: 'simpleproduct_draft',
      configuration: [],
      countryCode: 'CH',
      currencyCode: 'CHF',
      price: 100,
      expires: new Date(Date.now() + 3600 * 1000),
      log: [],
      quotationNumber: 'DRAFT0001',
    });

    const { errors } = await graphqlFetchAsUser({
      query: /* GraphQL */ `
        mutation addCartQuotation($quotationId: ID!, $orderId: ID) {
          addCartQuotation(quotationId: $quotationId, orderId: $orderId) {
            _id
          }
        }
      `,
      variables: { quotationId: 'proposed-draft-product-quotation', orderId },
    });
    // the default validateOrderPosition throws a plain Error, which the API masks
    assert.ok(errors?.length);
    assert.deepStrictEqual(errors[0].path, ['addCartQuotation']);
  });

  test('checkout of a quotation cart succeeds (no isExpired TypeError)', async () => {
    await graphqlFetchAsUser({
      query: /* GraphQL */ `
        mutation updateCart(
          $orderId: ID
          $billingAddress: AddressInput
          $contact: ContactInput
          $paymentProviderId: ID
        ) {
          updateCart(
            orderId: $orderId
            billingAddress: $billingAddress
            contact: $contact
            paymentProviderId: $paymentProviderId
          ) {
            _id
          }
        }
      `,
      variables: {
        orderId,
        // Pin the invoice provider: the default provider is inherited from the
        // user's "most recent" seeded order, which is an `updated` tie-break that
        // can select the cryptopay provider depending on test-file ordering —
        // leaving the checkout PENDING instead of CONFIRMED.
        paymentProviderId: 'simple-payment-provider',
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

// The proposal states whether its price is net or gross, independent of how the
// catalog price of the product is taxed (SimpleProduct has a gross CHF price)
test.describe('Quotation: net price proposal', async () => {
  const NEGOTIATED_UNIT_PRICE = 8500;
  const QUANTITY = 2;
  let quotationId;

  test.before(async () => {
    await setupDatabase();
    graphqlFetchAsAdmin = createLoggedInGraphqlFetch(ADMIN_TOKEN);
    graphqlFetchAsUser = createLoggedInGraphqlFetch(USER_TOKEN);
  });

  test.after(async () => {
    await disconnect();
  });

  test('admin proposes a net unit price', async () => {
    const { data: { requestQuotation } = {} } = await graphqlFetchAsUser({
      query: /* GraphQL */ `
        mutation requestQuotation($productId: ID!) {
          requestQuotation(productId: $productId) {
            _id
          }
        }
      `,
      variables: { productId: SimpleProduct._id },
    });
    quotationId = requestQuotation._id;

    await graphqlFetchAsAdmin({
      query: /* GraphQL */ `
        mutation verifyQuotation($quotationId: ID!) {
          verifyQuotation(quotationId: $quotationId) {
            _id
          }
        }
      `,
      variables: { quotationId },
    });

    const { data: { makeQuotationProposal } = {}, errors } = await graphqlFetchAsAdmin({
      query: /* GraphQL */ `
        mutation makeQuotationProposal($quotationId: ID!, $quotationContext: JSON) {
          makeQuotationProposal(quotationId: $quotationId, quotationContext: $quotationContext) {
            _id
            status
            price {
              amount
              currencyCode
              isTaxable
              isNetPrice
            }
          }
        }
      `,
      variables: {
        quotationId,
        quotationContext: { price: NEGOTIATED_UNIT_PRICE, isNetPrice: true },
      },
    });
    assert.equal(errors, undefined);
    assert.equal(makeQuotationProposal.status, 'PROPOSED');
    assert.deepStrictEqual(makeQuotationProposal.price, {
      amount: NEGOTIATED_UNIT_PRICE,
      currencyCode: 'CHF',
      isTaxable: true,
      isNetPrice: true,
    });
  });

  test('VAT is added on top of the net quoted price', async () => {
    const { data: { createCart } = {} } = await graphqlFetchAsUser({
      query: /* GraphQL */ `
        mutation {
          createCart(orderNumber: "quotation-checkout-net") {
            _id
          }
        }
      `,
    });

    const { data: { addCartQuotation } = {}, errors } = await graphqlFetchAsUser({
      query: /* GraphQL */ `
        mutation addCartQuotation($quotationId: ID!, $quantity: Int, $orderId: ID) {
          addCartQuotation(quotationId: $quotationId, quantity: $quantity, orderId: $orderId) {
            _id
            total {
              amount
            }
            taxes: total(category: TAX) {
              amount
            }
          }
        }
      `,
      variables: { quotationId, quantity: QUANTITY, orderId: createCart._id },
    });
    assert.equal(errors, undefined);
    assert.ok(addCartQuotation.taxes.amount > 0);
    assert.equal(
      addCartQuotation.total.amount,
      NEGOTIATED_UNIT_PRICE * QUANTITY + addCartQuotation.taxes.amount,
    );
  });
});

// A quotation states its own tax treatment; without flags it counts as a taxable gross
// price, even when the catalog price of the product is net
test.describe('Quotation: proposal without tax flags', async () => {
  let db;

  test.before(async () => {
    [db] = await setupDatabase();
    graphqlFetchAsUser = createLoggedInGraphqlFetch(USER_TOKEN);
    await db
      .collection('products')
      .updateOne({ _id: SimpleProduct._id }, { $set: { 'commerce.pricing.$[].isNetPrice': true } });
  });

  test.after(async () => {
    await disconnect();
  });

  test('the quoted price is taxable gross, not net like the catalog price', async () => {
    await db.collection('quotations').insertOne({
      _id: 'proposed-quotation-without-tax-flags',
      created: new Date(),
      status: 'PROPOSED',
      userId: 'user',
      productId: SimpleProduct._id,
      configuration: [],
      countryCode: 'CH',
      currencyCode: 'CHF',
      price: 8500,
      expires: new Date(Date.now() + 3600 * 1000),
      log: [],
      quotationNumber: 'NOFLAGS1',
    });

    const { data: { createCart } = {} } = await graphqlFetchAsUser({
      query: /* GraphQL */ `
        mutation {
          createCart(orderNumber: "quotation-checkout-no-flags") {
            _id
          }
        }
      `,
    });

    const { data: { addCartQuotation } = {}, errors } = await graphqlFetchAsUser({
      query: /* GraphQL */ `
        mutation addCartQuotation($quotationId: ID!, $orderId: ID) {
          addCartQuotation(quotationId: $quotationId, quantity: 2, orderId: $orderId) {
            total {
              amount
            }
            taxes: total(category: TAX) {
              amount
            }
          }
        }
      `,
      variables: { quotationId: 'proposed-quotation-without-tax-flags', orderId: createCart._id },
    });
    assert.equal(errors, undefined);
    assert.ok(addCartQuotation.taxes.amount > 0);
    assert.equal(addCartQuotation.total.amount, 17000);
  });
});

// A quoted price may only be redeemed by its owner, in its currency, by one order
test.describe('Quotation: redemption guards', async () => {
  const NEGOTIATED_UNIT_PRICE = 8500;
  const CATALOG_UNIT_PRICE = 10000;
  let db;

  const insertProposedQuotation = (_id, fields = {}) =>
    db.collection('quotations').insertOne({
      _id,
      created: new Date(),
      status: 'PROPOSED',
      userId: 'user',
      productId: SimpleProduct._id,
      configuration: [],
      countryCode: 'CH',
      currencyCode: 'CHF',
      price: NEGOTIATED_UNIT_PRICE,
      expires: new Date(Date.now() + 3600 * 1000),
      log: [],
      quotationNumber: _id,
      ...fields,
    });

  const createCart = async (graphqlFetch, orderNumber) => {
    const { data: { createCart: cart } = {} } = await graphqlFetch({
      query: /* GraphQL */ `
        mutation createCart($orderNumber: String!) {
          createCart(orderNumber: $orderNumber) {
            _id
          }
        }
      `,
      variables: { orderNumber },
    });
    return cart._id;
  };

  const addCartQuotation = (graphqlFetch, variables) =>
    graphqlFetch({
      query: /* GraphQL */ `
        mutation addCartQuotation($quotationId: ID!, $quantity: Int, $orderId: ID) {
          addCartQuotation(quotationId: $quotationId, quantity: $quantity, orderId: $orderId) {
            _id
            quantity
            unitPrice {
              amount
            }
            order {
              _id
            }
          }
        }
      `,
      variables,
    });

  const checkoutCart = async (graphqlFetch, orderId, paymentProviderId = 'simple-payment-provider') => {
    await graphqlFetch({
      query: /* GraphQL */ `
        mutation updateCart(
          $orderId: ID
          $billingAddress: AddressInput
          $contact: ContactInput
          $paymentProviderId: ID
        ) {
          updateCart(
            orderId: $orderId
            billingAddress: $billingAddress
            contact: $contact
            paymentProviderId: $paymentProviderId
          ) {
            _id
          }
        }
      `,
      variables: {
        orderId,
        paymentProviderId,
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
    return graphqlFetch({
      query: /* GraphQL */ `
        mutation checkoutCart($orderId: ID) {
          checkoutCart(orderId: $orderId) {
            _id
            status
          }
        }
      `,
      variables: { orderId },
    });
  };

  test.before(async () => {
    [db] = await setupDatabase();
    graphqlFetchAsAdmin = createLoggedInGraphqlFetch(ADMIN_TOKEN);
    graphqlFetchAsUser = createLoggedInGraphqlFetch(USER_TOKEN);
  });

  test.after(async () => {
    await disconnect();
  });

  test('adding the product again does not merge into the quotation line', async () => {
    const configuration = [{ key: 'length', value: '5' }];
    await insertProposedQuotation('guard-merge', { configuration });
    const orderId = await createCart(graphqlFetchAsUser, 'quotation-guard-merge');
    const { data: { addCartQuotation: quoteLine } = {} } = await addCartQuotation(graphqlFetchAsUser, {
      quotationId: 'guard-merge',
      quantity: 2,
      orderId,
    });

    const { data: { addCartProduct } = {}, errors } = await graphqlFetchAsUser({
      query: /* GraphQL */ `
        mutation addCartProduct(
          $productId: ID!
          $quantity: Int
          $orderId: ID
          $configuration: [ProductConfigurationParameterInput!]
        ) {
          addCartProduct(
            productId: $productId
            quantity: $quantity
            orderId: $orderId
            configuration: $configuration
          ) {
            _id
            quantity
            unitPrice {
              amount
            }
          }
        }
      `,
      variables: { productId: SimpleProduct._id, quantity: 3, orderId, configuration },
    });
    assert.equal(errors, undefined);
    assert.notEqual(addCartProduct._id, quoteLine._id);
    assert.equal(addCartProduct.quantity, 3);
    assert.equal(addCartProduct.unitPrice.amount, CATALOG_UNIT_PRICE);

    const quotePosition = await db.collection('order_positions').findOne({ _id: quoteLine._id });
    assert.equal(quotePosition.quantity, 2);
  });

  test('a quotation cannot be added to a cart in another currency', async () => {
    await insertProposedQuotation('guard-currency', { currencyCode: 'EUR' });
    const orderId = await createCart(graphqlFetchAsUser, 'quotation-guard-currency');
    const { errors } = await addCartQuotation(graphqlFetchAsUser, {
      quotationId: 'guard-currency',
      orderId,
    });
    assert.equal(errors?.[0]?.extensions?.code, 'QuotationInvalidError');
  });

  test('checkout fails instead of charging the catalog price for a quotation of another user', async () => {
    await insertProposedQuotation('guard-checkout-owner');
    const orderId = await createCart(graphqlFetchAsUser, 'quotation-guard-checkout-owner');
    await addCartQuotation(graphqlFetchAsUser, { quotationId: 'guard-checkout-owner', orderId });
    await db
      .collection('quotations')
      .updateOne({ _id: 'guard-checkout-owner' }, { $set: { userId: 'admin' } });

    const { errors } = await checkoutCart(graphqlFetchAsUser, orderId);
    assert.equal(errors?.[0]?.extensions?.code, 'OrderCheckoutError');
    assert.equal(errors[0].extensions.detailCode, 'QuotationInvalidError');
    const quotation = await db.collection('quotations').findOne({ _id: 'guard-checkout-owner' });
    assert.equal(quotation.status, 'PROPOSED');
  });

  test('a quotation request states the quantity, and the proposal may change it', async () => {
    const { data: { requestQuotation } = {}, errors } = await graphqlFetchAsUser({
      query: /* GraphQL */ `
        mutation requestQuotation($productId: ID!, $quantity: Int) {
          requestQuotation(productId: $productId, quantity: $quantity) {
            _id
            quantity
          }
        }
      `,
      variables: { productId: SimpleProduct._id, quantity: 100 },
    });
    assert.equal(errors, undefined);
    assert.equal(requestQuotation.quantity, 100);

    await graphqlFetchAsAdmin({
      query: /* GraphQL */ `
        mutation verifyQuotation($quotationId: ID!) {
          verifyQuotation(quotationId: $quotationId) {
            _id
          }
        }
      `,
      variables: { quotationId: requestQuotation._id },
    });
    const { data: { makeQuotationProposal } = {} } = await graphqlFetchAsAdmin({
      query: /* GraphQL */ `
        mutation makeQuotationProposal($quotationId: ID!, $quotationContext: JSON) {
          makeQuotationProposal(quotationId: $quotationId, quotationContext: $quotationContext) {
            status
            quantity
          }
        }
      `,
      variables: {
        quotationId: requestQuotation._id,
        quotationContext: { price: NEGOTIATED_UNIT_PRICE, quantity: 120 },
      },
    });
    assert.deepStrictEqual(makeQuotationProposal, { status: 'PROPOSED', quantity: 120 });
  });

  test('a proposal without a quantity keeps the requested quantity', async () => {
    const { data: { requestQuotation } = {} } = await graphqlFetchAsUser({
      query: /* GraphQL */ `
        mutation requestQuotation($productId: ID!, $quantity: Int) {
          requestQuotation(productId: $productId, quantity: $quantity) {
            _id
          }
        }
      `,
      variables: { productId: SimpleProduct._id, quantity: 100 },
    });
    await graphqlFetchAsAdmin({
      query: /* GraphQL */ `
        mutation verifyQuotation($quotationId: ID!) {
          verifyQuotation(quotationId: $quotationId) {
            _id
          }
        }
      `,
      variables: { quotationId: requestQuotation._id },
    });
    const { data: { makeQuotationProposal } = {} } = await graphqlFetchAsAdmin({
      query: /* GraphQL */ `
        mutation makeQuotationProposal($quotationId: ID!, $quotationContext: JSON) {
          makeQuotationProposal(quotationId: $quotationId, quotationContext: $quotationContext) {
            quantity
          }
        }
      `,
      variables: {
        quotationId: requestQuotation._id,
        quotationContext: { price: NEGOTIATED_UNIT_PRICE },
      },
    });
    assert.equal(makeQuotationProposal.quantity, 100);
  });

  test('accepting a quotation adds the quoted quantity, adding it again adds it once more', async () => {
    await insertProposedQuotation('quantity-accept', { quantity: 100 });
    const orderId = await createCart(graphqlFetchAsUser, 'quotation-quantity-accept');
    const { data: { addCartQuotation: first } = {}, errors } = await addCartQuotation(
      graphqlFetchAsUser,
      { quotationId: 'quantity-accept', orderId },
    );
    assert.equal(errors, undefined);
    assert.equal(first.quantity, 100);
    assert.equal(first.unitPrice.amount, NEGOTIATED_UNIT_PRICE);

    const { data: { addCartQuotation: second } = {} } = await addCartQuotation(graphqlFetchAsUser, {
      quotationId: 'quantity-accept',
      orderId,
    });
    assert.equal(second._id, first._id);
    assert.equal(second.quantity, 200);
  });

  test('a quotation cannot be added with less than or a fraction of the quoted quantity', async () => {
    await insertProposedQuotation('quantity-add-less', { quantity: 100 });
    const orderId = await createCart(graphqlFetchAsUser, 'quotation-quantity-add-less');
    for (const quantity of [50, 130]) {
      const { errors } = await addCartQuotation(graphqlFetchAsUser, {
        quotationId: 'quantity-add-less',
        quantity,
        orderId,
      });
      assert.equal(errors?.[0]?.extensions?.code, 'QuotationItemConfigurationError');
    }
  });

  test('the quantity of a quotation line can only change in multiples of the quoted quantity', async () => {
    await insertProposedQuotation('quantity-update', { quantity: 100 });
    const orderId = await createCart(graphqlFetchAsUser, 'quotation-quantity-update');
    const { data: { addCartQuotation: line } = {} } = await addCartQuotation(graphqlFetchAsUser, {
      quotationId: 'quantity-update',
      orderId,
    });
    const updateCartItem = (quantity) =>
      graphqlFetchAsUser({
        query: /* GraphQL */ `
          mutation updateCartItem($itemId: ID!, $quantity: Int) {
            updateCartItem(itemId: $itemId, quantity: $quantity) {
              quantity
            }
          }
        `,
        variables: { itemId: line._id, quantity },
      });

    for (const quantity of [50, 130]) {
      const { errors } = await updateCartItem(quantity);
      assert.equal(errors?.[0]?.extensions?.code, 'QuotationItemConfigurationError');
    }
    const { data, errors } = await updateCartItem(300);
    assert.equal(errors, undefined);
    assert.equal(data.updateCartItem.quantity, 300);
  });

  test('updating a quotation line without a quantity keeps its quantity', async () => {
    await insertProposedQuotation('quantity-update-configuration', { quantity: 100 });
    const orderId = await createCart(graphqlFetchAsUser, 'quotation-quantity-update-configuration');
    const { data: { addCartQuotation: line } = {} } = await addCartQuotation(graphqlFetchAsUser, {
      quotationId: 'quantity-update-configuration',
      orderId,
    });
    const { data: { updateCartItem } = {}, errors } = await graphqlFetchAsUser({
      query: /* GraphQL */ `
        mutation updateCartItem($itemId: ID!, $configuration: [ProductConfigurationParameterInput!]) {
          updateCartItem(itemId: $itemId, configuration: $configuration) {
            quantity
          }
        }
      `,
      variables: { itemId: line._id, configuration: [{ key: 'length', value: '5' }] },
    });
    assert.equal(errors, undefined);
    assert.equal(updateCartItem.quantity, 100);
  });

  test('an expired proposal no longer blocks removing its product', async () => {
    await insertProposedQuotation('quantity-expired', {
      productId: 'simpleproduct_draft',
      quantity: 100,
      expires: new Date(Date.now() - 1000),
    });
    const { errors } = await graphqlFetchAsAdmin({
      query: /* GraphQL */ `
        mutation removeProduct($productId: ID!) {
          removeProduct(productId: $productId) {
            _id
          }
        }
      `,
      variables: { productId: 'simpleproduct_draft' },
    });
    assert.equal(errors, undefined);
  });

  test('a pending order reserves the quotation, rejecting the order releases it', async () => {
    await insertProposedQuotation('quantity-reserve', { quantity: 100 });
    const [firstOrderId, secondOrderId] = [
      await createCart(graphqlFetchAsUser, 'quotation-reserve-1'),
      await createCart(graphqlFetchAsUser, 'quotation-reserve-2'),
    ];
    await addCartQuotation(graphqlFetchAsUser, {
      quotationId: 'quantity-reserve',
      orderId: firstOrderId,
    });
    await addCartQuotation(graphqlFetchAsUser, {
      quotationId: 'quantity-reserve',
      orderId: secondOrderId,
    });

    // checked out but waiting for payment: the quotation is reserved, not fulfilled
    const { data: { checkoutCart: firstOrder } = {} } = await checkoutCart(
      graphqlFetchAsUser,
      firstOrderId,
      'prepaid-payment-provider',
    );
    assert.equal(firstOrder.status, 'PENDING');
    const reserved = await db.collection('quotations').findOne({ _id: 'quantity-reserve' });
    assert.equal(reserved.status, 'PROPOSED');

    const { errors: checkoutErrors } = await checkoutCart(graphqlFetchAsUser, secondOrderId);
    assert.equal(checkoutErrors?.[0]?.extensions?.detailCode, 'QuotationInvalidError');

    const thirdOrderId = await createCart(graphqlFetchAsUser, 'quotation-reserve-3');
    const { errors: addErrors } = await addCartQuotation(graphqlFetchAsUser, {
      quotationId: 'quantity-reserve',
      orderId: thirdOrderId,
    });
    assert.equal(addErrors?.[0]?.extensions?.code, 'QuotationInvalidError');

    // rejecting the pending order releases the quotation for the other cart
    const { errors: rejectErrors } = await graphqlFetchAsAdmin({
      query: /* GraphQL */ `
        mutation rejectOrder($orderId: ID!) {
          rejectOrder(orderId: $orderId) {
            status
          }
        }
      `,
      variables: { orderId: firstOrderId },
    });
    assert.equal(rejectErrors, undefined);
    const released = await db.collection('quotations').findOne({ _id: 'quantity-reserve' });
    assert.equal(released.status, 'PROPOSED');

    const { data: { checkoutCart: secondOrder } = {}, errors } = await checkoutCart(
      graphqlFetchAsUser,
      secondOrderId,
    );
    assert.equal(errors, undefined);
    assert.equal(secondOrder.status, 'CONFIRMED');
    const fulfilled = await db.collection('quotations').findOne({ _id: 'quantity-reserve' });
    assert.equal(fulfilled.status, 'FULFILLED');
  });

  test('confirming a pending order fulfils its quotation', async () => {
    await insertProposedQuotation('quantity-confirm', { quantity: 100 });
    const orderId = await createCart(graphqlFetchAsUser, 'quotation-confirm');
    await addCartQuotation(graphqlFetchAsUser, { quotationId: 'quantity-confirm', orderId });
    await checkoutCart(graphqlFetchAsUser, orderId, 'prepaid-payment-provider');

    const { errors } = await graphqlFetchAsAdmin({
      query: /* GraphQL */ `
        mutation confirmOrder($orderId: ID!) {
          confirmOrder(orderId: $orderId) {
            status
          }
        }
      `,
      variables: { orderId },
    });
    assert.equal(errors, undefined);
    const quotation = await db.collection('quotations').findOne({ _id: 'quantity-confirm' });
    assert.equal(quotation.status, 'FULFILLED');
  });

  test('an auto-confirmed checkout fulfils its quotation once', async () => {
    await insertProposedQuotation('quantity-fulfil-once', { quantity: 100 });
    const orderId = await createCart(graphqlFetchAsUser, 'quotation-fulfil-once');
    await addCartQuotation(graphqlFetchAsUser, { quotationId: 'quantity-fulfil-once', orderId });
    const { data: { checkoutCart: order } = {} } = await checkoutCart(graphqlFetchAsUser, orderId);
    assert.equal(order.status, 'CONFIRMED');

    const messages = await db.collection('work_queue').countDocuments({
      'input.template': 'QUOTATION_STATUS',
      'input.quotationId': 'quantity-fulfil-once',
    });
    assert.equal(messages, 1);
  });

  test("logging into another account from a user's session leaves their quotations", async () => {
    await insertProposedQuotation('guard-switch-account');
    const { errors } = await graphqlFetchAsUser({
      query: /* GraphQL */ `
        mutation {
          loginWithPassword(username: "admin", password: "password") {
            _id
          }
        }
      `,
    });
    assert.equal(errors, undefined);
    const quotation = await db.collection('quotations').findOne({ _id: 'guard-switch-account' });
    assert.equal(quotation.userId, 'user');
  });

  test('a guest keeps fulfilled quotations with the orders that redeemed them', async () => {
    await insertProposedQuotation('guard-guest-fulfilled', { userId: 'guest', status: 'FULFILLED' });
    await createLoggedInGraphqlFetch(GUEST_TOKEN)({
      query: /* GraphQL */ `
        mutation {
          loginWithPassword(username: "admin", password: "password") {
            _id
          }
        }
      `,
    });
    const quotation = await db.collection('quotations').findOne({ _id: 'guard-guest-fulfilled' });
    assert.equal(quotation.userId, 'guest');
  });

  test('a guest keeps the quoted price after logging in', async () => {
    await insertProposedQuotation('guard-guest', { userId: 'guest' });
    const graphqlFetchAsGuest = createLoggedInGraphqlFetch(GUEST_TOKEN);
    const { data: { addCartQuotation: quoteLine } = {}, errors } = await addCartQuotation(
      graphqlFetchAsGuest,
      { quotationId: 'guard-guest' },
    );
    assert.equal(errors, undefined);
    assert.equal(quoteLine.unitPrice.amount, NEGOTIATED_UNIT_PRICE);

    const { data: { loginWithPassword } = {} } = await graphqlFetchAsGuest({
      query: /* GraphQL */ `
        mutation {
          loginWithPassword(username: "admin", password: "password") {
            user {
              _id
            }
          }
        }
      `,
    });
    const userId = loginWithPassword.user._id;

    const quotation = await db.collection('quotations').findOne({ _id: 'guard-guest' });
    assert.equal(quotation.userId, userId);
    const position = await db.collection('order_positions').findOne({ quotationId: 'guard-guest' });
    const { data: { order } = {} } = await graphqlFetchAsAdmin({
      query: /* GraphQL */ `
        query order($orderId: ID!) {
          order(orderId: $orderId) {
            user {
              _id
            }
            items {
              _id
              unitPrice {
                amount
              }
            }
          }
        }
      `,
      variables: { orderId: position.orderId },
    });
    assert.equal(order.user._id, userId);
    assert.equal(
      order.items.find((item) => item._id === position._id).unitPrice.amount,
      NEGOTIATED_UNIT_PRICE,
    );
  });
});
