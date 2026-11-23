import { resolve } from 'node:path';
import type { AdminUIPluginConfig } from '@unchainedshop/api/fastify';

export const storefrontMcpAdminBundlePath = resolve(
  import.meta.dirname,
  '../../../admin-plugins/storefront-mcp/dist/index.js',
);

export const storefrontMcpAdminPlugin = ({ label = 'Assistants' } = {}): AdminUIPluginConfig => ({
  name: 'storefront-mcp',
  version: '1.0.0',
  bundlePath: storefrontMcpAdminBundlePath,
  slots: {
    'filter:tabs': [{ label, component: 'StorefrontMcpFilterTab' }],
  },
});
