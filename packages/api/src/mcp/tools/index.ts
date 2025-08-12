import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { Context } from '../../context.js';
import { registerSystemTools } from './system/index.js';

export const registerOtherTools = (server: McpServer, context: Context) => {
  // Register unified system management tools (worker + event + shopInfo)
  registerSystemTools(server, context);
};
