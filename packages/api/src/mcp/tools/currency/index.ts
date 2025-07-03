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
    'list_currencies',
    'List all available currencies in the system, if non existing currency is provided to you by a user inform them it does not exist and to create it first before they can use it',
    ListCurrenciesSchema,
    async (params) => currenciesHandler(context, params),
  );

  server.tool(
    'get_currency',
    'Gets a single currency registered in the system',
    CurrencySchema,
    async (params) => currencyHandler(context, params),
  );

  server.tool(
    'add_currency',
    'Adds new currency information to the system',
    CreateCurrencySchema,
    async (params) => createCurrencyHandler(context, params),
  );
  server.tool(
    'update_currency',
    'Updates the specified currency in the system',
    UpdateCurrencySchema,
    async (params) => updateCurrencyHandler(context, params),
  );

  server.tool(
    'delete_currency',
    'Deletes the specified currency from the system',
    RemoveCurrencySchema,
    async (params) => removeCurrencyHandler(context, params),
  );

  server.tool(
    'currencies_count',
    'Returns total number of currencies registered in the system',
    CurrenciesCountSchema,
    async (params) => currenciesCountHandler(context, params),
  );
};
