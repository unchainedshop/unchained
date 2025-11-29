import type * as mcpSDKServerLibraryTypes from '@modelcontextprotocol/sdk/server/streamableHttp.js';
import type * as mcpSDKClientTypes from '@modelcontextprotocol/sdk/types.js';
import type * as mcpSDKServerTypes from '@modelcontextprotocol/sdk/server/mcp.js';
import type { Context } from '../context.js';
import type { FastifyRequest, RouteHandlerMethod } from 'fastify';
import initMCPServer from '../mcp/index.js';
import { createLogger } from '@unchainedshop/logger';

const logger = createLogger('unchained:api:mcp');

let StreamableHTTPServerTransport: typeof mcpSDKServerLibraryTypes.StreamableHTTPServerTransport;
let isInitializeRequest: typeof mcpSDKClientTypes.isInitializeRequest;
let McpServer: typeof mcpSDKServerTypes.McpServer;

try {
  const mcpSDKServerLibrary = await import('@modelcontextprotocol/sdk/server/streamableHttp.js');
  const mcpSDKClient = await import('@modelcontextprotocol/sdk/types.js');
  const mcpSDKServer = await import('@modelcontextprotocol/sdk/server/mcp.js');

  StreamableHTTPServerTransport = mcpSDKServerLibrary.StreamableHTTPServerTransport;
  isInitializeRequest = mcpSDKClient.isInitializeRequest;
  McpServer = mcpSDKServer.McpServer;
} catch {
  logger.warn(`optional peer npm package '@modelcontextprotocol/sdk' not installed, mcp will not work`);
}

const transports: Record<string, mcpSDKServerLibraryTypes.StreamableHTTPServerTransport> = {};

const mcpHandler: RouteHandlerMethod = async (
  req: FastifyRequest & { unchainedContext: Context },
  res,
) => {
  if (!req.unchainedContext.user) {
    res.status(401);
    res.header(
      'WWW-Authenticate',
      `Bearer realm="Unchained MCP", error="invalid_token", resource="${process.env.ROOT_URL || 'http://localhost:4010'}",`,
    );
    return res.send(
      JSON.stringify({
        error: 'invalid_token',
        resource_metadata: `${process.env.ROOT_URL || 'http://localhost:4010'}/.well-known/oauth-protected-resource`,
      }),
    );
  }

  try {
    if (req.method === 'POST') {
      const sessionId = req.headers['mcp-session-id'] as string | undefined;

      let transport: mcpSDKServerLibraryTypes.StreamableHTTPServerTransport;

      if (sessionId && transports[sessionId]) {
        // Reuse existing transport
        transport = transports[sessionId];
      } else if (!sessionId && isInitializeRequest(req.body)) {
        // New initialization request
        transport = new StreamableHTTPServerTransport({
          sessionIdGenerator: () => crypto.randomUUID(),
          onsessioninitialized: (sessionId) => {
            // Store the transport by session ID
            transports[sessionId] = transport;
          },
        });

        // Clean up transport when closed
        transport.onclose = () => {
          if (transport.sessionId) {
            delete transports[transport.sessionId];
          }
        };

        const roles = req.unchainedContext.user.roles || [];
        const server = initMCPServer(
          new McpServer({
            name: 'Unchained MCP Server',
            version: '1.0.0',
          }),
          req.unchainedContext,
          roles,
        );
        await server.connect(transport);
      } else {
        // Invalid request
        return res.status(400).send(
          JSON.stringify({
            jsonrpc: '2.0',
            error: {
              code: -32000,
              message: 'Bad Request: No valid session ID provided',
            },
            id: null,
          }),
        );
      }

      await transport.handleRequest(req.raw, res.raw, req.body);
      return res;
    } else if (req.method === 'GET' || req.method === 'DELETE') {
      const sessionId = req.headers['mcp-session-id'] as string | undefined;
      if (!sessionId || !transports[sessionId]) {
        return res.status(400).send('Invalid or missing session ID');
      }

      const transport = transports[sessionId];
      await transport.handleRequest(req.raw, res.raw);
      return res;
    }

    return res.status(405).send('Method Not Allowed');
  } catch (e) {
    logger.error(e);
    return res.status(503).send({ name: e.name, code: e.code, message: e.message });
  }
};

export default mcpHandler;
