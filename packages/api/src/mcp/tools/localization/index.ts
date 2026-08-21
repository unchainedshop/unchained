import type { McpServer } from '@modelcontextprotocol/server';
import type { Context } from '../../../context.ts';
import { localizationManagement, LocalizationManagementSchema } from './localizationManagement.ts';

export const registerLocalizationTools = (server: McpServer, context: Context) => {
  server.registerTool(
    'localization_management',
    {
      description:
        'Unified localization management tool for localization operations across geographic, monetary, and language entities. Countries use 2-letter codes (US, DE, FR), currencies use 3-letter codes (USD, EUR, CHF) with optional blockchain support, languages use locale codes (en, de-CH).. Actions: CREATE (add new), UPDATE (modify existing), REMOVE (delete).',
      inputSchema: LocalizationManagementSchema,
    },
    async (params) => localizationManagement(context, params),
  );
};
