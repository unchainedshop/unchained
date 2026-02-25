import { test, type Page } from '@playwright/test';
import path from 'path';

const ASSETS = path.resolve(__dirname, '../docs/assets');
const SCREENSHOTS = path.resolve(__dirname, '../screenshots');
const GRAPHQL = 'http://localhost:4010/graphql';

async function shot(page: Page, name: string, dir = ASSETS) {
  await page.waitForLoadState('networkidle');
  await page.waitForTimeout(500);
  await page.screenshot({ path: path.join(dir, name) });
}

async function gql(page: Page, query: string, variables: Record<string, unknown> = {}) {
  const res = await page.request.post(GRAPHQL, {
    data: { query, variables },
  });
  return res.json();
}

async function navigateAndWait(page: Page, url: string) {
  await page.goto(url);
  await page.waitForLoadState('networkidle');
  await page.waitForTimeout(500);
}

test('take all admin-ui screenshots', async ({ page }) => {
  test.setTimeout(10 * 60 * 1000);

  // ─── Pre-auth screenshots ───────────────────────────────────────────

  await navigateAndWait(page, '/log-in');
  await shot(page, 'sandbox-login.png');

  await navigateAndWait(page, '/sign-up');
  await shot(page, 'sign-up-form.png');

  // ─── Login ──────────────────────────────────────────────────────────

  await navigateAndWait(page, '/log-in');
  await page.fill('#username-or-email', 'admin@unchained.local');
  await page.click('button#submit');
  await page.waitForSelector('#password', { state: 'visible' });
  await page.fill('#password', 'password');
  await page.click('button#submit');
  await page.waitForURL('**/');
  await page.waitForLoadState('networkidle');
  await page.waitForTimeout(1000);

  // ─── Seed data via GraphQL ──────────────────────────────────────────

  const { data: simpleData } = await gql(page, `
    mutation {
      createProduct(
        product: { type: SIMPLE_PRODUCT, tags: ["doc-screenshot"] }
        texts: [{ title: "Demo Simple Product", locale: "en", slug: "demo-simple-product" }]
      ) { _id sequence }
    }
  `);
  const simpleProductId = simpleData.createProduct._id;
  const simpleSlug = 'demo-simple-product';

  await gql(page, `mutation { publishProduct(productId: "${simpleProductId}") { _id status } }`);

  const { data: bundleData } = await gql(page, `
    mutation {
      createProduct(
        product: { type: BUNDLE_PRODUCT, tags: ["doc-screenshot"] }
        texts: [{ title: "Demo Bundle Product", locale: "en", slug: "demo-bundle-product" }]
      ) { _id }
    }
  `);
  const bundleSlug = 'demo-bundle-product';

  const { data: configData } = await gql(page, `
    mutation {
      createProduct(
        product: { type: CONFIGURABLE_PRODUCT, tags: ["doc-screenshot"] }
        texts: [{ title: "Demo Configurable Product", locale: "en", slug: "demo-configurable-product" }]
      ) { _id }
    }
  `);
  const configSlug = 'demo-configurable-product';

  const { data: tokenData } = await gql(page, `
    mutation {
      createProduct(
        product: { type: TOKENIZED_PRODUCT, tags: ["doc-screenshot"] }
        texts: [{ title: "Demo Token Product", locale: "en", slug: "demo-token-product" }]
      ) { _id }
    }
  `);
  const tokenSlug = 'demo-token-product';

  const { data: assortmentData } = await gql(page, `
    mutation {
      createAssortment(
        assortment: { isRoot: true, tags: ["doc-screenshot"] }
        texts: [{ title: "Demo Assortment", locale: "en", slug: "demo-assortment" }]
      ) { _id }
    }
  `);
  const assortmentSlug = 'demo-assortment';

  const { data: filterData } = await gql(page, `
    mutation {
      createFilter(
        filter: { key: "tags", type: MULTI_CHOICE, options: ["option-a", "option-b"] }
        texts: [{ title: "Demo Filter", locale: "en" }]
      ) { _id }
    }
  `);
  const filterId = filterData.createFilter._id;

  const { data: cartData } = await gql(page, `
    mutation {
      createCart(orderNumber: "DOC-SCREENSHOT-001") { _id orderNumber }
    }
  `);
  const orderId = cartData.createCart._id;

  const { data: workData } = await gql(page, `
    mutation {
      addWork(type: HEARTBEAT) { _id }
    }
  `);
  const workerId = workData.addWork._id;

  // ─── Dashboard ──────────────────────────────────────────────────────

  await navigateAndWait(page, '/');
  await shot(page, 'home.png');
  await shot(page, 'admin-ui-1.png', SCREENSHOTS);

  // ─── Products list ──────────────────────────────────────────────────

  await navigateAndWait(page, '/products');
  await shot(page, 'products-list.png');

  // New product page
  await navigateAndWait(page, '/products/new');
  await shot(page, 'new-product.png');
  await shot(page, 'new-product-form.png');

  // ─── Simple Product detail & tabs ───────────────────────────────────

  await navigateAndWait(page, `/products?slug=${simpleSlug}`);
  await shot(page, 'product-form.png');
  await shot(page, 'product-detail-2.png');

  // Texts tab
  await navigateAndWait(page, `/products?slug=${simpleSlug}&tab=texts`);
  await shot(page, 'product-text-setting.png');

  // Media tab
  await navigateAndWait(page, `/products?slug=${simpleSlug}&tab=media`);
  await shot(page, 'product-media-setting.png');

  // Commerce tab (pricing)
  await navigateAndWait(page, `/products?slug=${simpleSlug}&tab=commerce`);
  await shot(page, 'product-price-setting.png');

  // Supply tab
  await navigateAndWait(page, `/products?slug=${simpleSlug}&tab=supply`);
  await shot(page, 'product-supply-setting.png');

  // Warehousing tab
  await navigateAndWait(page, `/products?slug=${simpleSlug}&tab=warehousing`);
  await shot(page, 'product-warehousing-setting.png');

  // Tags & sequence - from the main detail view header area
  await navigateAndWait(page, `/products?slug=${simpleSlug}`);
  await shot(page, 'product-tag-settings.png');
  await shot(page, 'product-sequence-setting.png');
  await shot(page, 'product-sequence.png');

  // Publish draft product - check for publish button/dropdown
  await shot(page, 'publish-draft-product.png');

  // ─── Bundle Product ─────────────────────────────────────────────────

  await navigateAndWait(page, `/products?slug=${bundleSlug}&tab=bundled_products`);
  await shot(page, 'product-bundle-setting.png');

  // ─── Configurable Product ───────────────────────────────────────────

  await navigateAndWait(page, `/products?slug=${configSlug}&tab=variations`);
  await shot(page, 'product-variation-setting.png');
  await shot(page, 'product-variation-create-setting.png');

  await navigateAndWait(page, `/products?slug=${configSlug}&tab=assignments`);
  await shot(page, 'product-variation-assignment.png');

  // ─── Tokenized Product ──────────────────────────────────────────────

  await navigateAndWait(page, `/products?slug=${tokenSlug}&tab=token`);
  await shot(page, 'token-setting.png');

  // ─── Assortments ────────────────────────────────────────────────────

  await navigateAndWait(page, '/assortments');
  await shot(page, 'assortment-list.png');

  // New assortment form - click the "add" button on the list page
  const addAssortmentBtn = page.locator('a[href*="/assortments"], button').filter({ hasText: /add|new|create/i }).first();
  if (await addAssortmentBtn.isVisible()) {
    await addAssortmentBtn.click();
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(500);
  }
  await shot(page, 'new-assortment-form.png');

  // Assortment detail
  await navigateAndWait(page, `/assortments?assortmentSlug=${assortmentSlug}`);
  await shot(page, 'assortment-detail-page.png');
  await shot(page, 'assortment-form.png');
  await shot(page, 'assortment-activate-deactivate.png');
  await shot(page, 'assortment-leaf-and-root-toggle.png');

  // Assortment tabs
  await navigateAndWait(page, `/assortments?assortmentSlug=${assortmentSlug}&tab=texts`);
  await shot(page, 'assortment-text-setting.png');
  await shot(page, 'assortment-tag-setting.png');

  await navigateAndWait(page, `/assortments?assortmentSlug=${assortmentSlug}&tab=media`);
  await shot(page, 'assortment-media-setting.png');

  await navigateAndWait(page, `/assortments?assortmentSlug=${assortmentSlug}&tab=filters`);
  await shot(page, 'image.png');

  await navigateAndWait(page, `/assortments?assortmentSlug=${assortmentSlug}&tab=links`);
  await shot(page, 'assortment-link-setting.png');

  await navigateAndWait(page, `/assortments?assortmentSlug=${assortmentSlug}&tab=products`);
  await shot(page, 'assortment-product-setting.png');

  // ─── Orders ─────────────────────────────────────────────────────────

  await navigateAndWait(page, '/orders');
  await shot(page, 'orders-list.png');

  await navigateAndWait(page, `/orders?orderId=${orderId}`);
  await shot(page, 'order-detail.png');
  await shot(page, 'admin-ui-2.png', SCREENSHOTS);

  // Payment flow screenshots from order detail
  // Look for add payment button/link
  const addPaymentBtn = page.locator('button, a').filter({ hasText: /payment/i }).first();
  if (await addPaymentBtn.isVisible()) {
    await shot(page, 'add-payment-step-1.png');
    await addPaymentBtn.click();
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(500);
    await shot(page, 'add-payment-step-2.png');
    // Try to find next step
    const nextPaymentBtn = page.locator('button[type="submit"], button').filter({ hasText: /next|continue|save|confirm/i }).first();
    if (await nextPaymentBtn.isVisible()) {
      await nextPaymentBtn.click();
      await page.waitForLoadState('networkidle');
      await page.waitForTimeout(500);
    }
    await shot(page, 'add-payment-step-3.png');
  }

  // Delivery flow screenshots
  await navigateAndWait(page, `/orders?orderId=${orderId}`);
  const addDeliveryBtn = page.locator('button, a').filter({ hasText: /delivery/i }).first();
  if (await addDeliveryBtn.isVisible()) {
    await shot(page, 'add-delivery-step-1.png');
    await addDeliveryBtn.click();
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(500);
    await shot(page, 'add-delivery-step-2.png');
  }

  // ─── Users ──────────────────────────────────────────────────────────

  await navigateAndWait(page, '/users');
  await shot(page, 'users-list.png');

  // Get the admin user ID
  const { data: meData } = await gql(page, `query { me { _id } }`);
  const userId = meData.me._id;

  // New user form
  await navigateAndWait(page, '/users/new');
  await shot(page, 'new-user-form.png');

  // User detail tabs
  await navigateAndWait(page, `/users?userId=${userId}&tab=profile`);
  await shot(page, 'user-profile-setting.png');

  await navigateAndWait(page, `/users?userId=${userId}&tab=account`);
  await shot(page, 'user-account-setting-1.png');
  await shot(page, 'manage-web3-addresses.png');
  await shot(page, 'set-password.png');
  await shot(page, 'create-user-authenticator.png');

  // ─── Currencies ─────────────────────────────────────────────────────

  await navigateAndWait(page, '/currency');
  await shot(page, 'currencies-list.png');

  // Try clicking new/add button for currency
  const addCurrencyBtn = page.locator('a, button').filter({ hasText: /add|new|create/i }).first();
  if (await addCurrencyBtn.isVisible()) {
    await addCurrencyBtn.click();
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(500);
  }
  await shot(page, 'new-currency-form.png');

  // Get a currency ID to show edit view
  const { data: currenciesData } = await gql(page, `query { currencies { _id } }`);
  if (currenciesData?.currencies?.length) {
    const currencyId = currenciesData.currencies[0]._id;
    await navigateAndWait(page, `/currency?currencyId=${currencyId}`);
    await shot(page, 'edit-currency.png');
  }

  // ─── Languages ──────────────────────────────────────────────────────

  await navigateAndWait(page, '/language');
  await shot(page, 'language-list.png');

  const addLanguageBtn = page.locator('a, button').filter({ hasText: /add|new|create/i }).first();
  if (await addLanguageBtn.isVisible()) {
    await addLanguageBtn.click();
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(500);
  }
  await shot(page, 'new-language.png');

  const { data: languagesData } = await gql(page, `query { languages { _id } }`);
  if (languagesData?.languages?.length) {
    const languageId = languagesData.languages[0]._id;
    await navigateAndWait(page, `/language?languageId=${languageId}`);
    await shot(page, 'edit-language.png');
  }

  // ─── Countries ──────────────────────────────────────────────────────

  await navigateAndWait(page, '/country');
  await shot(page, 'countries-list.png');

  const addCountryBtn = page.locator('a, button').filter({ hasText: /add|new|create/i }).first();
  if (await addCountryBtn.isVisible()) {
    await addCountryBtn.click();
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(500);
  }
  await shot(page, 'new-country-form.png');

  const { data: countriesData } = await gql(page, `query { countries { _id } }`);
  if (countriesData?.countries?.length) {
    const countryId = countriesData.countries[0]._id;
    await navigateAndWait(page, `/country?countryId=${countryId}`);
    await shot(page, 'edit-country.png');
  }

  // ─── Payment Providers ──────────────────────────────────────────────

  await navigateAndWait(page, '/payment-provider');
  await shot(page, 'payment-provider-list.png');

  const addPaymentProviderBtn = page.locator('a, button').filter({ hasText: /add|new|create/i }).first();
  if (await addPaymentProviderBtn.isVisible()) {
    await addPaymentProviderBtn.click();
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(500);
  }
  await shot(page, 'new-payment-provider.png');

  const { data: ppData } = await gql(page, `query { paymentProviders { _id } }`);
  if (ppData?.paymentProviders?.length) {
    const ppId = ppData.paymentProviders[0]._id;
    await navigateAndWait(page, `/payment-provider?paymentProviderId=${ppId}`);
    await shot(page, 'edit-payment-provider.png');
  }

  // ─── Delivery Providers ─────────────────────────────────────────────

  await navigateAndWait(page, '/delivery-provider');
  await shot(page, 'delivery-provider-list.png');

  const addDeliveryProviderBtn = page.locator('a, button').filter({ hasText: /add|new|create/i }).first();
  if (await addDeliveryProviderBtn.isVisible()) {
    await addDeliveryProviderBtn.click();
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(500);
  }
  await shot(page, 'new-delivery-provider-form.png');

  const { data: dpData } = await gql(page, `query { deliveryProviders { _id } }`);
  if (dpData?.deliveryProviders?.length) {
    const dpId = dpData.deliveryProviders[0]._id;
    await navigateAndWait(page, `/delivery-provider?deliveryProviderId=${dpId}`);
    await shot(page, 'edit-delivery-provider.png');
  }

  // ─── Warehousing Providers ──────────────────────────────────────────

  await navigateAndWait(page, '/warehousing-provider');
  await shot(page, 'warehousing-provider-list.png');

  const addWarehouseBtn = page.locator('a, button').filter({ hasText: /add|new|create/i }).first();
  if (await addWarehouseBtn.isVisible()) {
    await addWarehouseBtn.click();
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(500);
  }
  await shot(page, 'new-warehousing-provider.png');

  const { data: wpData } = await gql(page, `query { warehousingProviders { _id } }`);
  if (wpData?.warehousingProviders?.length) {
    const wpId = wpData.warehousingProviders[0]._id;
    await navigateAndWait(page, `/warehousing-provider?warehousingProviderId=${wpId}`);
    await shot(page, 'edit-warehousing-provider.png');
  }

  // ─── Filters ────────────────────────────────────────────────────────

  await navigateAndWait(page, '/filters');
  await shot(page, 'filters-list.png');

  // New filter form
  const addFilterBtn = page.locator('a, button').filter({ hasText: /add|new|create/i }).first();
  if (await addFilterBtn.isVisible()) {
    await addFilterBtn.click();
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(500);
  }
  await shot(page, 'new-filter-form.png');

  // Filter detail tabs
  await navigateAndWait(page, `/filters?filterId=${filterId}&tab=texts`);
  await shot(page, 'filter-detail-text.png');

  await navigateAndWait(page, `/filters?filterId=${filterId}`);
  await shot(page, 'filter-activate-deactivate.png');
  await shot(page, 'filter-edit-option.png');
  await shot(page, 'filter-add-option.png');

  // ─── Work Queue ─────────────────────────────────────────────────────

  await navigateAndWait(page, '/works');
  await shot(page, 'work-queue-list.png');

  await navigateAndWait(page, `/works?workerId=${workerId}`);
  await shot(page, 'work-detail.png');
  await shot(page, 'delete-work.png');

  // Work management page
  await navigateAndWait(page, '/works/management');
  await shot(page, 'add-work-form.png');

  await navigateAndWait(page, '/works/management?tab=allocate_work');
  await shot(page, 'allocate-work-form.png');

  // ─── Events ─────────────────────────────────────────────────────────

  await navigateAndWait(page, '/events');
  await shot(page, 'events-list.png');

  // Get an event ID from the list
  const { data: eventsData } = await gql(page, `query { events(limit: 1) { _id } }`);
  if (eventsData?.events?.length) {
    const eventId = eventsData.events[0]._id;
    await navigateAndWait(page, `/events?eventId=${eventId}`);
    await shot(page, 'event-detail.png');
  }

  // ─── General screenshots ────────────────────────────────────────────

  await navigateAndWait(page, '/products');
  await shot(page, 'admin-ui-3.png', SCREENSHOTS);
});
