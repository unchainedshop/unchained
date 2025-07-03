import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { Context } from '../../context.js';
import { shopInfoHandler } from './shopInfoHandler.js';

export const registerOtherTools = (server: McpServer, context: Context) => {
  server.tool(
    'shop_info',
    'Get the default configuration of the shop including country, language, currency, and locale. If the user does not provide values such as language, locale, country, or currency in their request or it cannot be derived from context, the tool MUST use the following fallback values : - language or locale: use defaultLanguageIsoCode  - country: use country_isoCode - currency: use country_defaultCurrency Always assume these values as the authoritative defaults when user input is missing or ambiguous.',
    {},
    async () => shopInfoHandler(context),
  );
};
