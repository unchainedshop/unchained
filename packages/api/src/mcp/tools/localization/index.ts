import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { Context } from '../../../context.js';
import { createLocalization, CreateLocalizationSchema } from './createLocalization.js';
import { updateLocalization, UpdateLocalizationSchema } from './updateLocalization.js';
import { removeLocalization, RemoveLocalizationSchema } from './removeLocalization.js';
import { getLocalization, GetLocalizationSchema } from './getLocalization.js';
import { listLocalizations, ListLocalizationsSchema } from './listLocalizations.js';
import { countLocalizations, CountLocalizationsSchema } from './countLocalizations.js';

export const registerLocalizationTools = (server: McpServer, context: Context) => {
  server.tool(
    'localization_create',
    'Create geographic, monetary, or language entities for internationalization. Countries use 2-letter codes (US, DE, FR), currencies use 3-letter codes (USD, EUR, CHF) with optional blockchain support, languages use locale codes (en, de-CH, fr-CA). Validates ISO format and initializes with system defaults.',
    CreateLocalizationSchema,
    async (params) => createLocalization(context, params),
  );

  server.tool(
    'localization_update',
    'Modify existing localization entities with partial data updates. Maintains ISO format validation - only provide fields to change. Currency blockchain fields (contractAddress, decimals) are automatically ignored for countries/languages. Use localization_get to see current values first.',
    UpdateLocalizationSchema,
    async (params) => updateLocalization(context, params),
  );

  server.tool(
    'localization_remove',
    'Soft delete localization entities while preserving data for audit trails. Entity becomes inactive but remains in database. Use localization_list with includeInactive=false to verify removal from active listings. Returns final entity state before deletion.',
    RemoveLocalizationSchema,
    async (params) => removeLocalization(context, params),
  );

  server.tool(
    'localization_get',
    'Fetch complete details for a specific localization entity including ISO codes, names, and currency-specific blockchain data. Use localization_list first to find available entity IDs. Returns full entity configuration and current status.',
    GetLocalizationSchema,
    async (params) => getLocalization(context, params),
  );

  server.tool(
    'localization_list',
    'Browse localization entities with advanced filtering and pagination. Search by ISO codes or names, control active/inactive visibility, customize sorting by any field. Essential for finding entity IDs before get/update/remove operations. Supports large datasets with efficient pagination.',
    ListLocalizationsSchema,
    async (params) => listLocalizations(context, params),
  );

  server.tool(
    'localization_count',
    'Get total counts for pagination and analytics. Applies same filters as localization_list (search, inactive inclusion) but returns only the count. Useful for calculating total pages, showing "X of Y results", and system analytics dashboards.',
    CountLocalizationsSchema,
    async (params) => countLocalizations(context, params),
  );
};
