import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { Context } from '../../../context.js';
import { createFilterHandler, CreateFilterSchema } from './createFilterHandler.js';
import { updateFilterHandler, UpdateFilterSchema } from './updateFilterHandler.js';
import { removeFilterHandler, RemoveFilterSchema } from './removeFilterHandler.js';
import { createFilterOptionHandler, CreateFilterOptionSchema } from './createFilterOptionHandler.js';
import { updateFilterTextsHandler, UpdateFilterTextsSchema } from './updateFilterTextsHandler.js';
import { removeFilterOptionHandler, RemoveFilterOptionSchema } from './removeFilterOptionHandler.js';
import { getFilterHandler, GetFilterSchema } from './getFilterHandler.js';
import { getFiltersHandler, GetFiltersSchema } from './getFiltersHandler.js';
import {
  translatedFilterTextsHandler,
  TranslatedFilterTextsSchema,
} from './translatedFilterTextsHandler.js';

export const registerFilterTools = (server: McpServer, context: Context) => {
  server.tool(
    'filter_create',
    'Create a new product filter with optional localized titles and subtitles.',
    CreateFilterSchema,
    async (params) => createFilterHandler(context, params),
  );
  server.tool(
    'filter_update',
    'Update a filter by ID with optional changes to key or activation status.',
    UpdateFilterSchema,
    async (params) => updateFilterHandler(context, params),
  );

  server.tool(
    'filter_remove',
    'Remove a filter by its ID, including any associated assortment references.',
    RemoveFilterSchema,
    async (params) => removeFilterHandler(context, params),
  );
  server.tool(
    'filter_option_create',
    'Create a new option under a given filter with optional localized titles and subtitles.',
    CreateFilterOptionSchema,
    async (params) => createFilterOptionHandler(context, params),
  );

  server.tool(
    'filter_updateTexts',
    'Update localized texts for a filter or one of its options.',
    UpdateFilterTextsSchema,
    async (params) => updateFilterTextsHandler(context, params),
  );

  server.tool(
    'filter_option_remove',
    'Remove a specific option from a filter by its value.',
    RemoveFilterOptionSchema,
    async (params) => removeFilterOptionHandler(context, params),
  );

  server.tool('filter_get', 'Retrieve details of a filter by its ID.', GetFilterSchema, async (params) =>
    getFilterHandler(context, params),
  );

  server.tool(
    'filter_list',
    'List filters with optional pagination, query string, and sorting. Can include inactive ones.',
    GetFiltersSchema,
    async (params) => getFiltersHandler(context, params),
  );

  server.tool(
    'filter_getTexts',
    'Retrieve translated texts for a filter or a specific filter option.',
    TranslatedFilterTextsSchema,
    async (params) => translatedFilterTextsHandler(context, params),
  );
};
