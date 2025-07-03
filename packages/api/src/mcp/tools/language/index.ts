import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { Context } from '../../../context.js';
import { CreateLanguageSchema, createLanguageHandler } from './createLanguageHandler.js';
import { LanguageSchema, languageHandler } from './languageHandler.js';
import { ListLanguagesSchema, languagesHandler } from './languagesHandler.js';
import { RemoveLanguageSchema, removeLanguageHandler } from './removeLanguageHandler.js';
import { UpdateLanguageSchema, updateLanguageHandler } from './updateLanguageHandler.js';
import { LanguagesCountSchema, languagesCountHandler } from './languagesCountHandler.js';

export const registerLanguageTools = (server: McpServer, context: Context) => {
  server.tool(
    'languages_list',
    'List languages with optional filters, pagination, and sorting',
    ListLanguagesSchema,
    async (params) => languagesHandler(context, params),
  );

  server.tool('language_get', 'Fetch a specific language by ID.', LanguageSchema, async (params) =>
    languageHandler(context, params),
  );

  server.tool(
    'language_create',
    'Create a new language using an ISO code like "en" or "de-CH".',
    CreateLanguageSchema,
    async (params) => createLanguageHandler(context, params),
  );

  server.tool('update_language', 'Update language details', UpdateLanguageSchema, async (params) =>
    updateLanguageHandler(context, params),
  );

  server.tool('language_remove', 'Remove a language by its ID', RemoveLanguageSchema, async (params) =>
    removeLanguageHandler(context, params),
  );
  server.tool(
    'language_count',
    'Return the count of languages, optionally including inactive and filtering by search text.',
    LanguagesCountSchema,
    async (params) => languagesCountHandler(context, params),
  );
};
