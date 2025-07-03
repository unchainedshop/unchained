import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { Context } from '../../../context.js';
import { ListCurrenciesSchema, currenciesHandler } from './currenciesHandler.js';
import { CurrencySchema, currencyHandler } from './currencyHandler.js';
import { CreateCurrencySchema, createCurrencyHandler } from './createCurrencyHandler.js';
import { CurrenciesCountSchema, currenciesCountHandler } from './currenciesCountHandler.js';
import { RemoveCurrencySchema, removeCurrencyHandler } from './removeCurrencyHandler.js';
import { UpdateCurrencySchema, updateCurrencyHandler } from './updateCurrencyHandler.js';

export const registerCurrencyTools = (server: McpServer, context: Context) => {
  server.tool(
    'currency_list',
    'List currencies with pagination, optional search and sorting.',
    ListCurrenciesSchema,
    async (params) => currenciesHandler(context, params),
  );

  server.tool(
    'currency_get',
    'Retrieve a specific currency by its ID.',
    CurrencySchema,
    async (params) => currencyHandler(context, params),
  );

  server.tool(
    'currency_create',
    'Create a new currency using its ISO code and optional blockchain metadata.',
    CreateCurrencySchema,
    async (params) => createCurrencyHandler(context, params),
  );
  server.tool(
    'currency_update',
    "Update a currency's ISO code, contract address, or decimal precision.",
    UpdateCurrencySchema,
    async (params) => updateCurrencyHandler(context, params),
  );

  server.tool('currency_remove', 'Remove a currency by its ID.', RemoveCurrencySchema, async (params) =>
    removeCurrencyHandler(context, params),
  );

  server.tool(
    'currency_count',
    'Return the total number of currencies, with optional filters for status and search string.',
    CurrenciesCountSchema,
    async (params) => currenciesCountHandler(context, params),
  );
};
