import assert from 'node:assert';
import test from 'node:test';
import { getServerBaseUrl, setupDatabase } from './helpers.js';
import { assertCheckout, assertValid } from './ucp/checks.js';
import { CHECKOUT, DISCOUNT, FULFILLMENT, startFakePlatform } from './ucp/platform.js';

const line = { item: { id: 'simpleproduct' }, quantity: 1 };

test.describe('UCP discovery and negotiation', () => {
  let platform;

  test.before(async () => {
    await setupDatabase();
    platform = await startFakePlatform();
  });

  test.after(async () => {
    await platform.close();
  });

  test('serves a cacheable 2026-08-25 business profile without the 3DS extension', async () => {
    const response = await fetch(`${getServerBaseUrl()}/.well-known/ucp`, { redirect: 'manual' });
    assert.equal(response.status, 200);
    assert.equal(response.headers.get('cache-control'), 'public, max-age=300');
    const profile = await response.json();
    assertValid('businessProfile', profile);
    assert.equal(profile.ucp.version, '2026-08-25');
    assert.deepEqual(Object.keys(profile.ucp.capabilities).sort(), [
      'dev.ucp.shopping.checkout',
      'dev.ucp.shopping.discount',
      'dev.ucp.shopping.fulfillment',
      'dev.ucp.shopping.order',
    ]);
    assert.equal(profile.ucp.services['dev.ucp.shopping'][0].endpoint, `${getServerBaseUrl()}/ucp`);
    assert.deepEqual(
      profile.ucp.payment_handlers['shop.unchained.payment.invoice'].map(({ id }) => id).sort(),
      ['prepaid-payment-provider', 'simple-payment-provider'],
    );
    assert.equal(profile.keys[0].alg, 'ES256');

    const revalidated = await fetch(`${getServerBaseUrl()}/.well-known/ucp`, {
      headers: { 'if-none-match': response.headers.get('etag') },
    });
    assert.equal(revalidated.status, 304);
  });

  test('the fake platform publishes a valid platform profile', () => {
    assertValid('platformProfile', platform.profile().document);
  });

  test('refuses requests without a platform profile', async () => {
    const response = await fetch(`${getServerBaseUrl()}/ucp/checkout-sessions`, {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ line_items: [line] }),
    });
    assert.equal(response.status, 400);
    assert.equal((await response.json()).code, 'invalid_profile_url');
  });

  test('refuses other protocol versions', async () => {
    const { status, body } = await platform.client(platform.profile({ version: '2026-04-08' }).url)(
      'POST',
      '/checkout-sessions',
      { line_items: [line] },
    );
    assert.equal(status, 422);
    assert.equal(body.code, 'version_unsupported');
  });

  test('answers only the negotiated capabilities', async () => {
    const withoutDiscount = platform.client(
      platform.profile({ capabilities: [CHECKOUT, FULFILLMENT] }).url,
    );
    const { status, body } = await withoutDiscount('POST', '/checkout-sessions', { line_items: [line] });
    assert.equal(status, 201);
    assertCheckout(body);
    assert.deepEqual(Object.keys(body.ucp.capabilities).sort(), [CHECKOUT, FULFILLMENT]);
    assert.ok(body.fulfillment);
    assert.equal(body.discounts, undefined);

    const orphans = platform.client(platform.profile({ capabilities: [FULFILLMENT, DISCOUNT] }).url);
    const pruned = await orphans('POST', '/checkout-sessions', { line_items: [line] });
    assert.equal(pruned.status, 201);
    assert.deepEqual(pruned.body.ucp.capabilities, {});
    assert.equal(pruned.body.fulfillment, undefined);
    assert.ok(pruned.body.messages.some(({ code }) => code === 'fulfillment_required'));
  });

  test('fails closed when the platform profile cannot be used', async () => {
    const cases = [
      [
        platform.serve({ status: 302, headers: { location: platform.profile().url } }),
        424,
        'profile_unreachable',
      ],
      [platform.serve({ status: 404 }), 424, 'profile_unreachable'],
      [
        platform.serve({ body: JSON.stringify({ ucp: {}, padding: 'x'.repeat(300 * 1024) }) }),
        424,
        'profile_unreachable',
      ],
      [platform.serve({ body: 'not json' }), 422, 'profile_malformed'],
      [
        platform.serve({ body: JSON.stringify({ ucp: { version: '2026-08-25' } }) }),
        422,
        'profile_malformed',
      ],
      ['https://10.0.0.1/profile.json', 424, 'profile_unreachable'],
      ['https://[::ffff:127.0.0.1]/profile.json', 424, 'profile_unreachable'],
      ['http://example.com/profile.json', 400, 'invalid_profile_url'],
    ];
    for (const [url, expectedStatus, code] of cases) {
      const { status, body } = await platform.client(url)('POST', '/checkout-sessions', {
        line_items: [line],
      });
      assert.equal(status, expectedStatus, url);
      assert.equal(body.code, code, url);
    }
  });
});
