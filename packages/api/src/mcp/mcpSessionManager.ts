import type * as mcpSDKServerLibraryTypes from '@modelcontextprotocol/sdk/server/streamableHttp.js';
import type * as mcpSDKClientTypes from '@modelcontextprotocol/sdk/types.js';
import type * as mcpSDKServerTypes from '@modelcontextprotocol/sdk/server/mcp.js';
import type { IncomingMessage, ServerResponse } from 'node:http';
import type { Context } from '../context.ts';
import initMCPServer from './index.ts';
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

// Map of MCP session id -> { transport, userId }. The userId binds a session to the
// principal that initialized it so a session can never be reused by a different user.
const transports: Record<
  string,
  { transport: mcpSDKServerLibraryTypes.StreamableHTTPServerTransport; userId: string }
> = {};

const INVALID_SESSION_RESPONSE = JSON.stringify({
  jsonrpc: '2.0',
  error: {
    code: -32000,
    message: 'Bad Request: No valid session ID provided',
  },
  id: null,
});

export interface MCPRequestParams {
  method: string;
  sessionId: string | undefined;
  body: any;
  userId: string;
  roles: string[];
  context: Context;
  nodeReq: IncomingMessage;
  nodeRes: ServerResponse;
}

export interface MCPAuthResult {
  error?: { status: number; body: string; headers?: Record<string, string> };
  userId?: string;
  roles?: string[];
}

export function authenticateMCP(user: Context['user']): MCPAuthResult {
  const rootUrl = process.env.ROOT_URL || 'http://localhost:4010';

  if (!user) {
    return {
      error: {
        status: 401,
        headers: {
          'WWW-Authenticate': `Bearer realm="Unchained MCP", error="invalid_token", resource="${rootUrl}",`,
        },
        body: JSON.stringify({
          error: 'invalid_token',
          resource_metadata: `${rootUrl}/.well-known/oauth-protected-resource`,
        }),
      },
    };
  }

  if (!(user.roles || []).includes('admin')) {
    return {
      error: {
        status: 403,
        body: JSON.stringify({ error: 'forbidden', message: 'MCP requires admin privileges' }),
      },
    };
  }

  return { userId: user._id, roles: user.roles || [] };
}

export async function handleMCPRequest(params: MCPRequestParams): Promise<void> {
  const { method, sessionId, body, userId, roles, context, nodeReq, nodeRes } = params;

  if (method === 'POST') {
    let transport: mcpSDKServerLibraryTypes.StreamableHTTPServerTransport;

    if (sessionId && transports[sessionId]) {
      if (transports[sessionId].userId !== userId) {
        nodeRes.writeHead(404, { 'Content-Type': 'application/json' });
        nodeRes.end(INVALID_SESSION_RESPONSE);
        return;
      }
      transport = transports[sessionId].transport;
    } else if (!sessionId && isInitializeRequest(body)) {
      transport = new StreamableHTTPServerTransport({
        sessionIdGenerator: () => crypto.randomUUID(),
        onsessioninitialized: (newSessionId) => {
          transports[newSessionId] = { transport, userId };
        },
      });

      transport.onclose = () => {
        if (transport.sessionId) {
          delete transports[transport.sessionId];
        }
      };

      const server = initMCPServer(
        new McpServer({
          name: 'Unchained MCP Server',
          version: '1.0.0',
        }),
        context,
        roles,
      );
      await server.connect(transport);
    } else {
      nodeRes.writeHead(400, { 'Content-Type': 'application/json' });
      nodeRes.end(INVALID_SESSION_RESPONSE);
      return;
    }

    await transport.handleRequest(nodeReq, nodeRes, body);
  } else if (method === 'GET' || method === 'DELETE') {
    if (!sessionId || !transports[sessionId] || transports[sessionId].userId !== userId) {
      nodeRes.writeHead(400, { 'Content-Type': 'text/plain' });
      nodeRes.end('Invalid or missing session ID');
      return;
    }

    const transport = transports[sessionId].transport;
    await transport.handleRequest(nodeReq, nodeRes);
  } else {
    nodeRes.writeHead(405, { 'Content-Type': 'text/plain' });
    nodeRes.end('Method Not Allowed');
  }
}
