/**
 * Audit Log Compliance Integration Test
 *
 * Verifies that security-relevant events are captured and emitted as
 * OCSF-conformant payloads during a complete e-commerce flow:
 *
 * 1. Add product to cart
 * 2. Update cart with billing/contact
 * 3. Checkout
 * 4. Assert the emitted audit events
 *
 * The test platform pushes audit events to an in-process OTLP collector
 * (see tests/setup.js); assertions run against the decoded OCSF payloads.
 */

import {
  createAnonymousGraphqlFetch,
  createLoggedInGraphqlFetch,
  disconnect,
  setupDatabase,
} from './helpers.js';
import { getCapturedAuditEvents } from './setup.js';
import { SimpleProduct } from './seeds/products.js';
import assert from 'node:assert';
import test from 'node:test';

import { OCSF_CLASS, OCSF_AUTH_ACTIVITY, OCSF_STATUS } from '@unchainedshop/events';

const waitForEvents = async (predicate, timeoutMs = 3000) => {
  const start = Date.now();
  for (;;) {
    const matches = getCapturedAuditEvents().filter(predicate);
    if (matches.length > 0) return matches;
    if (Date.now() - start > timeoutMs) return matches;
    await new Promise((resolve) => setTimeout(resolve, 25));
  }
};

test.describe('Audit Log Compliance - Checkout Flow', () => {
  let graphqlFetch;
  let orderId;

  test.before(async () => {
    await setupDatabase();
    graphqlFetch = createLoggedInGraphqlFetch();
  });

  test.after(async () => {
    await disconnect();
  });

  // ============================================================================
  // Complete Checkout Flow
  // ============================================================================

  test('Step 1: Create cart', async () => {
    const { data: { createCart } = {} } = await graphqlFetch({
      query: /* GraphQL */ `
        mutation {
          createCart(orderNumber: "audit-test-order") {
            _id
            orderNumber
          }
        }
      `,
    });

    assert.ok(createCart, 'Cart creation should succeed');
    assert.strictEqual(createCart.orderNumber, 'audit-test-order');
    orderId = createCart._id;

    await new Promise((resolve) => setTimeout(resolve, 50));
  });

  test('Step 2: Add product to cart', async () => {
    const { data: { addCartProduct } = {} } = await graphqlFetch({
      query: /* GraphQL */ `
        mutation addCartProduct($orderId: ID!, $productId: ID!) {
          addCartProduct(orderId: $orderId, productId: $productId) {
            _id
            quantity
          }
        }
      `,
      variables: {
        orderId,
        productId: SimpleProduct._id,
      },
    });

    assert.ok(addCartProduct, 'Product should be added to cart');
    assert.ok(addCartProduct._id, 'Order item should have an ID');

    await new Promise((resolve) => setTimeout(resolve, 50));
  });

  test('Step 3: Update billing and contact', async () => {
    const { data } = await graphqlFetch({
      query: /* GraphQL */ `
        mutation updateCart($orderId: ID!, $billingAddress: AddressInput, $contact: ContactInput) {
          updateCart(orderId: $orderId, billingAddress: $billingAddress, contact: $contact) {
            _id
            billingAddress {
              firstName
              lastName
              city
            }
          }
        }
      `,
      variables: {
        orderId,
        billingAddress: {
          firstName: 'Audit',
          lastName: 'Test',
          addressLine: '123 Test St',
          postalCode: '12345',
          city: 'TestCity',
          countryCode: 'CH',
        },
        contact: {
          emailAddress: 'audit-test@example.com',
          telNumber: '+1234567890',
        },
      },
    });

    assert.ok(data?.updateCart, 'Cart update should succeed');

    await new Promise((resolve) => setTimeout(resolve, 50));
  });

  test('Step 4: Checkout order', async () => {
    const { data } = await graphqlFetch({
      query: /* GraphQL */ `
        mutation checkoutCart($orderId: ID!) {
          checkoutCart(orderId: $orderId) {
            _id
            status
            orderNumber
          }
        }
      `,
      variables: { orderId },
    });

    assert.ok(data?.checkoutCart, 'Checkout should succeed');
    assert.ok(
      ['CONFIRMED', 'PENDING'].includes(data.checkoutCart.status),
      `Order status should be CONFIRMED or PENDING, got: ${data.checkoutCart.status}`,
    );

    await new Promise((resolve) => setTimeout(resolve, 100));
  });

  // ============================================================================
  // Verify Emitted Audit Events (captured via the in-process OTLP collector)
  // ============================================================================

  test('Audit: login success and failure produce authentication events', async () => {
    const anonymousFetch = createAnonymousGraphqlFetch();

    await anonymousFetch({
      query: /* GraphQL */ `
        mutation {
          loginWithPassword(username: "admin", password: "password") {
            _id
          }
        }
      `,
    });
    await anonymousFetch({
      query: /* GraphQL */ `
        mutation {
          loginWithPassword(username: "admin", password: "definitely-wrong") {
            _id
          }
        }
      `,
    });

    const authEvents = await waitForEvents(
      (e) =>
        e.class_uid === OCSF_CLASS.AUTHENTICATION &&
        e.activity_id === OCSF_AUTH_ACTIVITY.LOGON &&
        e.status_id === OCSF_STATUS.FAILURE,
    );

    const failureEvent = authEvents[0];
    assert.ok(failureEvent, 'Failed login should produce a failed LOGON audit event');
    assert.strictEqual(failureEvent.user?.name, 'admin');

    const successEvents = getCapturedAuditEvents().filter(
      (e) =>
        e.class_uid === OCSF_CLASS.AUTHENTICATION &&
        e.activity_id === OCSF_AUTH_ACTIVITY.LOGON &&
        e.status_id === OCSF_STATUS.SUCCESS,
    );
    assert.ok(successEvents.length >= 1, 'Successful login should produce a LOGON audit event');
  });

  test('Audit: emitted events are well-formed OCSF', async () => {
    const apiEvents = await waitForEvents((e) => e.class_uid === OCSF_CLASS.API_ACTIVITY);
    assert.ok(apiEvents.length >= 3, 'Should have API activity events (order, add, checkout)');

    for (const event of getCapturedAuditEvents()) {
      assert.ok(event.class_uid, 'Event should have class_uid');
      assert.ok(event.category_uid, 'Event should have category_uid');
      assert.ok(event.activity_id !== undefined, 'Event should have activity_id');
      assert.ok(event.time, 'Event should have timestamp');
      assert.ok(event.metadata?.version, 'Event should have OCSF version');
      assert.ok(event.metadata?.product?.name, 'Event should have product metadata');

      // OCSF class requirements
      if (event.class_uid === OCSF_CLASS.API_ACTIVITY) {
        assert.ok(event.actor, 'API activity should have an actor');
        assert.ok(event.src_endpoint, 'API activity should have src_endpoint');
        assert.ok([0, 1, 2, 3, 4, 99].includes(event.activity_id), 'Legal API activity_id');
      }
      if (event.class_uid === OCSF_CLASS.AUTHENTICATION) {
        assert.ok(event.user, 'Authentication should have a user');
        assert.ok(
          event.service || event.dst_endpoint,
          'Authentication should have service or dst_endpoint',
        );
      }
    }
  });

  // ============================================================================
  // Compliance Verification
  // ============================================================================

  test('PCI DSS 10.2.1 - Checkout activity logged', async () => {
    const hasCheckout = getCapturedAuditEvents().some(
      (e) => e.activity_name === 'Checkout' || e.message?.toLowerCase().includes('checkout'),
    );

    assert.ok(hasCheckout, 'Should log checkout activity (access to payment flow)');
  });

  test('GDPR Article 30 - Processing activities tracked', async () => {
    const apiEvents = getCapturedAuditEvents().filter((e) => e.class_uid === OCSF_CLASS.API_ACTIVITY);

    assert.ok(apiEvents.length >= 1, 'Should track data processing activities');
  });
});
