import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { Context } from '../../../context.js';
import { CountriesCountSchema, countriesCountHandler } from './countriesCountHandler.js';
import { ListCountriesSchema, countriesHandler } from './countriesHandler.js';
import { CountrySchema, countryHandler } from './countryHandler.js';
import { CreateCountrySchema, createCountryHandler } from './createCountryHandler.js';
import { RemoveCountrySchema, removeCountryHandler } from './removeCountryHandler.js';
import { UpdateCountrySchema, updateCountryHandler } from './updateCountryHandler.js';

export const registerCountryTools = (server: McpServer, context: Context) => {
  server.tool(
    'country_list',
    'List all available countries in the system. If a non-existing country is provided by a user, inform them it does not exist and must be created first before use.',
    ListCountriesSchema,
    async (params) => countriesHandler(context, params),
  );

  server.tool('country_get', 'Fetch a specific country by its ID.', CountrySchema, async (params) =>
    countryHandler(context, params),
  );

  server.tool(
    'country_create',
    'Create a new country using its ISO 3166-1 alpha-2 code.',
    CreateCountrySchema,
    async (params) => createCountryHandler(context, params),
  );

  server.tool(
    'country_update',
    "Update an existing country's details including ISO code, status, and default currency.",
    UpdateCountrySchema,
    async (params) => updateCountryHandler(context, params),
  );

  server.tool(
    'country_remove',
    'Remove a country by its ID. If the country does not exist, an error will be returned.',
    RemoveCountrySchema,
    async (params) => removeCountryHandler(context, params),
  );

  server.tool(
    'country_count',
    'Count countries, optionally including inactive ones and filtered by search query.',
    CountriesCountSchema,
    async (params) => countriesCountHandler(context, params),
  );
};
