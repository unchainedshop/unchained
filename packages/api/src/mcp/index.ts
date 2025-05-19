// import express from 'express';
// import { randomUUID } from 'node:crypto';
import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { Context } from '../context.js';
// import { StreamableHTTPServerTransport } from '@modelcontextprotocol/sdk/server/streamableHttp.js';
// import { isInitializeRequest } from '@modelcontextprotocol/sdk/types.js';

export default function createMcpServer(context: Context) {
  const server = new McpServer({
    name: 'unchained-mcp-server',
    version: '1.0.0',
  });

  server.resource('config', 'config://app', async (uri) => {
    return {
      contents: [
        {
          uri: uri.href,
          text: `Version: ${context.version}`,
        },
      ],
    };
  });

  return server;
}
