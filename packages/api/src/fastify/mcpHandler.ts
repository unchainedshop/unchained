import { createLogger } from '@unchainedshop/logger';
import { Context } from '../context.js';
import { FastifyRequest, RouteHandlerMethod } from 'fastify';
import { StreamableHTTPServerTransport } from '@modelcontextprotocol/sdk/server/streamableHttp.js';
import { isInitializeRequest } from '@modelcontextprotocol/sdk/types.js';
import createMcpServer from '../mcp/index.js';
import jwt from 'jsonwebtoken';

const logger = createLogger('unchained:mcp-handler');

const transports: Record<string, StreamableHTTPServerTransport> = {};

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

      let transport: StreamableHTTPServerTransport;

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
        const server = createMcpServer(req.unchainedContext, roles);
        await server.connect(transport);
      } else {
        // Invalid request
        res.status(400);
        return res.send(
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
        res.status(400).send('Invalid or missing session ID');
        return;
      }

      const transport = transports[sessionId];
      await transport.handleRequest(req.raw, res.raw);
      return res;
    }

    res.status(405);
    return res.send('Method Not Allowed');
  } catch (e) {
    logger.error(e.message);
    res.status(503);
    return res.send(JSON.stringify({ name: e.name, code: e.code, message: e.message }));
  }
};

export default mcpHandler;
