import type * as mcpSDKServerLibraryTypes from '@modelcontextprotocol/sdk/server/streamableHttp.js';
import type * as mcpSDKClientTypes from '@modelcontextprotocol/sdk/types.js';
import type * as mcpSDKServerTypes from '@modelcontextprotocol/sdk/server/mcp.js';
import type { Context } from '../context.ts';
import type { Request, RequestHandler } from 'express';
import { createLogger } from '@unchainedshop/logger';

const logger = createLogger('unchained:api:mcp');

let StreamableHTTPServerTransport: typeof mcpSDKServerLibraryTypes.StreamableHTTPServerTransport;
let isInitializeRequest: typeof mcpSDKClientTypes.isInitializeRequest;
let McpServer: typeof mcpSDKServerTypes.McpServer;

try {
  const mcpSDKServerLibrary = await import('@modelcontextprotocol/sdk/server/streamableHttp.js');
  const mcpSDKClient = await import('@modelcontextprotocol/sdk/types.js');
  const mcpSDKServer = await import('@modelcontextprotocol/sdk/server/mcp.js');

  McpServer = mcpSDKServer.McpServer;
  StreamableHTTPServerTransport = mcpSDKServerLibrary.StreamableHTTPServerTransport;
  isInitializeRequest = mcpSDKClient.isInitializeRequest;
} catch {
  logger.warn(`optional peer npm package '@modelcontextprotocol/sdk' not installed, mcp will not work`);
}

// Map of MCP session id -> { transport, userId }. The userId binds a session to the
// principal that initialized it so a session can never be reused by a different user.
const transports: Record<
  string,
  { transport: mcpSDKServerLibraryTypes.StreamableHTTPServerTransport; userId: string }
> = {};

const handlePostRequest: RequestHandler = async (req: Request & { unchainedContext: Context }, res) => {
  // Check for existing session ID

  const sessionId = req.headers['mcp-session-id'] as string | undefined;
  const currentUserId = req.unchainedContext.user!._id;

  let transport: mcpSDKServerLibraryTypes.StreamableHTTPServerTransport;

  if (sessionId && transports[sessionId]) {
    // Reuse existing transport — only by the user that initialized the session.
    if (transports[sessionId].userId !== currentUserId) {
      res.status(404).json({
        jsonrpc: '2.0',
        error: {
          code: -32000,
          message: 'Bad Request: No valid session ID provided',
        },
        id: null,
      });
      return;
    }
    transport = transports[sessionId].transport;
  } else if (!sessionId && isInitializeRequest(req.body)) {
    // New initialization request
    transport = new StreamableHTTPServerTransport({
      sessionIdGenerator: () => crypto.randomUUID(),
      onsessioninitialized: (sessionId) => {
        // Store the transport bound to the initializing user
        transports[sessionId] = { transport, userId: currentUserId };
      },
    });

    // Clean up transport when closed
    transport.onclose = () => {
      if (transport.sessionId) {
        delete transports[transport.sessionId];
      }
    };

    const roles = req.unchainedContext.user?.roles || [];

    const { default: initMCPServer } = await import('../mcp/index.ts');
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
    res.status(400).json({
      jsonrpc: '2.0',
      error: {
        code: -32000,
        message: 'Bad Request: No valid session ID provided',
      },
      id: null,
    });
    return;
  }

  // Handle the request
  await transport.handleRequest(req, res, req.body);
};

// Reusable handler for GET and DELETE requests
const handleSessionRequest: RequestHandler = async (
  req: Request & { unchainedContext: Context },
  res,
) => {
  const sessionId = req.headers['mcp-session-id'] as string | undefined;
  if (
    !sessionId ||
    !transports[sessionId] ||
    transports[sessionId].userId !== req.unchainedContext.user!._id
  ) {
    res.status(400).send('Invalid or missing session ID');
    return;
  }

  const transport = transports[sessionId].transport;
  await transport.handleRequest(req, res);
};

const createMCPMiddleware: RequestHandler = (req, res, next) => {
  const user = (req as any).unchainedContext.user;
  if (!user) {
    res.status(401);
    res.header(
      'WWW-Authenticate',
      `Bearer realm="Unchained MCP", error="invalid_token", resource="${process.env.ROOT_URL || 'http://localhost:4010'}",`,
    );
    res.json({
      error: 'invalid_token',
      resource_metadata: `${process.env.ROOT_URL || 'http://localhost:4010'}/.well-known/oauth-protected-resource`,
    });
    return;
  }

  // The MCP server is an administrative interface. Authorize the admin role on EVERY
  // request (not only at session initialization), so an authenticated non-admin can
  // never reach the session-reuse path with someone else's session id.
  if (!(user.roles || []).includes('admin')) {
    res.status(403).json({ error: 'forbidden', message: 'MCP requires admin privileges' });
    return;
  }

  if (req.method === 'POST') {
    return handlePostRequest(req, res, next);
  } else if (req.method === 'GET' || req.method === 'DELETE') {
    return handleSessionRequest(req, res, next);
  }
  res.status(405).send('Method Not Allowed');
};

export default createMCPMiddleware;
