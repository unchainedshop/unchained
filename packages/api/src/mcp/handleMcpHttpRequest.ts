import type { Context } from '../context.ts';
import createMcpServer from './index.ts';
import {
  configuredHostname,
  createMcpHttpHandler,
  mcpResourceUrl,
  mcpSdk,
} from './createMcpHttpHandler.ts';

const MCP_SERVER_INFO = { name: 'Unchained MCP Server', version: '1.0.0' };

const serveAdminMcp = createMcpHttpHandler(
  MCP_SERVER_INFO,
  (server, context) => createMcpServer(server, context, context.user?.roles ?? []),
  { maxRequestBodySize: 10 * 1024 * 1024 },
);

export const isMcpServerAvailable = () => Boolean(mcpSdk());

export const createInProcessMcpTransport = async (context: Context) => {
  const { InMemoryTransport, McpServer } = mcpSdk()!;
  const [clientTransport, serverTransport] = InMemoryTransport.createLinkedPair();
  await createMcpServer(new McpServer(MCP_SERVER_INFO), context, context.user?.roles ?? []).connect(
    serverTransport,
  );
  return clientTransport;
};

const LOCAL_HOSTNAMES = ['localhost', '127.0.0.1', '[::1]'];

export const isAllowedBrowserOrigin = (request: Request, pageOrigins: string[] = []) => {
  const origin = request.headers.get('origin');
  if (!origin) return true;
  const page = URL.parse(origin);
  const ownHostnames = [...LOCAL_HOSTNAMES, configuredHostname(), new URL(request.url).hostname];
  return !!page && (pageOrigins.includes(page.origin) || ownHostnames.includes(page.hostname));
};

// The MCP server is an administrative interface: authorize the admin role on EVERY request.
export default async function handleMcpHttpRequest(
  context: Context | undefined,
  request: Request,
): Promise<Response> {
  const user = context?.user;
  if (!user) {
    return Response.json(
      {
        error: 'invalid_token',
        resource_metadata: `${mcpResourceUrl()}/.well-known/oauth-protected-resource`,
      },
      {
        status: 401,
        headers: {
          'WWW-Authenticate': `Bearer realm="Unchained MCP", error="invalid_token", resource="${mcpResourceUrl()}",`,
        },
      },
    );
  }

  if (!(user.roles || []).includes('admin')) {
    return Response.json(
      { error: 'forbidden', message: 'MCP requires admin privileges' },
      { status: 403 },
    );
  }

  return serveAdminMcp(request, context!);
}
