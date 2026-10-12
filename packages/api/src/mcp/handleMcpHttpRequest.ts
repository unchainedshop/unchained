import type { McpHttpHandler, McpServer as McpServerType } from '@modelcontextprotocol/server';
import type { Context } from '../context.ts';
import { createLogger } from '@unchainedshop/logger';
import createMcpServer from './index.ts';

const logger = createLogger('unchained:api:mcp');

let createMcpHandler: typeof import('@modelcontextprotocol/server').createMcpHandler;
let McpServer: typeof McpServerType;
let hostHeaderValidationResponse: typeof import('@modelcontextprotocol/server').hostHeaderValidationResponse;
let originValidationResponse: typeof import('@modelcontextprotocol/server').originValidationResponse;
let localhostAllowedHostnames: typeof import('@modelcontextprotocol/server').localhostAllowedHostnames;
let localhostAllowedOrigins: typeof import('@modelcontextprotocol/server').localhostAllowedOrigins;
let InMemoryTransport: typeof import('@modelcontextprotocol/server').InMemoryTransport;

try {
  const mcpSDKServer = await import('@modelcontextprotocol/server');
  createMcpHandler = mcpSDKServer.createMcpHandler;
  McpServer = mcpSDKServer.McpServer;
  InMemoryTransport = mcpSDKServer.InMemoryTransport;
  hostHeaderValidationResponse = mcpSDKServer.hostHeaderValidationResponse;
  originValidationResponse = mcpSDKServer.originValidationResponse;
  localhostAllowedHostnames = mcpSDKServer.localhostAllowedHostnames;
  localhostAllowedOrigins = mcpSDKServer.localhostAllowedOrigins;
} catch (error) {
  if ((error as Error)?.message?.startsWith("Cannot find package '@modelcontextprotocol/server'")) {
    logger.warn(
      `optional peer npm package '@modelcontextprotocol/server' not installed, mcp will not work`,
    );
  } else {
    logger.error(`failed to load '@modelcontextprotocol/server'`, error);
  }
}

// Stateless per-request MCP: every request builds a fresh McpServer from that request's own
// authenticated context, so there is no session to hijack, nothing to leak between principals,
// and the endpoint works multi-replica. The handler itself is a singleton; per-request state
// travels through the pass-through authInfo.
const createUnchainedMcpServer = (context: Context, roles: string[]) =>
  createMcpServer(new McpServer({ name: 'Unchained MCP Server', version: '1.0.0' }), context, roles);

let handler: McpHttpHandler | undefined;
const getHandler = () => {
  handler ??= createMcpHandler(
    async ({ authInfo }) => {
      const { context, roles } = authInfo!.extra as { context: Context; roles: string[] };
      return createUnchainedMcpServer(context, roles);
    },
    { maxRequestBodySize: 10 * 1024 * 1024 },
  );
  return handler;
};

export const isMcpServerAvailable = () => Boolean(McpServer);

export const createInProcessMcpTransport = async (context: Context) => {
  const [clientTransport, serverTransport] = InMemoryTransport.createLinkedPair();
  await createUnchainedMcpServer(context, context.user?.roles ?? []).connect(serverTransport);
  return clientTransport;
};

const resourceUrl = () => process.env.ROOT_URL || 'http://localhost:4010';

const configuredHostname = () => {
  try {
    return new URL(resourceUrl()).hostname;
  } catch {
    return 'localhost';
  }
};

const allowedHostnames = () => [...new Set([...localhostAllowedHostnames(), configuredHostname()])];
const allowedOrigins = () => [...new Set([...localhostAllowedOrigins(), configuredHostname()])];

const LOCAL_HOSTNAMES = ['localhost', '127.0.0.1', '[::1]'];

export const isAllowedBrowserOrigin = (request: Request, pageOrigins: string[] = []) => {
  const origin = request.headers.get('origin');
  if (!origin) return true;
  const page = URL.parse(origin);
  const ownHostnames = [...LOCAL_HOSTNAMES, configuredHostname(), new URL(request.url).hostname];
  return !!page && (pageOrigins.includes(page.origin) || ownHostnames.includes(page.hostname));
};

// All security decisions happen here, before any SDK code runs.
export default async function handleMcpHttpRequest(
  context: Context | undefined,
  request: Request,
): Promise<Response> {
  const user = context?.user;
  if (!user) {
    return Response.json(
      {
        error: 'invalid_token',
        resource_metadata: `${resourceUrl()}/.well-known/oauth-protected-resource`,
      },
      {
        status: 401,
        headers: {
          'WWW-Authenticate': `Bearer realm="Unchained MCP", error="invalid_token", resource="${resourceUrl()}",`,
        },
      },
    );
  }

  // The MCP server is an administrative interface: authorize the admin role on EVERY request.
  const roles = user.roles || [];
  if (!roles.includes('admin')) {
    return Response.json(
      { error: 'forbidden', message: 'MCP requires admin privileges' },
      { status: 403 },
    );
  }

  if (!createMcpHandler) {
    return Response.json(
      {
        error: 'unavailable',
        message: `MCP is enabled but the optional peer npm package '@modelcontextprotocol/server' is not installed`,
      },
      { status: 503 },
    );
  }

  // createMcpHandler is intentionally validation-free. Keep browser Origin and raw Host
  // validation at this owned HTTP boundary to prevent DNS-rebinding/cross-origin access to
  // the administrative MCP surface. Missing Origin is allowed for normal non-browser clients.
  const validationFailure =
    hostHeaderValidationResponse(request, allowedHostnames()) ??
    originValidationResponse(request, allowedOrigins());
  if (validationFailure) return validationFailure;

  return getHandler().fetch(request, {
    // AuthInfo is pass-through in SDK v2 — `extra` carries the request-scoped Unchained
    // context into the server factory above.
    authInfo: {
      token: 'unchained-context',
      clientId: user._id,
      scopes: roles,
      extra: { context, roles },
    },
  });
}
