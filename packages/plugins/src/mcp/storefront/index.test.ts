import assert from 'node:assert/strict';
import { test } from 'node:test';
import { createProductSearchTool, createStorefrontMcpPlugin } from './index.ts';

test('refuses to register two storefront tools with the same name', () => {
  const search = createProductSearchTool({ productUrl: ({ productId }) => `/products/${productId}` });
  assert.throws(
    () =>
      createStorefrontMcpPlugin({
        shopName: 'Shop',
        tools: [search, search],
      }),
    /unique/,
  );
});
