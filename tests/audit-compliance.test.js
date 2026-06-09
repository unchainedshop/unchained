/**
 * Audit Log Compliance Integration Test
 *
 * Verifies that security-relevant events are properly captured
 * in the OCSF-compliant audit log during a complete e-commerce flow:
 *
 * 1. Add product to cart
 * 2. Update cart with billing/contact
 * 3. Checkout
 * 4. Verify all audit entries exist in MongoDB
 *
 * Uses the platform's built-in audit log (configured in startPlatform).
 */

import { createLoggedInGraphqlFetch, disconnect, setupDatabase } from './helpers.js';
import { SimpleProduct } from './seeds/products.js';
import assert from 'node:assert';
import test from 'node:test';

import { getAuditLogInstance, OCSF_CLASS, OCSF_API_ACTIVITY } from '@unchainedshop/events';

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
            items {
              _id
              product {
                _id
              }
            }
          }
        }
      `,
      variables: {
        orderId,
        productId: SimpleProduct._id,
      },
    });

    assert.ok(addCartProduct, 'Product should be added to cart');
    assert.ok(addCartProduct.items.length >= 1, 'Cart should have at least one item');

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
  // Verify Audit Trail (reads from platform's audit log in MongoDB)
  // ============================================================================

  test('Audit: should have all required entries in MongoDB', async () => {
    const auditLog = getAuditLogInstance();
    const allEntries = await auditLog.find({ limit: 1000 });

    const apiEntries = allEntries.filter((e) => e.class_uid === OCSF_CLASS.API_ACTIVITY);
    assert.ok(apiEntries.length >= 3, 'Should have API activity entries (order, add, checkout)');

    for (const entry of allEntries) {
      assert.ok(entry.class_uid, 'Entry should have class_uid');
      assert.ok(entry.category_uid, 'Entry should have category_uid');
      assert.ok(entry.activity_id !== undefined, 'Entry should have activity_id');
      assert.ok(entry.time, 'Entry should have timestamp');
      assert.ok(entry.metadata, 'Entry should have metadata');
      assert.ok(entry.metadata.version, 'Entry should have OCSF version');
      assert.ok(entry.unmapped, 'Entry should have hash chain data');
      assert.ok(entry.unmapped.seq, 'Entry should have sequence number');
      assert.ok(entry.unmapped.hash, 'Entry should have hash');
      assert.ok(entry.unmapped.prev_hash, 'Entry should have prev_hash');
    }
  });

  test('Audit: should verify hash chain integrity', async () => {
    const auditLog = getAuditLogInstance();
    const result = await auditLog.verify();

    assert.strictEqual(result.valid, true, 'Hash chain should be valid');
    assert.ok(result.entries > 0, 'Should have verified entries');
    assert.strictEqual(result.entries, result.verified, 'All entries should be verified');
  });

  test('Audit: should have sequential sequence numbers (no gaps)', async () => {
    const auditLog = getAuditLogInstance();
    const entries = await auditLog.find({ limit: 1000 });

    for (let i = 0; i < entries.length - 1; i++) {
      const expected = (entries[i + 1].unmapped?.seq || 0) + 1;
      assert.strictEqual(
        entries[i].unmapped?.seq,
        expected,
        `Sequence ${entries[i].unmapped?.seq} should follow ${entries[i + 1].unmapped?.seq}`,
      );
    }
  });

  test('Audit: should be able to count entries', async () => {
    const auditLog = getAuditLogInstance();
    const total = await auditLog.count({});

    assert.ok(total >= 3, 'Should have at least 3 audit entries for checkout flow');
  });

  // ============================================================================
  // Compliance Verification
  // ============================================================================

  test('PCI DSS 10.2.1 - Checkout activity logged', async () => {
    const auditLog = getAuditLogInstance();
    const entries = await auditLog.find({ limit: 1000 });

    const hasCheckout = entries.some(
      (e) =>
        e.activity_id === OCSF_API_ACTIVITY.CHECKOUT || e.message?.toLowerCase().includes('checkout'),
    );

    assert.ok(hasCheckout, 'Should log checkout activity (access to payment flow)');
  });

  test('SOC 2 - Audit trail integrity (hash chain valid)', async () => {
    const auditLog = getAuditLogInstance();
    const result = await auditLog.verify();

    assert.strictEqual(result.valid, true, 'Audit trail should be tamper-evident (hash chain valid)');
  });

  test('GDPR Article 30 - Processing activities tracked', async () => {
    const auditLog = getAuditLogInstance();
    const apiEntries = await auditLog.find({
      classUids: [OCSF_CLASS.API_ACTIVITY],
      limit: 50,
    });

    assert.ok(apiEntries.length >= 1, 'Should track data processing activities');
  });
});
