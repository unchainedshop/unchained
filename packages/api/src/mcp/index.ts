import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { z } from 'zod';
import { Context } from '../context.js';

export default function createMcpServer(context: Context) {
  const server = new McpServer({
    name: 'Unchained MCP Server',
    version: '1.0.0',
  });

  server.tool(
    'hello-world',
    'Say hello',
    {
      name: z.string().describe('Name of the person to greet'),
    },
    async ({ name }) => {
      // Here you would implement the logic for the Unchained tool
      return {
        content: [{ type: 'text', text: `Hello ${name}!` }],
      };
    },
  );

  // server.resource('config', 'config://app', async (uri) => {
  //   return {
  //     contents: [
  //       {
  //         uri: uri.href,
  //         mimeType: 'application/json',
  //         text: {
  //           version: context.version,
  //         },
  //       },
  //     ],
  //   };
  // });

  return server;
}
