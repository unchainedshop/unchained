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
    'list_languages',
    'List all available languages in the system, if non existing language is provided to you by a user inform them it does not exist and to create it first before they can use it',
    ListLanguagesSchema,
    async (params) => languagesHandler(context, params),
  );

  server.tool(
    'get_language',
    'Gets a single language registered in the system',
    LanguageSchema,
    async (params) => languageHandler(context, params),
  );

  server.tool('add_language', 'Adds new language', CreateLanguageSchema, async (params) =>
    createLanguageHandler(context, params),
  );

  server.tool('update_language', 'Updates language', UpdateLanguageSchema, async (params) =>
    updateLanguageHandler(context, params),
  );

  server.tool('remove_language', 'Deletes a language', RemoveLanguageSchema, async (params) =>
    removeLanguageHandler(context, params),
  );
  server.tool(
    'languages_count',
    'Returns total number of languages registered in the system',
    LanguagesCountSchema,
    async (params) => languagesCountHandler(context, params),
  );
};
