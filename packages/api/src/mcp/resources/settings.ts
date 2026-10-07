import type { McpServer } from '@modelcontextprotocol/server';
import type { Context } from '../../context.ts';
import { createLogger } from '@unchainedshop/logger';

const logger = createLogger('unchained:api:mcp');

export async function getShopSettingsText(context: Context): Promise<string> {
  const namespaces = context.modules.settings.getRegisteredNamespaces();

  const entries = await Promise.all(
    namespaces.map(async (namespace) => {
      const value = await context.modules.settings.get(namespace);
      const definition = context.modules.settings.getNamespaceDefinition(namespace);
      return {
        namespace,
        public: definition?.public ?? false,
        value,
      };
    }),
  );

  return JSON.stringify(
    {
      settings: entries,
      note: 'Use updateShopSettings mutation with the namespace and value to update settings. Use shopSettingsSchema query to get the JSON Schema for a namespace.',
    },
    null,
    2,
  );
}

export async function buildSettingsChatResourceContext(context: Context | undefined): Promise<string> {
  if (!context?.user?.roles?.includes('admin')) return '';
  try {
    return `shop-settings:\n${await getShopSettingsText(context)}`;
  } catch (error) {
    logger.error(`Failed to read resource shop-settings: ${(error as Error).message}`);
    return '';
  }
}

export const registerSettingsResources = (server: McpServer, context: Context) => {
  server.registerResource(
    'shop-settings',
    'unchained://shop/settings',
    {
      description:
        'Runtime shop settings organized by namespace. Each namespace has a schema for validation. Use updateShopSettings mutation to modify values.',
      mimeType: 'application/json',
    },
    async () => {
      try {
        return {
          contents: [
            {
              uri: 'unchained://shop/settings',
              mimeType: 'application/json',
              text: await getShopSettingsText(context),
            },
          ],
        };
      } catch (error) {
        logger.error(`Failed to read shop settings: ${(error as Error).message}`);
        return { contents: [] };
      }
    },
  );
};
