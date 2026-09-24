import {
  setupDatabase,
  createLoggedInGraphqlFetch,
  createAnonymousGraphqlFetch,
  disconnect,
} from './helpers.js';
import { ADMIN_TOKEN, USER_TOKEN } from './seeds/users.js';
import assert from 'node:assert';
import test from 'node:test';

let graphqlFetch;
let graphqlNormalUserFetch;
let graphqlAnonymousFetch;

test.describe('Shop Settings', () => {
  test.before(async () => {
    await setupDatabase();
    graphqlFetch = createLoggedInGraphqlFetch(ADMIN_TOKEN);
    graphqlNormalUserFetch = createLoggedInGraphqlFetch(USER_TOKEN);
    graphqlAnonymousFetch = createAnonymousGraphqlFetch();
  });

  test.after(async () => {
    await disconnect();
  });

  test.describe('shopSettingsNamespaces query', () => {
    test('admin can list registered namespaces', async () => {
      const { data, errors } = await graphqlFetch({
        query: /* GraphQL */ `
          query {
            shopSettingsNamespaces
          }
        `,
      });
      assert.ifError(errors?.[0]);
      assert.ok(Array.isArray(data.shopSettingsNamespaces));
      assert.ok(data.shopSettingsNamespaces.includes('TEST_GENERAL'));
      assert.ok(data.shopSettingsNamespaces.includes('TEST_PUBLIC'));
    });

    test('anonymous user gets auth error', async () => {
      const { errors } = await graphqlAnonymousFetch({
        query: /* GraphQL */ `
          query {
            shopSettingsNamespaces
          }
        `,
      });
      assert.ok(errors?.length > 0);
      assert.strictEqual(errors[0].extensions.code, 'NoPermissionError');
    });
  });

  test.describe('shopSettingsSchema query', () => {
    test('admin gets JSON schema for registered namespace', async () => {
      const { data, errors } = await graphqlFetch({
        query: /* GraphQL */ `
          query ShopSettingsSchema($namespace: SettingsNamespace!) {
            shopSettingsSchema(namespace: $namespace)
          }
        `,
        variables: { namespace: 'TEST_GENERAL' },
      });
      assert.ifError(errors?.[0]);
      assert.ok(data.shopSettingsSchema);
      assert.strictEqual(data.shopSettingsSchema.type, 'object');
      assert.ok(data.shopSettingsSchema.properties?.siteName);
      assert.ok(data.shopSettingsSchema.properties?.maintenanceMode);
      assert.ok(data.shopSettingsSchema.properties?.maxItemsPerOrder);
    });

    test('returns null for unknown namespace', async () => {
      const { data, errors } = await graphqlFetch({
        query: /* GraphQL */ `
          query ShopSettingsSchema($namespace: SettingsNamespace!) {
            shopSettingsSchema(namespace: $namespace)
          }
        `,
        variables: { namespace: 'UNKNOWN' },
      });
      assert.ifError(errors?.[0]);
      assert.strictEqual(data.shopSettingsSchema, null);
    });

    test('anonymous user gets auth error', async () => {
      const { errors } = await graphqlAnonymousFetch({
        query: /* GraphQL */ `
          query ShopSettingsSchema($namespace: SettingsNamespace!) {
            shopSettingsSchema(namespace: $namespace)
          }
        `,
        variables: { namespace: 'TEST_GENERAL' },
      });
      assert.ok(errors?.length > 0);
      assert.strictEqual(errors[0].extensions.code, 'NoPermissionError');
    });
  });

  test.describe('updateShopSettings mutation', () => {
    test('admin can update settings for registered namespace', async () => {
      const { data, errors } = await graphqlFetch({
        query: /* GraphQL */ `
          mutation UpdateShopSettings($namespace: SettingsNamespace!, $value: JSON!) {
            updateShopSettings(namespace: $namespace, value: $value)
          }
        `,
        variables: {
          namespace: 'TEST_GENERAL',
          value: { siteName: 'Updated Shop', maintenanceMode: true, maxItemsPerOrder: 50 },
        },
      });
      assert.ifError(errors?.[0]);
      assert.deepStrictEqual(data.updateShopSettings, {
        siteName: 'Updated Shop',
        maintenanceMode: true,
        maxItemsPerOrder: 50,
      });
    });

    test('applies schema defaults for omitted fields', async () => {
      const { data, errors } = await graphqlFetch({
        query: /* GraphQL */ `
          mutation UpdateShopSettings($namespace: SettingsNamespace!, $value: JSON!) {
            updateShopSettings(namespace: $namespace, value: $value)
          }
        `,
        variables: {
          namespace: 'TEST_GENERAL',
          value: { siteName: 'Partial Update' },
        },
      });
      assert.ifError(errors?.[0]);
      assert.strictEqual(data.updateShopSettings.siteName, 'Partial Update');
      assert.strictEqual(data.updateShopSettings.maintenanceMode, false);
      assert.strictEqual(data.updateShopSettings.maxItemsPerOrder, 99);
    });

    test('rejects update for unregistered namespace', async () => {
      const { errors } = await graphqlFetch({
        query: /* GraphQL */ `
          mutation UpdateShopSettings($namespace: SettingsNamespace!, $value: JSON!) {
            updateShopSettings(namespace: $namespace, value: $value)
          }
        `,
        variables: {
          namespace: 'UNKNOWN',
          value: { foo: 'bar' },
        },
      });
      assert.ok(errors?.length > 0);
      assert.strictEqual(errors[0].extensions.code, 'SettingsNamespaceNotFoundError');
    });

    test('rejects invalid value against schema', async () => {
      const { errors } = await graphqlFetch({
        query: /* GraphQL */ `
          mutation UpdateShopSettings($namespace: SettingsNamespace!, $value: JSON!) {
            updateShopSettings(namespace: $namespace, value: $value)
          }
        `,
        variables: {
          namespace: 'TEST_GENERAL',
          value: { siteName: 123, maintenanceMode: 'not-a-bool' },
        },
      });
      assert.ok(errors?.length > 0);
      assert.strictEqual(errors[0].extensions.code, 'SettingsValidationError');
    });

    test('anonymous user gets auth error', async () => {
      const { errors } = await graphqlAnonymousFetch({
        query: /* GraphQL */ `
          mutation UpdateShopSettings($namespace: SettingsNamespace!, $value: JSON!) {
            updateShopSettings(namespace: $namespace, value: $value)
          }
        `,
        variables: {
          namespace: 'TEST_GENERAL',
          value: { siteName: 'Hacked' },
        },
      });
      assert.ok(errors?.length > 0);
      assert.strictEqual(errors[0].extensions.code, 'NoPermissionError');
    });

    test('non-admin user gets auth error', async () => {
      const { errors } = await graphqlNormalUserFetch({
        query: /* GraphQL */ `
          mutation UpdateShopSettings($namespace: SettingsNamespace!, $value: JSON!) {
            updateShopSettings(namespace: $namespace, value: $value)
          }
        `,
        variables: {
          namespace: 'TEST_GENERAL',
          value: { siteName: 'Unauthorized' },
        },
      });
      assert.ok(errors?.length > 0);
      assert.strictEqual(errors[0].extensions.code, 'NoPermissionError');
    });
  });

  test.describe('Shop.settings field', () => {
    test.before(async () => {
      await graphqlFetch({
        query: /* GraphQL */ `
          mutation UpdateShopSettings($namespace: SettingsNamespace!, $value: JSON!) {
            updateShopSettings(namespace: $namespace, value: $value)
          }
        `,
        variables: {
          namespace: 'TEST_PUBLIC',
          value: { welcomeMessage: 'Hello World', showBanner: false },
        },
      });
      await graphqlFetch({
        query: /* GraphQL */ `
          mutation UpdateShopSettings($namespace: SettingsNamespace!, $value: JSON!) {
            updateShopSettings(namespace: $namespace, value: $value)
          }
        `,
        variables: {
          namespace: 'TEST_GENERAL',
          value: { siteName: 'Test Shop', maintenanceMode: false, maxItemsPerOrder: 42 },
        },
      });
    });

    test('admin can read public namespace settings via shopInfo', async () => {
      const { data, errors } = await graphqlFetch({
        query: /* GraphQL */ `
          query ShopSettings($namespace: SettingsNamespace!) {
            shopInfo {
              settings(namespace: $namespace)
            }
          }
        `,
        variables: { namespace: 'TEST_PUBLIC' },
      });
      assert.ifError(errors?.[0]);
      assert.deepStrictEqual(data.shopInfo.settings, {
        welcomeMessage: 'Hello World',
        showBanner: false,
      });
    });

    test('admin can read private namespace settings via shopInfo', async () => {
      const { data, errors } = await graphqlFetch({
        query: /* GraphQL */ `
          query ShopSettings($namespace: SettingsNamespace!) {
            shopInfo {
              settings(namespace: $namespace)
            }
          }
        `,
        variables: { namespace: 'TEST_GENERAL' },
      });
      assert.ifError(errors?.[0]);
      assert.deepStrictEqual(data.shopInfo.settings, {
        siteName: 'Test Shop',
        maintenanceMode: false,
        maxItemsPerOrder: 42,
      });
    });

    test('anonymous user can read public namespace settings', async () => {
      const { data, errors } = await graphqlAnonymousFetch({
        query: /* GraphQL */ `
          query ShopSettings($namespace: SettingsNamespace!) {
            shopInfo {
              settings(namespace: $namespace)
            }
          }
        `,
        variables: { namespace: 'TEST_PUBLIC' },
      });
      assert.ifError(errors?.[0]);
      assert.deepStrictEqual(data.shopInfo.settings, {
        welcomeMessage: 'Hello World',
        showBanner: false,
      });
    });

    test('anonymous user gets auth error for private namespace settings', async () => {
      const { errors } = await graphqlAnonymousFetch({
        query: /* GraphQL */ `
          query ShopSettings($namespace: SettingsNamespace!) {
            shopInfo {
              settings(namespace: $namespace)
            }
          }
        `,
        variables: { namespace: 'TEST_GENERAL' },
      });
      assert.ok(errors?.length > 0);
    });

    test('returns null for unregistered namespace', async () => {
      const { data, errors } = await graphqlFetch({
        query: /* GraphQL */ `
          query ShopSettings($namespace: SettingsNamespace!) {
            shopInfo {
              settings(namespace: $namespace)
            }
          }
        `,
        variables: { namespace: 'UNKNOWN' },
      });
      assert.ifError(errors?.[0]);
      assert.strictEqual(data.shopInfo.settings, null);
    });
  });
});
