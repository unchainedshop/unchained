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
    'List countries with optional pagination, search, sorting, and inactive flag.',
    ListCountriesSchema,
    async (params) => countriesHandler(context, params),
  );

  server.tool('country_get', 'Retrieve a country by ID', CountrySchema, async (params) =>
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
    'Update details for a given country',
    UpdateCountrySchema,
    async (params) => updateCountryHandler(context, params),
  );

  server.tool('country_remove', 'Remove a country by its ID', RemoveCountrySchema, async (params) =>
    removeCountryHandler(context, params),
  );

  server.tool(
    'country_count',
    'Return the number of countries, optionally filtered by search or inactive status.',
    CountriesCountSchema,
    async (params) => countriesCountHandler(context, params),
  );
};
