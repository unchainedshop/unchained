import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { Context } from '../../../context.js';
import { localizationManagement, LocalizationManagementSchema } from './localizationManagement.js';

export const registerLocalizationTools = (server: McpServer, context: Context) => {
  server.tool(
    'localization_management',
    'Unified localization management tool for localization operations across geographic, monetary, and language entities. Countries use 2-letter codes (US, DE, FR), currencies use 3-letter codes (USD, EUR, CHF) with optional blockchain support, languages use locale codes (en, de-CH).. Actions: CREATE (add new), UPDATE (modify existing), REMOVE (delete).',
    LocalizationManagementSchema,
    async (params) => localizationManagement(context, params),
  );
};
